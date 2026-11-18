/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Rx from 'rxjs';
import get from 'lodash/get';
import set from 'lodash/fp/set';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import uniqBy from 'lodash/uniqBy';
import uniq from 'lodash/uniq';
import { getMainMapZoomToPadding } from '../utils/MapWidgetUtils';
import { mapPaddingSelector } from '../selectors/maplayout';
import bbox from '@turf/bbox';
import xml2js from 'xml2js';

import { getFeatureLayer } from '../api/WFS';
import { updateWidgetProperty, updateWidgetProperties, editWidget, replaceWidgets, INSERT, EDIT_NEW, UPDATE, DELETE, UPDATE_PROPERTY, UPDATE_PROPERTIES, SET_LINKED_DASHBOARD_DATA, DEFAULT_TARGET } from '../actions/widgets';
import { updateWidgetPropertyInList } from '../utils/WidgetsUtils';
import { APPLY_WIDGET_INTERACTIONS, applyWidgetInteractions, ZOOM_TO_FILTER_EXTENT, zoomToFilterExtent, EDIT_MAIN_MAP_INTERACTIONS } from '../actions/interactions';
import { zoomToExtent, CHANGE_MAP_VIEW } from '../actions/map';
import { setCurrentTime, SET_CURRENT_TIME, SET_OFFSET_TIME } from '../actions/dimension';
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
import { isDashboardAvailable } from '../selectors/dashboard';
import { buildMainMapDefaultInteractions } from '../utils/InteractionMigrationUtils';
import { v1 as uuid } from 'uuid';
import { currentTimeSelector, offsetTimeSelector } from '../selectors/dimension';
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

// an effect returns an update, a list of updates (e.g. a time range) or null
const toUpdateList = (update) => [].concat(update || []);

const isWidgetPropertyUpdate = (update) => update?.type === INTERACTION_UPDATES.WIDGET_PROPERTY;

// the widget updates of a container are dispatched together, so the dashboard changes once
const toWidgetPropertiesAction = (widgetUpdates, target) => widgetUpdates.length === 1
    ? UPDATE_TO_ACTION[INTERACTION_UPDATES.WIDGET_PROPERTY](widgetUpdates[0])
    : updateWidgetProperties(widgetUpdates.map(({ widgetId, key, value, mode }) => ({ id: widgetId, key, value, mode })), target);

const toActions = (updates = []) => {
    const updateList = updates.flatMap(toUpdateList);
    const widgetUpdatesByTarget = groupBy(updateList.filter(isWidgetPropertyUpdate), update => update.target || DEFAULT_TARGET);
    return [
        ...updateList.filter(update => !isWidgetPropertyUpdate(update)).map(update => UPDATE_TO_ACTION[update?.type]?.(update)),
        ...Object.keys(widgetUpdatesByTarget).map(target => toWidgetPropertiesAction(widgetUpdatesByTarget[target], target))
    ].filter(Boolean);
};

// keeps a local state in line with the updates not dispatched yet
const applyUpdateToState = (state, update) => {
    if (isWidgetPropertyUpdate(update)) {
        const path = `widgets.containers[${update.target || DEFAULT_TARGET}].widgets`;
        const { widgetId: id, key, value, mode } = update;
        return set(path, updateWidgetPropertyInList(get(state, path), { id, key, value, mode }), state);
    }
    if (update?.type === INTERACTION_UPDATES.LAYER_PROPERTIES || update?.type === INTERACTION_UPDATES.LAYER_PARAMS) {
        const layers = layersSelector(state).map(layer => {
            if (layer.id !== update.layerId) {
                return layer;
            }
            return update.type === INTERACTION_UPDATES.LAYER_PARAMS
                ? { ...layer, params: { ...layer.params, ...update.params } }
                : { ...layer, ...update.properties };
        });
        return set(Array.isArray(state.layers) ? 'layers' : 'layers.flat', layers, state);
    }
    return state;
};

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
 * falling back to WFS only when the WPS request fails
 * @param {object} layer - The layer object with layerFilter and url
 * @returns {Observable<number[]|null>} Observable of extent array, null when no feature matches the filter
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
            // WPS returns [0, 0, -1, -1] when no feature matches, there is nothing to zoom to
            const isEmptyResult = extent[0] === 0 && extent[1] === 0 && extent[2] === -1 && extent[3] === -1;
            return isEmptyResult ? null : extent;
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

