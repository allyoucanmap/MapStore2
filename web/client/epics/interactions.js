/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Rx from 'rxjs';
import get from 'lodash/get';
import sortBy from 'lodash/sortBy';
import { getMainMapZoomToPadding } from '../utils/MapWidgetUtils';
import { mapPaddingSelector } from '../selectors/maplayout';
import bbox from '@turf/bbox';
import xml2js from 'xml2js';

import { getFeatureLayer } from '../api/WFS';
import { updateWidgetProperty, INSERT, UPDATE, DELETE } from '../actions/widgets';
import { APPLY_WIDGET_INTERACTIONS, applyWidgetInteractions, ZOOM_TO_FILTER_EXTENT } from '../actions/interactions';
import { zoomToExtent } from '../actions/map';
import { setCurrentTime } from '../actions/dimension';
import { REMOVE_NODE, changeLayerProperties, changeLayerParams } from '../actions/layers';
import wpsBounds from '../observables/wps/bounds';
import {
    extractLayerIdFromNodePath,
    extractMapIdFromNodePath,
    extractWidgetIdFromNodePath,
    isInteractionSender,
    isMapLayerPath,
    TARGET_TYPES,
    findAllApplyFiltersForZoomTo
} from '../utils/InteractionUtils';
import {
    TARGET_EFFECTS,
    SENDER_DATA_BUILDERS,
    getSenderSourceIds,
    cleanupEffectsBySenderId,
    cleanupEffectsOfDeletedInteractions,
    cleanupInteractionsAfterLayerDeletion,
    cleanupInteractionsAfterWidgetDeletion,
    INTERACTION_UPDATES
} from '../utils/InteractionEffectsUtils';
import { toOGCFilter } from '../utils/FilterUtils';
import { getWFSLayerName, getWpsUrl } from '../utils/LayersUtils';
import { getLayerFromId, layersSelector } from '../selectors/layers';
import { shouldSkipInteraction } from '../selectors/widgets';

const getContainerWidgets = (state, target) => get(state, `widgets.containers[${target}].widgets`) || [];

const getEffectsContext = (state, target) => ({
    layers: layersSelector(state) || [],
    widgets: getContainerWidgets(state, target),
    target
});

const UPDATE_TO_ACTION = {
    [INTERACTION_UPDATES.LAYER_PROPERTIES]: ({ layerId, properties }) => changeLayerProperties(layerId, properties),
    [INTERACTION_UPDATES.LAYER_PARAMS]: ({ layerId, params }) => changeLayerParams(layerId, params),
    [INTERACTION_UPDATES.WIDGET_PROPERTY]: ({ widgetId, key, value, mode, target }) => updateWidgetProperty(widgetId, key, value, mode, target),
    [INTERACTION_UPDATES.CURRENT_TIME]: ({ value }) => setCurrentTime(value)
};

const toActions = (updates = []) => updates.map(update => UPDATE_TO_ACTION[update?.type]?.(update)).filter(Boolean);

// ============================================================================
// Zoom to
// ============================================================================

/**
 * Resolves the actual layer object referenced by a plugged 'applyFilter' interaction,
 * either from the main map or from a dashboard map widget.
 * @param {object} applyFilterInteraction - The plugged applyFilter interaction
 * @param {object} state - Redux state
 * @param {string} targetContainer - The widget container target
 * @returns {object} `{layer, mapWidgetId, mapId}` (mapWidgetId/mapId set only for dashboard maps)
 */
function resolveZoomToLayer(applyFilterInteraction, state, targetContainer) {
    const nodePath = applyFilterInteraction?.target?.nodePath;
    const layerId = extractLayerIdFromNodePath(nodePath);
    if (!layerId) {
        return {};
    }

    if (isMapLayerPath(nodePath)) {
        return { layer: getLayerFromId(state, layerId) };
    }

    const mapWidgetId = extractWidgetIdFromNodePath(nodePath);
    const mapId = extractMapIdFromNodePath(nodePath);
    const widgets = get(state, `widgets.containers[${targetContainer}].widgets`) || [];
    const mapWidget = widgets.find(w => w.id === mapWidgetId);
    const map = mapWidget?.maps?.find(m => m.mapId === mapId);
    const layer = map?.layers?.find(l => l.id === layerId);
    return { layer, mapWidgetId, mapId };
}

