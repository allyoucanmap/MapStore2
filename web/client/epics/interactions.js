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
import isEqual from 'lodash/isEqual';
import uniqBy from 'lodash/uniqBy';
import { getMainMapZoomToPadding } from '../utils/MapWidgetUtils';
import { mapPaddingSelector } from '../selectors/maplayout';
import bbox from '@turf/bbox';
import xml2js from 'xml2js';

import { getFeatureLayer } from '../api/WFS';
import { updateWidgetProperty, editWidget, INSERT, UPDATE, DELETE, UPDATE_PROPERTY, SET_LINKED_DASHBOARD_DATA } from '../actions/widgets';
import { APPLY_WIDGET_INTERACTIONS, applyWidgetInteractions, ZOOM_TO_FILTER_EXTENT, EDIT_MAIN_MAP_INTERACTIONS } from '../actions/interactions';
import { zoomToExtent, CHANGE_MAP_VIEW } from '../actions/map';
import { setCurrentTime } from '../actions/dimension';
import { REMOVE_NODE, changeLayerProperties, changeLayerParams } from '../actions/layers';
import { DASHBOARD_LOADED } from '../actions/dashboard';
import { MAP_CONFIG_LOADED } from '../actions/config';
import wpsBounds from '../observables/wps/bounds';
import {
    extractLayerIdFromNodePath,
    extractMapIdFromNodePath,
    extractWidgetIdFromNodePath,
    isInteractionSender,
    hasSenderOwnZoomExtent,
    isSenderTriggerUpdate,
    isMapLayerPath,
    isMainMapLevelTarget,
    isMainMapWidget,
    createMainMapWidget,
    MAIN_MAP_WIDGET_ID,
    MAIN_MAP_ID,
    TARGET_TYPES,
    findAllApplyFiltersForZoomTo
} from '../utils/InteractionUtils';
import {
    TARGET_EFFECTS,
    SENDER_DATA_BUILDERS,
    SENDER_ZOOM_EXTENT_LAYERS,
    EVENT_TARGET_TYPES,
    isTransientEffectSender,
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
import { mapSelector } from '../selectors/map';
import { shouldSkipInteraction, getEditingWidget } from '../selectors/widgets';

// waits for typing to settle before requesting the extent and moving the map
const AUTO_ZOOM_DEBOUNCE = 400;

const getContainerWidgets = (state, target) => get(state, `widgets.containers[${target}].widgets`) || [];

const getEffectsContext = (state, target) => ({
    layers: layersSelector(state) || [],
    widgets: getContainerWidgets(state, target),
    target,
    mainMapPadding: getMainMapZoomToPadding(mapPaddingSelector(state))
});

const UPDATE_TO_ACTION = {
    [INTERACTION_UPDATES.LAYER_PROPERTIES]: ({ layerId, properties }) => changeLayerProperties(layerId, properties),
    [INTERACTION_UPDATES.LAYER_PARAMS]: ({ layerId, params }) => changeLayerParams(layerId, params),
    [INTERACTION_UPDATES.WIDGET_PROPERTY]: ({ widgetId, key, value, mode, target }) => updateWidgetProperty(widgetId, key, value, mode, target),
    [INTERACTION_UPDATES.CURRENT_TIME]: ({ value }) => setCurrentTime(value),
    [INTERACTION_UPDATES.ZOOM_TO_EXTENT]: ({ extent, crs, maxZoom, padding }) => zoomToExtent(extent, crs, maxZoom, padding ? { padding } : undefined)
};

const toActions = (updates = []) => updates.map(update => UPDATE_TO_ACTION[update?.type]?.(update)).filter(Boolean);

// re-applying unchanged effects would make every receiver fetch again, e.g. on each map widget update
// the receiving map emits its own view change with rounding differences, a tolerance avoids sync loops
const VIEW_TOLERANCE = 1e-6;
const isSameMapValue = (map = {}, value = {}) => Object.keys(value).filter(key => key !== 'mapId').every(key => key === 'center'
    ? Math.abs((map.center?.x ?? NaN) - value.center?.x) < VIEW_TOLERANCE && Math.abs((map.center?.y ?? NaN) - value.center?.y) < VIEW_TOLERANCE
    : isEqual(map[key], value[key]));

const isNoOpUpdate = (update, state) => {
    if (update?.type === INTERACTION_UPDATES.WIDGET_PROPERTY && update.mode === 'merge' && update.key === 'maps') {
        const widget = getContainerWidgets(state, update.target || 'floating').find(w => w.id === update.widgetId);
        const map = widget?.maps?.find(m => m.mapId === update.value?.mapId);
        return !!map && isSameMapValue(map, update.value);
    }
    if (update?.type === INTERACTION_UPDATES.WIDGET_PROPERTY && update.mode !== 'merge') {
        const widget = getContainerWidgets(state, update.target || 'floating').find(w => w.id === update.widgetId);
        return !!widget && isEqual(get(widget, update.key), update.value);
    }
    if (update?.type === INTERACTION_UPDATES.LAYER_PROPERTIES) {
        const layer = (layersSelector(state) || []).find(l => l.id === update.layerId);
        return !!layer && Object.keys(update.properties || {}).every(key => isEqual(layer[key], update.properties[key]));
    }
    return false;
};

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

const getMapTargetKey = ({ mapWidgetId, mapId }) => `${mapWidgetId || 'main'}-${mapId || 'main'}`;

const resolveZoomToMapTarget = (nodePath) => isMainMapLevelTarget(nodePath)
    ? {}
    : { mapWidgetId: extractWidgetIdFromNodePath(nodePath), mapId: extractMapIdFromNodePath(nodePath) };

/**
 * Returns the layers to compute the extent from and the maps to zoom, from the sender data or from the filtered layers
 * @param {object} interaction the plugged zoom-to interaction
 * @param {object} sender the sender widget
 * @param {object} state redux state
 * @param {string} targetContainer the widget container target
 * @returns {object} `{ layers, mapTargets }`
 */
function resolveZoomToSources(interaction, sender, state, targetContainer) {
    const getOwnLayers = SENDER_ZOOM_EXTENT_LAYERS[sender?.widgetType];
    if (getOwnLayers) {
        return { layers: getOwnLayers(sender), mapTargets: [resolveZoomToMapTarget(interaction?.target?.nodePath)] };
    }
    const resolvedLayers = findAllApplyFiltersForZoomTo(interaction, sender?.interactions || [])
        .map(applyFilterInteraction => resolveZoomToLayer(applyFilterInteraction, state, targetContainer))
        .filter(({ layer } = {}) => layer);
    return {
        layers: resolvedLayers.map(({ layer }) => layer),
        mapTargets: uniqBy(resolvedLayers, getMapTargetKey)
    };
}

/**
 * Resolves and combines the filtered extents of the zoom-to sources and zooms the target maps
 * @param {object} interaction the plugged zoom-to interaction
 * @param {object} sender the sender widget owning the interaction
 * @param {object} state redux state
 * @param {string} targetContainer the widget container target
 * @returns {Observable} zoom actions
 */
function applyInteractionEffectForZoomTo(interaction, sender, state, targetContainer = 'floating') {
    const { layers, mapTargets } = resolveZoomToSources(interaction, sender, state, targetContainer);
    if (layers.length === 0 || mapTargets.length === 0) {
        return Rx.Observable.empty();
    }

    // Fetch extents for all layers concurrently
    return Rx.Observable.forkJoin(
        layers.map(layer => fetchLayerExtent(layer).catch(() => Rx.Observable.of(null)))
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

            const actions = mapTargets.map(target => {
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
 * Applies the event data to the plugged interactions of the event target types (e.g. a table row click, a legend change)
 * The widget being edited is the sender when it is not in the container yet (e.g. the legend preview of a new legend)
 */
function applyEventInteractions(state, { widgetId, target, sourceId, event }) {
    const editingWidget = getEditingWidget(state);
    const sender = getContainerWidgets(state, target).find(w => w.id === widgetId)
        || (editingWidget?.id === widgetId ? editingWidget : undefined);
    const context = getEffectsContext(state, target);
    const updates = (sender?.interactions || [])
        .filter(interaction => interaction.plugged === true
            && interaction.source?.nodePath?.includes(sourceId)
            && (event.targetTypes || []).includes(interaction.targetType))
        .map(interaction => TARGET_EFFECTS[interaction.targetType]?.({ ...interaction, appliedData: event.data }, context))
        .filter(update => update && !isNoOpUpdate(update, state));
    return Rx.Observable.from(toActions(updates));
}

/**
 * Applies the plugged interactions of a sender source, zoom-to last and only if manual or auto zoom; with an event, only its target types with its data
 */
export const applyWidgetInteractionsEpic = (action$, store) =>
    action$
        .ofType(APPLY_WIDGET_INTERACTIONS, ZOOM_TO_FILTER_EXTENT)
        // a newer apply cancels the pending one of the same sender source only, other senders keep their zoom; events never cancel state applies
        .groupBy(({ widgetId, target, sourceId, event }) => `${target}:${widgetId}:${sourceId}:${event ? 'event' : 'state'}`)
        .mergeMap(sourceAction$ => sourceAction$.switchMap(({ type, widgetId, target, sourceId, event }) => {
            if (event) {
                return applyEventInteractions(store.getState(), { widgetId, target, sourceId, event });
            }
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
                    && !EVENT_TARGET_TYPES.includes(interaction.targetType)
                    && (!isManualZoomTrigger || interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO)
                ),
                // zoom-to resolves the extent of the layers already filtered by the other interactions
                interaction => interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO ? 1 : 0
            );
            return Rx.Observable.from(pluggedInteractions)
                .concatMap(interaction => {
                    const currentState = store.getState();
                    if (interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO) {
                        if (isManualZoomTrigger) {
                            return applyInteractionEffectForZoomTo(interaction, sender, currentState, target);
                        }
                        // a newer apply cancels the pending zoom through switchMap
                        return interaction?.configuration?.autoZoom === true || hasSenderOwnZoomExtent(sender)
                            ? Rx.Observable.timer(AUTO_ZOOM_DEBOUNCE).switchMap(() => applyInteractionEffectForZoomTo(interaction, sender, store.getState(), target))
                            : Rx.Observable.empty();
                    }
                    const applyEffect = TARGET_EFFECTS[interaction.targetType];
                    if (!applyEffect || shouldSkipInteraction(interaction, currentState)) {
                        return Rx.Observable.empty();
                    }
                    const context = getEffectsContext(currentState, target);
                    const update = applyEffect({
                        ...interaction,
                        appliedData: buildAppliedData(sender, sourceId, interaction, context),
                        "transient": isTransientEffectSender(sender)
                    }, context);
                    return Rx.Observable.from(toActions(isNoOpUpdate(update, currentState) ? [] : [update]));
                });
        }));

const reapplyAllSendersInteractions = (store, target) => Rx.Observable.defer(() =>
    Rx.Observable.from(getContainerWidgets(store.getState(), target).filter(isInteractionSender))
        .switchMap(sender => Rx.Observable.from(getSenderSourceIds(sender))
            .switchMap(sourceId => Rx.Observable.of(applyWidgetInteractions(sender.id, target, sourceId)))
        )
);

/**
 * Cleans effects and interactions of deleted widgets and layers, reapplies senders on insert or update
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

/**
 * Reapplies the interactions of a sender when one of its trigger updates happens (see `SENDER_TRIGGERS`)
 */
export const applyOnSenderPropertyChangeEpic = (action$, store) =>
    action$
        .ofType(UPDATE_PROPERTY)
        .mergeMap(({ id, key, value, target = 'floating' }) => {
            const sender = getContainerWidgets(store.getState(), target).find(w => w.id === id);
            return isSenderTriggerUpdate(sender, { key, value })
                ? Rx.Observable.from(getSenderSourceIds(sender).map(sourceId => applyWidgetInteractions(id, target, sourceId)))
                : Rx.Observable.empty();
        });

/**
 * Re-applies on load the interactions of the senders with transient effects, which are not saved
 */
export const applyTransientEffectsOnLoadEpic = (action$, store) =>
    action$
        .ofType(DASHBOARD_LOADED, MAP_CONFIG_LOADED, SET_LINKED_DASHBOARD_DATA)
        .switchMap(() => Rx.Observable.from(
            getContainerWidgets(store.getState(), 'floating')
                .filter(isTransientEffectSender)
                .flatMap(sender => getSenderSourceIds(sender).map(sourceId => applyWidgetInteractions(sender.id, 'floating', sourceId)))
        ));

// the main map moves often, its view is mirrored after the movement settles
const MAIN_MAP_VIEW_DEBOUNCE = 300;

const getMainMapView = (view = {}) => ({ bbox: view.bbox, center: view.center, zoom: view.zoom });

/**
 * Mirrors the main map view into the main map entry, so the main map sends its interactions like a map widget
 */
export const mirrorMainMapViewEpic = (action$, store) =>
    action$
        .ofType(CHANGE_MAP_VIEW)
        .debounceTime(MAIN_MAP_VIEW_DEBOUNCE)
        .filter(() => getContainerWidgets(store.getState(), 'floating').some(isMainMapWidget))
        .map(action => updateWidgetProperty(MAIN_MAP_WIDGET_ID, 'maps', { mapId: MAIN_MAP_ID, ...getMainMapView(action) }, 'merge', 'floating'));

/**
 * Opens the widget builder on the main map entry, created from the current main map view when missing
 */
export const editMainMapInteractionsEpic = (action$, store) =>
    action$
        .ofType(EDIT_MAIN_MAP_INTERACTIONS)
        .map(() => {
            const state = store.getState();
            const mainMap = getContainerWidgets(state, 'floating').find(isMainMapWidget);
            return editWidget(mainMap || createMainMapWidget(getMainMapView(mapSelector(state) || {})));
        });

export default {
    mirrorMainMapViewEpic,
    editMainMapInteractionsEpic,
    applyTransientEffectsOnLoadEpic,
    applyWidgetInteractionsEpic,
    cleanupAndReapplyWidgetInteractionsEpic,
    applyOnSenderPropertyChangeEpic
};