// the loader of the map widgets waiting for a zoom-to extent
const setMapWidgetsZoomLoading = (mapWidgetIds, loading, targetContainer) => mapWidgetIds.length > 0
    ? [updateWidgetProperties(mapWidgetIds.map(id => ({ id, key: 'zoomLoading', value: loading })), targetContainer)]
    : [];

/**
 * Resolves and combines the filtered extents of the zoom-to sources and zooms the target maps
 * @param {object} interaction the plugged zoom-to interaction
 * @param {object} sender the sender widget owning the interaction
 * @param {object} state redux state
 * @param {string} targetContainer the widget container target
 * @param {object} zoomLoading `{ mapWidgetIds }` the map widgets showing the loader for the sender source
 * @returns {Observable} zoom actions, with the loader of the target map widgets while the extent is requested
 */
function applyInteractionEffectForZoomTo(interaction, sender, state, targetContainer = 'floating', zoomLoading = { mapWidgetIds: [] }) {
    const { layers, mapTargets } = resolveZoomToSources(interaction, sender, state, targetContainer);
    if (layers.length === 0 || mapTargets.length === 0) {
        return Rx.Observable.empty();
    }
    const mapWidgetIds = uniq(mapTargets.map(target => target.mapWidgetId).filter(Boolean));
    const loadingOn$ = Rx.Observable.defer(() => {
        zoomLoading.mapWidgetIds = uniq([...zoomLoading.mapWidgetIds, ...mapWidgetIds]);
        return Rx.Observable.from(setMapWidgetsZoomLoading(mapWidgetIds, true, targetContainer));
    });
    const loadingOff$ = Rx.Observable.defer(() => {
        zoomLoading.mapWidgetIds = zoomLoading.mapWidgetIds.filter(id => !mapWidgetIds.includes(id));
        return Rx.Observable.from(setMapWidgetsZoomLoading(mapWidgetIds, false, targetContainer));
    });

    // Fetch extents for all layers concurrently
    const zoom$ = Rx.Observable.forkJoin(
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
    return loadingOn$.concat(zoom$, loadingOff$);
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
        .flatMap(interaction => toUpdateList(TARGET_EFFECTS[interaction.targetType]?.({ ...interaction, appliedData: event.data }, context)))
        .filter(update => !isNoOpUpdate(update, state));
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
        .mergeMap(sourceAction$ => {
            // the map widgets loading a zoom-to extent of this sender source, cleared when a newer apply cancels the request
            const zoomLoading = { mapWidgetIds: [] };
            return sourceAction$.switchMap(({ type, widgetId, target, sourceId, event }) => {
                if (event) {
                    return applyEventInteractions(store.getState(), { widgetId, target, sourceId, event });
                }
                const clearCancelledZoomLoading$ = Rx.Observable.defer(() => {
                    const mapWidgetIds = zoomLoading.mapWidgetIds;
                    zoomLoading.mapWidgetIds = [];
                    return Rx.Observable.from(setMapWidgetsZoomLoading(mapWidgetIds, false, target));
                });
                const isManualZoomTrigger = type === ZOOM_TO_FILTER_EXTENT;
                const sender = getContainerWidgets(store.getState(), target).find(w => w.id === widgetId);
                const buildAppliedData = SENDER_DATA_BUILDERS[sender?.widgetType];
                if (!buildAppliedData) {
                    return clearCancelledZoomLoading$;
                }
                const pluggedInteractions = (sender.interactions || []).filter(interaction => interaction.plugged === true
                && interaction.source.nodePath.includes(sourceId)
                && !!interaction.targetType
                && !EVENT_TARGET_TYPES.includes(interaction.targetType)
                && (!isManualZoomTrigger || interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO)
                );
                const effectInteractions = pluggedInteractions.filter(interaction => interaction.targetType !== TARGET_TYPES.APPLY_ZOOM_TO);
                const zoomToInteractions = pluggedInteractions.filter(interaction => interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO);
                // each effect sees the updates of the previous ones, all are dispatched together with a single state change
                const applyEffects$ = Rx.Observable.defer(() => {
                    const { updates } = effectInteractions.reduce(({ state, updates: previousUpdates }, interaction) => {
                        const applyEffect = TARGET_EFFECTS[interaction.targetType];
                        if (!applyEffect || shouldSkipInteraction(interaction, state)) {
                            return { state, updates: previousUpdates };
                        }
                        const context = getEffectsContext(state, target);
                        const effectUpdates = toUpdateList(applyEffect({
                            ...interaction,
                            appliedData: buildAppliedData(sender, sourceId, interaction, context),
                            "transient": isTransientEffectSender(sender)
                        }, context)).filter(item => !isNoOpUpdate(item, state));
                        return { state: effectUpdates.reduce(applyUpdateToState, state), updates: [...previousUpdates, ...effectUpdates] };
                    }, { state: store.getState(), updates: [] });
                    return Rx.Observable.from(toActions(updates));
                });
                // zoom-to resolves the extent of the layers already filtered by the other interactions
                const applyZoomTo$ = Rx.Observable.from(zoomToInteractions)
                    .concatMap(interaction => {
                        if (isManualZoomTrigger) {
                            return applyInteractionEffectForZoomTo(interaction, sender, store.getState(), target, zoomLoading);
                        }
                        // a newer apply cancels the pending zoom through switchMap
                        return interaction?.configuration?.autoZoom === true || hasSenderOwnZoomExtent(sender)
                            ? Rx.Observable.timer(AUTO_ZOOM_DEBOUNCE).switchMap(() => applyInteractionEffectForZoomTo(interaction, sender, store.getState(), target, zoomLoading))
                            : Rx.Observable.empty();
                    });
                return clearCancelledZoomLoading$.concat(applyEffects$, applyZoomTo$);
            });
        });

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
        .ofType(UPDATE_PROPERTY, UPDATE_PROPERTIES)
        .mergeMap((action) => {
            const target = action.target || DEFAULT_TARGET;
            const widgets = getContainerWidgets(store.getState(), target);
            const changes = action.type === UPDATE_PROPERTIES ? action.updates || [] : [action];
            const senders = uniqBy(
                changes
                    .map(({ id, key, value }) => ({ sender: widgets.find(w => w.id === id), key, value }))
                    .filter(({ sender, key, value }) => isSenderTriggerUpdate(sender, { key, value }))
                    .map(({ sender }) => sender),
                'id'
            );
            return Rx.Observable.from(senders.flatMap(sender => getSenderSourceIds(sender).map(sourceId => applyWidgetInteractions(sender.id, target, sourceId))));
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

const hasPluggedZoomTo = (sender) => (sender?.interactions || [])
    .some(interaction => interaction?.plugged && interaction.targetType === TARGET_TYPES.APPLY_ZOOM_TO);

/**
 * Zooms on dashboard load the maps of the senders that zoom to their own filtered data (e.g. a table with column filters)
 */
export const zoomToFilteredSendersOnLoadEpic = (action$, store) =>
    action$
        .ofType(DASHBOARD_LOADED, SET_LINKED_DASHBOARD_DATA)
        .switchMap(() => Rx.Observable.from(
            getContainerWidgets(store.getState(), DEFAULT_TARGET)
                .filter(sender => hasSenderOwnZoomExtent(sender) && hasPluggedZoomTo(sender))
                .flatMap(sender => getSenderSourceIds(sender).map(sourceId => zoomToFilterExtent(sender.id, DEFAULT_TARGET, sourceId)))
        ));

// the main map moves often, its view is mirrored after the movement settles
const MAIN_MAP_VIEW_DEBOUNCE = 300;

const getMainMapView = (view = {}) => ({ bbox: view.bbox, center: view.center, zoom: view.zoom });
const getMainMapTime = (state) => ({ currentTime: currentTimeSelector(state), offsetTime: offsetTimeSelector(state) });
const hasMainMapEntry = (state) => getContainerWidgets(state, 'floating').some(isMainMapWidget);
const mirrorIntoMainMap = (value) => updateWidgetProperty(MAIN_MAP_WIDGET_ID, 'maps', { mapId: MAIN_MAP_ID, ...value }, 'merge', 'floating');

/**
 * Mirrors the main map view and the timeline time into the main map entry, so the main map sends its interactions like a map widget
 */
export const mirrorMainMapViewEpic = (action$, store) =>
    action$
        .ofType(CHANGE_MAP_VIEW)
        .debounceTime(MAIN_MAP_VIEW_DEBOUNCE)
        .filter(() => hasMainMapEntry(store.getState()))
        .map(action => mirrorIntoMainMap(getMainMapView(action)))
        .merge(
            action$
                .ofType(SET_CURRENT_TIME, SET_OFFSET_TIME, MAP_CONFIG_LOADED)
                .debounceTime(MAIN_MAP_VIEW_DEBOUNCE)
                .filter(() => hasMainMapEntry(store.getState()))
                .map(() => mirrorIntoMainMap(getMainMapTime(store.getState())))
        );

/**
 * Opens the widget builder on the main map entry, created from the current main map view when missing
 */
export const editMainMapInteractionsEpic = (action$, store) =>
    action$
        .ofType(EDIT_MAIN_MAP_INTERACTIONS)
        .map(() => {
            const state = store.getState();
            const mainMap = getContainerWidgets(state, 'floating').find(isMainMapWidget);
            return editWidget(mainMap || createMainMapWidget({ ...getMainMapView(mapSelector(state) || {}), ...getMainMapTime(state) }));
        });

/**
 * Plugs a new widget into the main map interactions (viewport filter, timeline time) when it is added in the map viewer,
 * as new widgets of the map viewer always followed the main map
 */
export const plugNewWidgetIntoMainMapEpic = (action$, store) =>
    action$
        .ofType(EDIT_NEW)
        .filter(({ settings }) => settings?.plugMainMap !== false && !!mapSelector(store.getState()) && !isDashboardAvailable(store.getState()))
        .switchMap(({ widget: newWidget }) => action$
            .ofType(INSERT)
            .filter(({ id, widget }) => (id || widget?.id) === newWidget?.id)
            .take(1)
            .switchMap(({ widget }) => {
                const interactions = buildMainMapDefaultInteractions(widget).map(interaction => ({ ...interaction, id: uuid() }));
                if (interactions.length === 0) {
                    return Rx.Observable.empty();
                }
                const state = store.getState();
                const widgets = getContainerWidgets(state, 'floating');
                const mainMap = widgets.find(isMainMapWidget);
                const updateMainMap = mainMap
                    ? updateWidgetProperty(MAIN_MAP_WIDGET_ID, 'interactions', [...(mainMap.interactions || []), ...interactions], 'replace', 'floating')
                    : replaceWidgets([...widgets, { ...createMainMapWidget({ ...getMainMapView(mapSelector(state) || {}), ...getMainMapTime(state) }), interactions }], 'floating');
                return Rx.Observable.of(updateMainMap, applyWidgetInteractions(MAIN_MAP_WIDGET_ID, 'floating', MAIN_MAP_ID));
            }));

export default {
    plugNewWidgetIntoMainMapEpic,
    mirrorMainMapViewEpic,
    editMainMapInteractionsEpic,
    applyTransientEffectsOnLoadEpic,
    zoomToFilteredSendersOnLoadEpic,
    applyWidgetInteractionsEpic,
    cleanupAndReapplyWidgetInteractionsEpic,
    applyOnSenderPropertyChangeEpic
};