/**
 * Builds the zoom-dispatch action for a resolved extent, targeting either the main map
 * (via the global zoomToExtent action) or a dashboard map widget (via a `zoomToRequest`
 * set on the widget's `maps[]` entry, consumed by the `interactionZoomToExtent` enhancer).
 * @param {number[]} extent - `[minx, miny, maxx, maxy]` in EPSG:4326
 * @param {object} resolvedLayer - `{mapWidgetId, mapId}` from `resolveZoomToLayer`
 * @param {string} targetContainer - The widget container target
 * @param {object} [padding] - Optional `{top, right, bottom, left}` pixel padding for widget occlusion
 * @returns {object} Action to dispatch
 */
function buildZoomToExtentAction(extent, { mapWidgetId, mapId }, targetContainer, padding) {
    if (!mapWidgetId) {
        return zoomToExtent(extent, "EPSG:4326", undefined, padding ? { padding } : undefined);
    }
    return updateWidgetProperty(mapWidgetId, 'maps', {
        mapId,
        zoomToRequest: { extent, crs: "EPSG:4326", ...(padding ? { padding } : {}) }
    }, 'merge', targetContainer);
}

/**
 * Fetches a layer's filtered extent using WPS as the primary method,
 * falling back to WFS
 * @param {object} layer - The layer object with layerFilter and url
 * @returns {Observable<number[]>} Observable of extent array
 */
function fetchLayerExtent(layer) {
    const wfsFallback = () => Rx.Observable.fromPromise(getFeatureLayer(layer)).map(response => bbox(response.data));
    const wpsUrl = getWpsUrl(layer);
    const filterObj = layer.layerFilter;
    const featureTypeName = getWFSLayerName(layer);
    if (!wpsUrl || !featureTypeName) {
        return Rx.Observable.throw(new Error('No WPS URL or feature type name'));
    }
    const wfsGetFeature = filterObj
        ? toOGCFilter(featureTypeName, {
            ...filterObj,
            options: { ...(filterObj.options || {}), noSchemaLocation: true }
        }, '1.1.0')
        : toOGCFilter(featureTypeName, { options: { noSchemaLocation: true } }, '1.1.0');

    return wpsBounds(wpsUrl, { wfsGetFeature })
        .map(data => {
            let sw;
            let ne;
            xml2js.parseString(data, { explicitArray: false }, (ignore, result) => {
                const json = result['ows:BoundingBox'];
                sw = json['ows:LowerCorner'].split(' ');
                ne = json['ows:UpperCorner'].split(' ');
            });
            const extent = [parseFloat(sw[0]), parseFloat(sw[1]), parseFloat(ne[0]), parseFloat(ne[1])];
            // WPS returns [0, 0, -1, -1] for empty results
            if (extent[0] === 0 && extent[1] === 0 && extent[2] === -1 && extent[3] === -1) {
                throw new Error('No features found matching the filter');
            }
            return extent;
        }).catch(() => wfsFallback());
}

/**
 * Resolves and combines the filtered extents of connected layers and zooms the target map.
 * @param {object} interaction - The plugged zoomTo interaction
 * @param {object} sender - The sender widget owning the interaction
 * @param {object} state - Redux state
 * @param {string} targetContainer - The widget container target
 * @returns {Observable} Observable emitting zero or one action
 */
function applyInteractionEffectForZoomTo(interaction, sender, state, targetContainer = 'floating') {
    const siblingInteractions = sender.interactions || [];
    const zoomToInteractions = findAllApplyFiltersForZoomTo(interaction, siblingInteractions);
    if (zoomToInteractions.length === 0) {
        return Rx.Observable.empty();
    }

    // Resolve all connected layers
    const resolvedLayers = zoomToInteractions
        .map(zoomInteraction => resolveZoomToLayer(zoomInteraction, state, targetContainer))
        .filter(({layer} = {}) => layer);
    if (resolvedLayers.length === 0) {
        return Rx.Observable.empty();
    }

    // Fetch extents for all layers concurrently
    return Rx.Observable.forkJoin(
        resolvedLayers.map(({layer} = {}) => fetchLayerExtent(layer).catch(() => Rx.Observable.of(null)))
    )
        .switchMap(extents => {
            const validExtents = extents.filter(Boolean);
            if (validExtents.length === 0) {
                return Rx.Observable.empty();
            }
            const unionExtent = validExtents.reduce((acc, ext) => [
                Math.min(acc[0], ext[0]),
                Math.min(acc[1], ext[1]),
                Math.max(acc[2], ext[2]),
                Math.max(acc[3], ext[3])
            ]);

            // Get unique map targets
            const uniqueTargets = [];
            const seen = new Set();
            resolvedLayers.forEach(rl => {
                const key = `${rl.mapWidgetId || 'main'}-${rl.mapId || 'main'}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueTargets.push(rl);
                }
            });

            const actions = uniqueTargets.map(target => {
                const padding = target.mapWidgetId
                    ? undefined
                    : getMainMapZoomToPadding(mapPaddingSelector(state));
                return buildZoomToExtentAction(unionExtent, target, targetContainer, padding);
            });
            return Rx.Observable.from(actions);
        })
        .catch(() => Rx.Observable.empty());
}
// ============================================================================
// Epics
// ============================================================================

/**
 * Applies the effects of the plugged interactions of a sender source (e.g. a filter of a filter widget).
 * Zoom-to interactions are applied last, and only on manual trigger or when auto zoom is enabled.
 */
export const applyWidgetInteractionsEpic = (action$, store) =>
    action$
        .ofType(APPLY_WIDGET_INTERACTIONS, ZOOM_TO_FILTER_EXTENT)
        .switchMap(({ type, widgetId, target, sourceId }) => {
            const isManualZoomTrigger = type === ZOOM_TO_FILTER_EXTENT;
            const sender = getContainerWidgets(store.getState(), target).find(w => w.id === widgetId);
            const buildAppliedData = SENDER_DATA_BUILDERS[sender?.widgetType];
            if (!buildAppliedData) {
                return Rx.Observable.empty();
            }
            const pluggedInteractions = sortBy(
                (sender.interactions || []).filter(interaction => interaction.plugged === true
                    && interaction.source.nodePath.includes(sourceId)
                    && !!interaction.targetType
                    && (!isManualZoomTrigger || interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO)
                ),
                // zoom-to resolves the extent of the layers already filtered by the other interactions
                interaction => interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO ? 1 : 0
            );
            return Rx.Observable.from(pluggedInteractions)
                .concatMap(interaction => {
                    const currentState = store.getState();
                    if (interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO) {
                        return isManualZoomTrigger || interaction?.configuration?.autoZoom === true
                            ? applyInteractionEffectForZoomTo(interaction, sender, currentState, target)
                            : Rx.Observable.empty();
                    }
                    const applyEffect = TARGET_EFFECTS[interaction.targetType];
                    if (!applyEffect || shouldSkipInteraction(interaction, currentState)) {
                        return Rx.Observable.empty();
                    }
                    const update = applyEffect({
                        ...interaction,
                        appliedData: buildAppliedData(sender, sourceId, interaction)
                    }, getEffectsContext(currentState, target));
                    return Rx.Observable.from(toActions([update]));
                });
        });

const reapplyAllSendersInteractions = (store, target) => Rx.Observable.defer(() =>
    Rx.Observable.from(getContainerWidgets(store.getState(), target).filter(isInteractionSender))
        .switchMap(sender => Rx.Observable.from(getSenderSourceIds(sender))
            .switchMap(sourceId => Rx.Observable.of(applyWidgetInteractions(sender.id, target, sourceId)))
        )
);

/**
 * Keeps the applied effects aligned with widgets and layers:
 * - DELETE: removes interactions targeting the deleted widget and the effects of a deleted sender
 * - REMOVE_NODE: removes interactions targeting the deleted main map layer
 * - INSERT/UPDATE of a sender: removes its effects, then reapplies the interactions of all senders
 */
export const cleanupAndReapplyWidgetInteractionsEpic = (action$, store) =>
    action$
        .ofType(DELETE, INSERT, UPDATE, REMOVE_NODE)
        .mergeMap((action) => {
            const state = store.getState();
            const target = action.target || 'floating';
            if (action.type === REMOVE_NODE) {
                return action.nodeType === 'layers'
                    ? Rx.Observable.from(toActions(cleanupInteractionsAfterLayerDeletion(action.node, getEffectsContext(state, 'floating'))))
                    : Rx.Observable.empty();
            }
            const widget = action.widget;
            const widgetId = action.type === INSERT ? action.id || widget?.id : widget?.id;
            if (!widgetId) {
                return Rx.Observable.empty();
            }
            const context = getEffectsContext(state, target);
            if (action.type === DELETE) {
                return Rx.Observable.from(toActions([
                    ...cleanupInteractionsAfterWidgetDeletion(widgetId, context),
                    ...(isInteractionSender(widget) ? cleanupEffectsBySenderId(widgetId, { ...context, sender: widget }) : [])
                ]));
            }
            if (!isInteractionSender(widget)) {
                return Rx.Observable.empty();
            }
            return Rx.Observable.from(toActions([
                ...cleanupEffectsBySenderId(widgetId, context),
                ...cleanupEffectsOfDeletedInteractions(action.deletedInteractions, context)
            ])).concat(reapplyAllSendersInteractions(store, target));
        });

export default {
    applyWidgetInteractionsEpic,
    cleanupAndReapplyWidgetInteractionsEpic
};
