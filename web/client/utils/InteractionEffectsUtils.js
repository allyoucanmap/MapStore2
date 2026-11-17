/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import bbox from '@turf/bbox';

import {
    extractTraceFromWidgetByNodePath,
    extractLayerIdFromNodePath,
    extractMapIdFromNodePath,
    extractWidgetIdFromNodePath,
    isChartAxisDimensionTarget,
    isLayerDimensionTarget,
    isMapLayerPath,
    isMapTimeTarget,
    isInteractionSender,
    isMainMapWidget,
    isMainMapLevelTarget,
    TARGET_TYPES,
    unplugOrphanZoomToInteractions,
    hasSenderOwnZoomExtent
} from './InteractionUtils';
import { defaultLayerFilter, toCQLFilter } from './FilterUtils';
import { composeFilterObject } from '../components/widgets/enhancers/utils';
import { processFilterToCQL, buildExcludeCQLFilter, buildDefaultCQLFilter } from './FilterEventUtils';
import { FILTER_SELECTION_MODES } from '../components/widgets/builder/wizard/filter/FilterDataTab/constants';
import { getChartAxisDependencyPath, getMapDependencyPath } from './WidgetsUtils';
import { getViewportGeometry } from './CoordinatesUtils';

/**
 * Types of the updates returned by the effects, converted to actions by the interactions epics
 */
export const INTERACTION_UPDATES = {
    LAYER_PROPERTIES: 'layerProperties',
    LAYER_PARAMS: 'layerParams',
    WIDGET_PROPERTY: 'widgetProperty',
    CURRENT_TIME: 'currentTime',
    ZOOM_TO_EXTENT: 'zoomToExtent'
};

const layerPropertiesUpdate = (layerId, properties) => ({ type: INTERACTION_UPDATES.LAYER_PROPERTIES, layerId, properties });
const layerParamsUpdate = (layerId, params) => ({ type: INTERACTION_UPDATES.LAYER_PARAMS, layerId, params });
const widgetPropertyUpdate = (widgetId, key, value, mode, target) => ({
    type: INTERACTION_UPDATES.WIDGET_PROPERTY, widgetId, key, value,
    ...(mode ? { mode } : {}),
    ...(target ? { target } : {})
});
const currentTimeUpdate = (value) => ({ type: INTERACTION_UPDATES.CURRENT_TIME, value });
const zoomToExtentUpdate = ({ extent, crs, maxZoom, padding }) => ({
    type: INTERACTION_UPDATES.ZOOM_TO_EXTENT, extent, crs,
    ...(maxZoom !== undefined ? { maxZoom } : {}),
    ...(padding ? { padding } : {})
});

const findById = (items = [], id) => id ? items.find(item => item?.id === id) : undefined;
const findMapById = (maps = [], mapId) => mapId ? maps.find(map => map?.mapId === mapId) : undefined;

// mutates the given (already cloned) layer
function ensureLayerFilterStructure(layer) {
    layer.layerFilter = layer.layerFilter
        ? {
            ...defaultLayerFilter,
            ...layer.layerFilter,
            filters: Array.isArray(layer.layerFilter.filters) ? layer.layerFilter.filters : []
        }
        : { ...defaultLayerFilter, filters: [] };
    return layer;
}

function updateFiltersArray(existingFilters, updatedFilter) {
    const filterIndex = existingFilters.findIndex(f => f.id === updatedFilter.id);
    return filterIndex >= 0
        ? existingFilters.map((f, idx) => idx === filterIndex ? updatedFilter : f)
        : [...existingFilters, updatedFilter];
}

// an interaction without applied data removes its own filter
function removeEmptyFilters(filters, interaction, filterId) {
    return filters.filter(f => !!interaction?.appliedData ? true : f.id !== filterId);
}

function createUpdatedFilter(interaction, senderId) {
    return {
        "id": interaction.id,
        "format": "logic",
        "version": "1.0.0",
        "logic": "OR",
        "filters": [{ ...interaction.appliedData }],
        "appliedFromWidget": senderId,
        ...(interaction.transient ? { "transient": true } : {})
    };
}

function mergeInteractionFilter(existingFilters = [], interaction) {
    const updatedFilter = createUpdatedFilter(interaction, extractWidgetIdFromNodePath(interaction?.source?.nodePath));
    return removeEmptyFilters(updateFiltersArray(existingFilters, updatedFilter), interaction, updatedFilter.id);
}

// matches widgets[id].maps[mapId].layers[layerId] on a cloned widget
function findMapWidgetTargetLayer(widget, nodePath) {
    const match = nodePath?.match(/\.maps\[([^\]]+)\]\.layers\[([^\]]+)\]$/);
    if (!match) {
        return {};
    }
    const updatedWidget = JSON.parse(JSON.stringify(widget));
    const targetMap = Array.isArray(updatedWidget.maps) ? updatedWidget.maps.find(map => map.mapId === match[1]) : null;
    const targetLayer = Array.isArray(targetMap?.layers) ? targetMap.layers.find(layer => layer.id === match[2]) : null;
    return targetLayer ? { updatedWidget, targetLayer } : {};
}

function updateChartWidgetWithFilter(widget, interaction, traceObject) {
    const widgetCharts = JSON.parse(JSON.stringify(widget?.charts ?? []));
    widgetCharts.forEach(chart => {
        chart.traces = (chart.traces || []).map(trace => trace.id === traceObject.id
            ? { ...trace, interactionFilters: mergeInteractionFilter(Array.isArray(trace.interactionFilters) ? trace.interactionFilters : [], interaction) }
            : trace
        );
    });
    return widgetPropertyUpdate(widget.id, 'charts', widgetCharts);
}

function updateLayerBasedWidgetWithFilter(widget, interaction) {
    const existingFilters = Array.isArray(widget.interactionFilters) ? widget.interactionFilters : [];
    return widgetPropertyUpdate(widget.id, 'interactionFilters', mergeInteractionFilter(JSON.parse(JSON.stringify(existingFilters)), interaction));
}

function updateMapWidgetWithFilter(widget, interaction) {
    const { updatedWidget, targetLayer } = findMapWidgetTargetLayer(widget, interaction?.target?.nodePath);
    if (!targetLayer) {
        return null;
    }
    ensureLayerFilterStructure(targetLayer);
    targetLayer.layerFilter.filters = mergeInteractionFilter(targetLayer.layerFilter.filters, interaction);
    return widgetPropertyUpdate(widget.id, 'maps', updatedWidget.maps);
}

function updateWidgetWithFilterByType(widget, interaction) {
    switch (widget.widgetType) {
    case 'chart': {
        const traceObject = extractTraceFromWidgetByNodePath(widget, interaction.target.nodePath);
        return traceObject ? updateChartWidgetWithFilter(widget, interaction, traceObject) : null;
    }
    case 'table':
    case 'counter':
        return updateLayerBasedWidgetWithFilter(widget, interaction);
    case 'map':
        return updateMapWidgetWithFilter(widget, interaction);
    default:
        return null;
    }
}

/**
 * Returns the update that writes the interaction filter into its target (main map layer or widget)
 * @param {object} interaction the interaction with its `appliedData`
 * @param {object} context `{ layers, widgets }` main map layers and widgets of the container
 */
export function applyFilterEffect(interaction, { layers, widgets } = {}) {
    const nodePath = interaction?.target?.nodePath;
    if (!nodePath) {
        return null;
    }
    if (isMapLayerPath(nodePath)) {
        const layer = findById(layers, extractLayerIdFromNodePath(nodePath));
        if (!layer) {
            return null;
        }
        const updatedLayer = ensureLayerFilterStructure(JSON.parse(JSON.stringify(layer)));
        updatedLayer.layerFilter.filters = mergeInteractionFilter(updatedLayer.layerFilter.filters, interaction);
        return layerPropertiesUpdate(updatedLayer.id, { layerFilter: updatedLayer.layerFilter });
    }
    const targetWidget = findById(widgets, extractWidgetIdFromNodePath(nodePath));
    return targetWidget ? updateWidgetWithFilterByType(targetWidget, interaction) : null;
}

/**
 * Returns the update that applies the interaction style to its target layer
 * @param {object} interaction the interaction with its `appliedData`
 * @param {object} context `{ layers, widgets }` main map layers and widgets of the container
 */
export function applyStyleEffect(interaction, { layers, widgets } = {}) {
    const nodePath = interaction?.target?.nodePath;
    if (!nodePath) {
        return null;
    }
    if (isMapLayerPath(nodePath)) {
        const layer = findById(layers, extractLayerIdFromNodePath(nodePath));
        return layer ? layerPropertiesUpdate(layer.id, { style: interaction.appliedData }) : null;
    }
    const targetWidget = findById(widgets, extractWidgetIdFromNodePath(nodePath));
    if (targetWidget?.widgetType !== 'map') {
        return null;
    }
    const { updatedWidget, targetLayer } = findMapWidgetTargetLayer(targetWidget, nodePath);
    if (!targetLayer) {
        return null;
    }
    targetLayer.style = interaction.appliedData;
    return widgetPropertyUpdate(targetWidget.id, 'maps', updatedWidget.maps);
}

function getMapWidgetDimensionPath(widgetId, nodePath, widgetMaps) {
    const nodePathMatch = nodePath?.match(/(?:^|\.)widgets\[[^\]]+\]\.(maps\[.*)$/);
    if (!nodePathMatch || !Array.isArray(widgetMaps)) {
        return null;
    }
    const resolvedPath = getMapDependencyPath(nodePathMatch[1], widgetId, widgetMaps);
    return resolvedPath && resolvedPath !== nodePathMatch[1] ? resolvedPath : null;
}

function getChartAxisDimensionPath(widgetId, nodePath, widgets) {
    const nodePathMatch = nodePath?.match(/(?:^|\.)widgets\[[^\]]+\]\.(charts\[.*)$/);
    if (!nodePathMatch || !Array.isArray(widgets)) {
        return null;
    }
    const resolvedPath = getChartAxisDependencyPath(nodePathMatch[1], widgetId, widgets);
    return resolvedPath && resolvedPath !== nodePathMatch[1] ? resolvedPath : null;
}

function widgetPathUpdate(widgetId, path, value) {
    return path ? widgetPropertyUpdate(widgetId, path, value) : null;
}

// the main map sends the timeline range `{ currentTime, offsetTime }`, the other senders a single value
const isTimeRange = (data) => !!data && typeof data === 'object' && 'currentTime' in data;

/**
 * Returns the update that applies the interaction dimension value (time, elevation, chart axis current time)
 * @param {object} interaction the interaction with its `appliedData`
 * @param {object} context `{ widgets }` widgets of the container
 */
export function applyDimensionEffect(interaction, { widgets = [] } = {}) {
    const nodePath = interaction?.target?.nodePath;
    const dimension = interaction?.target?.metaData?.dimension;
    if (!nodePath || !dimension) {
        return null;
    }
    const appliedData = interaction.appliedData;
    const value = isTimeRange(appliedData) ? appliedData.currentTime : appliedData;
    if (isMapTimeTarget(nodePath)) {
        return dimension === 'time' ? currentTimeUpdate(value) : null;
    }
    const widgetId = extractWidgetIdFromNodePath(nodePath);
    if (isChartAxisDimensionTarget(nodePath)) {
        const currentTimePath = widgetId && getChartAxisDimensionPath(widgetId, nodePath, widgets);
        if (!currentTimePath) {
            return null;
        }
        // a range also sets the axis offset time, drawn as a band instead of a line
        return isTimeRange(appliedData)
            ? [
                widgetPathUpdate(widgetId, currentTimePath, appliedData.currentTime ?? null),
                widgetPathUpdate(widgetId, currentTimePath.replace(/appliedCurrentTime$/, 'appliedOffsetTime'), appliedData.offsetTime ?? null)
            ]
            : widgetPathUpdate(widgetId, currentTimePath, value);
    }
    if (!isLayerDimensionTarget(nodePath)) {
        return null;
    }
    if (isMapLayerPath(nodePath)) {
        const layerId = extractLayerIdFromNodePath(nodePath);
        return layerId ? layerParamsUpdate(layerId, { [dimension]: value }) : null;
    }
    const targetWidget = findById(widgets, widgetId);
    return targetWidget?.widgetType === 'map'
        ? widgetPathUpdate(widgetId, getMapWidgetDimensionPath(widgetId, nodePath, [targetWidget]), value)
        : null;
}

/**
 * Effects by target type, zoom-to excluded since it requests the layer extent
 */
/**
 * Returns the update that moves the target map of a map widget to the center and zoom of the sender map
 * @param {object} interaction the interaction with `appliedData` `{ center, zoom }`
 * @param {object} context `{ widgets }` widgets of the container
 */
export function applyViewSyncEffect(interaction, { widgets } = {}) {
    const nodePath = interaction?.target?.nodePath;
    const targetWidget = findById(widgets, extractWidgetIdFromNodePath(nodePath));
    const mapId = extractMapIdFromNodePath(nodePath);
    const { center, zoom } = interaction?.appliedData || {};
    return targetWidget && findMapById(targetWidget.maps, mapId) && center && zoom !== undefined
        ? widgetPropertyUpdate(targetWidget.id, 'maps', { mapId, center, zoom }, 'merge')
        : null;
}

/**
 * Target types applied only with event data (e.g. a table row click, a legend change), never from the sender state
 */
export const EVENT_TARGET_TYPES = [TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, TARGET_TYPES.APPLY_LEGEND];

/**
 * Returns the update that zooms the target map to the feature of the event
 * @param {object} interaction the interaction with `appliedData` `{ feature, crs, maxZoom }`
 * @param {object} context `{ widgets, mainMapPadding }` widgets of the container and main map padding
 */
export function applyZoomToFeatureEffect(interaction, { widgets, mainMapPadding } = {}) {
    const { feature, crs = 'EPSG:4326', maxZoom } = interaction?.appliedData || {};
    const extent = feature?.bbox || (feature?.geometry ? bbox(feature) : null);
    const nodePath = interaction?.target?.nodePath;
    if (!extent) {
        return null;
    }
    if (isMainMapLevelTarget(nodePath)) {
        return zoomToExtentUpdate({ extent, crs, maxZoom, padding: mainMapPadding });
    }
    const mapWidget = findById(widgets, extractWidgetIdFromNodePath(nodePath));
    const mapId = extractMapIdFromNodePath(nodePath);
    return mapWidget && findMapById(mapWidget.maps, mapId)
        ? widgetPropertyUpdate(mapWidget.id, 'maps', { mapId, zoomToRequest: { extent, crs, ...(maxZoom !== undefined ? { maxZoom } : {}) } }, 'merge')
        : null;
}

/**
 * Returns the layers of the controlled map with the legend changes (visibility, opacity, expanded, legend filter)
 * @param {object[]} mapLayers the layers of the controlled map
 * @param {object[]} legendLayers the layers changed in the legend
 * @returns {object[]} the updated map layers
 */
export const mergeLegendLayerChanges = (mapLayers = [], legendLayers = []) => mapLayers.map(layer => {
    const legendLayer = legendLayers.find(l => l.id === layer.id);
    return legendLayer
        ? { ...layer, visibility: legendLayer.visibility, opacity: legendLayer.opacity, expanded: legendLayer.expanded, layerFilter: legendLayer.layerFilter }
        : layer;
});

/**
 * Returns the update that writes the legend changes into the layers of the controlled map
 * @param {object} interaction the interaction with `appliedData` `{ layers }`
 * @param {object} context `{ widgets }` widgets of the container
 */
export function applyLegendEffect(interaction, { widgets } = {}) {
    const nodePath = interaction?.target?.nodePath;
    const mapWidget = findById(widgets, extractWidgetIdFromNodePath(nodePath));
    const mapId = extractMapIdFromNodePath(nodePath);
    const map = mapWidget && findMapById(mapWidget.maps, mapId);
    const legendLayers = interaction?.appliedData?.layers;
    return map && Array.isArray(legendLayers)
        ? widgetPropertyUpdate(mapWidget.id, 'maps', { mapId, layers: mergeLegendLayerChanges(map.layers, legendLayers) }, 'merge')
        : null;
}

export const TARGET_EFFECTS = {
    [TARGET_TYPES.APPLY_FILTER]: applyFilterEffect,
    [TARGET_TYPES.APPLY_SPATIAL_FILTER]: applyFilterEffect,
    [TARGET_TYPES.APPLY_VIEW_SYNC]: applyViewSyncEffect,
    [TARGET_TYPES.APPLY_ZOOM_TO_FEATURE]: applyZoomToFeatureEffect,
    [TARGET_TYPES.APPLY_LEGEND]: applyLegendEffect,
    [TARGET_TYPES.APPLY_STYLE]: applyStyleEffect,
    [TARGET_TYPES.APPLY_DIMENSION]: applyDimensionEffect
};

function buildFilterWidgetFilterData(filterWidget, filterId) {
    const filter = findById(filterWidget.filters, filterId);
    if (!filter || filter.disabled === true) {
        return null;
    }
    const filterSelections = filterWidget.selections?.[filterId];
    const matchingFilter = processFilterToCQL(filter, filterSelections);
    if (matchingFilter) {
        return matchingFilter;
    }
    if (filterSelections?.length > 0) {
        return null;
    }
    const noSelectionMode = filter.data?.noSelectionMode ?? FILTER_SELECTION_MODES.NO_FILTER;
    if (noSelectionMode === FILTER_SELECTION_MODES.EXCLUDE) {
        return buildExcludeCQLFilter(filter.id);
    }
    return noSelectionMode === FILTER_SELECTION_MODES.CUSTOM && filter.data?.defaultFilter
        ? buildDefaultCQLFilter(filter.id, filter.data.defaultFilter)
        : null;
}

/**
 * Returns the data a filter widget sends for one of its filters to the interaction target type
 */
export function buildFilterWidgetAppliedData(filterWidget, filterId, interaction) {
    if (interaction?.targetType === TARGET_TYPES.APPLY_STYLE) {
        const selectedStyle = filterWidget.selections?.[filterId]?.[0];
        return findById(filterWidget.filters, filterId)?.data?.userDefinedItems?.find(item => item.id === selectedStyle)?.style?.name;
    }
    if (interaction?.targetType === TARGET_TYPES.APPLY_DIMENSION) {
        const selectedValue = filterWidget.selections?.[filterId]?.[0];
        return selectedValue?.value ?? selectedValue ?? null;
    }
    return buildFilterWidgetFilterData(filterWidget, filterId);
}

/**
 * Returns the CQL filter a table widget sends, composed of its configured filter and column filters
 */
export function buildTableWidgetAppliedData(tableWidget) {
    const filterObj = composeFilterObject(tableWidget?.filter, tableWidget?.quickFilters, tableWidget?.options);
    const body = isEmpty(filterObj) ? null : toCQLFilter(filterObj);
    return typeof body === 'string' && body && body !== 'INCLUDE'
        ? { format: 'cql', version: '1.0.0', body }
        : null;
}

/**
 * Returns the geometry attribute of the interaction target, from the chart trace or the widget
 * @param {object} interaction the interaction
 * @param {object[]} widgets widgets of the container
 * @returns {string|undefined}
 */
export function getTargetGeometryAttribute(interaction, widgets = []) {
    const nodePath = interaction?.target?.nodePath;
    const targetWidget = findById(widgets, extractWidgetIdFromNodePath(nodePath));
    return targetWidget?.widgetType === 'chart'
        ? extractTraceFromWidgetByNodePath(targetWidget, nodePath)?.geomProp
        : targetWidget?.geomProp;
}

/**
 * Returns the data a map widget sends: center and zoom for view sync, otherwise the CQL spatial filter of the map extent on the target geometry
 * @param {object} mapWidget the map widget
 * @param {string} mapId the map of the widget sending the extent
 * @param {object} interaction the interaction
 * @param {object} context `{ widgets }` widgets of the container, to read the target geometry attribute
 */
export function buildMapWidgetAppliedData(mapWidget, mapId, interaction, { widgets } = {}) {
    const map = findMapById(mapWidget?.maps, mapId);
    if (interaction?.targetType === TARGET_TYPES.APPLY_VIEW_SYNC) {
        return map?.center && map.zoom !== undefined ? { center: map.center, zoom: map.zoom } : null;
    }
    if (interaction?.targetType === TARGET_TYPES.APPLY_DIMENSION) {
        // only the main map entry mirrors the timeline time
        return map?.currentTime ? { currentTime: map.currentTime, offsetTime: map.offsetTime } : null;
    }
    const { bounds, crs } = map?.bbox || {};
    const attribute = getTargetGeometryAttribute(interaction, widgets);
    if (!bounds || !crs || !attribute) {
        return null;
    }
    const numericBounds = Object.keys(bounds).reduce((acc, key) => ({ ...acc, [key]: parseFloat(bounds[key]) }), {});
    const geometry = getViewportGeometry(numericBounds, crs);
    const body = toCQLFilter({ spatialField: { attribute, operation: 'INTERSECTS', geometry: { ...geometry, projection: crs } } });
    return typeof body === 'string' && body && body !== 'INCLUDE'
        ? { format: 'cql', version: '1.0.0', body }
        : null;
}

/**
 * Returns the table layer filtered by the table column and configured filters, empty without a filter
 * @param {object} tableWidget the table widget
 * @returns {object[]} layers to compute the zoom extent from
 */
export function getTableWidgetZoomExtentLayers(tableWidget) {
    const filterObj = composeFilterObject(tableWidget?.filter, tableWidget?.quickFilters, tableWidget?.options);
    return tableWidget?.layer && !isEmpty(filterObj)
        ? [{ ...tableWidget.layer, layerFilter: filterObj }]
        : [];
}

/**
 * Zoom extent layers by sender type, for senders that zoom to their own data: (widget) => layers
 */
export const SENDER_ZOOM_EXTENT_LAYERS = {
    table: getTableWidgetZoomExtentLayers
};

/**
 * Data builders by sender widget type: (widget, sourceId, interaction) => appliedData
 */
export const SENDER_DATA_BUILDERS = {
    filter: buildFilterWidgetAppliedData,
    table: buildTableWidgetAppliedData,
    map: buildMapWidgetAppliedData
};

/**
 * Sender types whose effects follow a frequently changing state, written as transient and not saved
 */
export const TRANSIENT_EFFECT_SENDER_TYPES = ['map'];

/**
 * Returns true if the effects of the sender are transient
 */
export const isTransientEffectSender = (widget) => TRANSIENT_EFFECT_SENDER_TYPES.includes(widget?.widgetType);

/**
 * Source ids by sender widget type: the sub-elements of the sender that emit interactions
 */
export const SENDER_SOURCE_IDS = {
    filter: (widget) => (widget.filters || []).map(f => f.id),
    table: (widget) => widget.id ? [widget.id] : [],
    map: (widget) => (widget.maps || []).map(map => map.mapId).filter(Boolean),
    legend: (widget) => widget.id ? [widget.id] : []
};

/**
 * Returns the source ids of a sender widget
 */
export const getSenderSourceIds = (widget) => SENDER_SOURCE_IDS[widget?.widgetType]?.(widget) || [];

function cleanupLayerFilter(layerFilter, senderId) {
    if (!Array.isArray(layerFilter?.filters)) {
        return null;
    }
    const filters = layerFilter.filters.filter(f => f.appliedFromWidget !== senderId);
    return filters.length !== layerFilter.filters.length ? { ...layerFilter, filters } : null;
}

// cleans interactionFilters and the legacy layer.layerFilter.filters location
function cleanupInteractionFilters(container, senderId) {
    const interactionFilters = cleanupLayerFilter({ filters: container.interactionFilters }, senderId)?.filters;
    const layerFilter = cleanupLayerFilter(container.layer?.layerFilter, senderId);
    if (!interactionFilters && !layerFilter) {
        return null;
    }
    return {
        ...container,
        ...(interactionFilters ? { interactionFilters } : {}),
        ...(layerFilter ? { layer: { ...container.layer, layerFilter } } : {})
    };
}

function cleanupFiltersFromChartWidget(widget, senderId) {
    if (!Array.isArray(widget.charts)) {
        return null;
    }
    let needsUpdate = false;
    const charts = widget.charts.map(chart => {
        if (!Array.isArray(chart.traces)) {
            return chart;
        }
        const traces = chart.traces.map(trace => {
            const updatedTrace = cleanupInteractionFilters(trace, senderId);
            needsUpdate = needsUpdate || !!updatedTrace;
            return updatedTrace || trace;
        });
        return { ...chart, traces };
    });
    return needsUpdate ? widgetPropertyUpdate(widget.id, 'charts', charts) : null;
}

function cleanupFiltersFromLayerBasedWidget(widget, senderId) {
    const updatedWidget = cleanupInteractionFilters(widget, senderId);
    return updatedWidget ? widgetPropertyUpdate(widget.id, 'interactionFilters', updatedWidget.interactionFilters) : null;
}

function cleanupFiltersFromMapWidget(widget, senderId) {
    if (!Array.isArray(widget.maps)) {
        return null;
    }
    let needsUpdate = false;
    const maps = widget.maps.map(map => {
        if (!Array.isArray(map.layers)) {
            return map;
        }
        const layers = map.layers.map(layer => {
            const layerFilter = cleanupLayerFilter(layer.layerFilter, senderId);
            needsUpdate = needsUpdate || !!layerFilter;
            return layerFilter ? { ...layer, layerFilter } : layer;
        });
        return { ...map, layers };
    });
    return needsUpdate ? widgetPropertyUpdate(widget.id, 'maps', maps) : null;
}

const WIDGET_FILTER_CLEANUPS = {
    chart: cleanupFiltersFromChartWidget,
    table: cleanupFiltersFromLayerBasedWidget,
    counter: cleanupFiltersFromLayerBasedWidget,
    map: cleanupFiltersFromMapWidget
};

function cleanupChartAxisDimensionsBySender(sender, widgets, targetContainer) {
    const cleanedTargetPaths = [];
    return (sender?.interactions || [])
        .filter(interaction =>
            interaction?.plugged === true
            && interaction?.targetType === TARGET_TYPES.APPLY_DIMENSION
            && isChartAxisDimensionTarget(interaction?.target?.nodePath)
        )
        .reduce((updates, interaction) => {
            const targetWidgetId = extractWidgetIdFromNodePath(interaction.target.nodePath);
            const path = getChartAxisDimensionPath(targetWidgetId, interaction.target.nodePath, widgets);
            const key = `${targetWidgetId}.${path}`;
            if (!targetWidgetId || !path || cleanedTargetPaths.includes(key)) {
                return updates;
            }
            cleanedTargetPaths.push(key);
            return [...updates, widgetPropertyUpdate(targetWidgetId, path, null, 'replace', targetContainer)];
        }, []);
}

/**
 * Returns the updates that remove every effect applied by a sender widget
 * @param {string} senderId the sender widget id
 * @param {object} context `{ layers, widgets, target, sender }`, `sender` if already removed from widgets
 */
export function cleanupEffectsBySenderId(senderId, { layers = [], widgets = [], target = 'floating', sender } = {}) {
    if (!senderId) {
        return [];
    }
    const layerUpdates = layers
        .map(layer => {
            const layerFilter = cleanupLayerFilter(layer.layerFilter, senderId);
            return layerFilter ? layerPropertiesUpdate(layer.id, { layerFilter }) : null;
        });
    const widgetUpdates = widgets.map(widget => WIDGET_FILTER_CLEANUPS[widget.widgetType]?.(widget, senderId));
    return [
        ...layerUpdates,
        ...widgetUpdates,
        ...cleanupChartAxisDimensionsBySender(sender || findById(widgets, senderId), widgets, target)
    ].filter(Boolean);
}

/**
 * Returns the updates resetting the chart axis dimensions of interactions deleted while editing
 */
export function cleanupEffectsOfDeletedInteractions(deletedInteractions = [], { widgets = [] } = {}) {
    return deletedInteractions
        .filter(interaction =>
            interaction?.targetType === TARGET_TYPES.APPLY_DIMENSION
            && isChartAxisDimensionTarget(interaction?.target?.nodePath)
        )
        .map(interaction => applyDimensionEffect({ ...interaction, appliedData: null }, { widgets }))
        .filter(Boolean);
}

function updateSendersInteractions({ widgets = [], target = 'floating' }, filterInteractions) {
    return widgets
        .filter(isInteractionSender)
        .reduce((updates, sender) => {
            const interactions = sender.interactions || [];
            const filteredInteractions = filterInteractions(interactions, sender);
            // compares by value: unplugging an orphaned zoom-to keeps the array length unchanged
            return isEqual(filteredInteractions, interactions)
                ? updates
                : [...updates, widgetPropertyUpdate(sender.id, 'interactions', filteredInteractions, 'replace', target)];
        }, []);
}

/**
 * Returns the updates that remove from all senders the interactions targeting a deleted main map layer
 * @param {string} deletedLayerId the deleted layer id
 * @param {object} context `{ widgets, target }`
 */
export function cleanupInteractionsAfterLayerDeletion(deletedLayerId, context = {}) {
    if (!deletedLayerId) {
        return [];
    }
    return updateSendersInteractions(context, (interactions, sender) => {
        const remaining = interactions.filter(interaction => {
            const targetNodePath = interaction?.target?.nodePath || '';
            return !isMapLayerPath(targetNodePath) || extractLayerIdFromNodePath(targetNodePath) !== deletedLayerId;
        });
        return hasSenderOwnZoomExtent(sender) ? remaining : unplugOrphanZoomToInteractions(remaining);
    });
}

/**
 * Returns the updates that remove from all senders the interactions targeting a deleted widget
 * @param {string} deletedWidgetId the deleted widget id
 * @param {object} context `{ widgets, target }`
 */
export function cleanupInteractionsAfterWidgetDeletion(deletedWidgetId, context = {}) {
    if (!deletedWidgetId) {
        return [];
    }
    return updateSendersInteractions(context, interactions =>
        interactions.filter(interaction => extractWidgetIdFromNodePath(interaction?.target?.nodePath) !== deletedWidgetId)
    );
}

const withoutTransient = (filters) => Array.isArray(filters) && filters.some(filter => filter?.transient)
    ? filters.filter(filter => !filter?.transient)
    : filters;

const MAIN_MAP_VIEW_KEYS = ['bbox', 'center', 'zoom', 'currentTime', 'offsetTime'];

const stripWidgetTransientEffects = (widget) => {
    // the main map view is mirrored from the map state, it is restored on load
    if (isMainMapWidget(widget) && widget.maps?.some(map => MAIN_MAP_VIEW_KEYS.some(key => key in map))) {
        return { ...widget, maps: widget.maps.map(map => omit(map, MAIN_MAP_VIEW_KEYS)) };
    }
    const interactionFilters = withoutTransient(widget.interactionFilters);
    const charts = widget.charts?.map(chart => {
        const traces = chart.traces?.map(trace => {
            const traceFilters = withoutTransient(trace.interactionFilters);
            return traceFilters === trace.interactionFilters ? trace : { ...trace, interactionFilters: traceFilters };
        });
        return traces?.some((trace, idx) => trace !== chart.traces[idx]) ? { ...chart, traces } : chart;
    });
    const chartsChanged = charts?.some((chart, idx) => chart !== widget.charts[idx]);
    return interactionFilters === widget.interactionFilters && !chartsChanged
        ? widget
        : { ...widget, interactionFilters, ...(chartsChanged ? { charts } : {}) };
};

/**
 * Removes the transient effects (e.g. map viewport filters) and the mirrored main map view from the widgets, they are recomputed on load
 * @param {object[]} widgets the widgets to save
 * @returns {object[]} the widgets without transient effects, the same array when there is nothing to remove
 */
export function stripTransientEffects(widgets) {
    if (!Array.isArray(widgets)) {
        return widgets;
    }
    const stripped = widgets.map(stripWidgetTransientEffects);
    return stripped.some((widget, idx) => widget !== widgets[idx]) ? stripped : widgets;
}

const prefixWidgetPaths = (path, prefix) => typeof path === 'string'
    ? path.replace(/widgets\[([^\]]+)\]/g, (match, widgetId) => `widgets[${prefix}-${widgetId}]`)
    : path;
const prefixAppliedFromWidget = (filters, prefix) => Array.isArray(filters)
    ? filters.map(filter => filter?.appliedFromWidget ? { ...filter, appliedFromWidget: `${prefix}-${filter.appliedFromWidget}` } : filter)
    : filters;
const prefixNodePath = (node, prefix) => node ? { ...node, nodePath: prefixWidgetPaths(node.nodePath, prefix) } : node;

/**
 * Prefixes the widget ids referenced by the interactions and effects of a widget, as done for the widget ids of a linked dashboard
 * @param {object} widget the widget of the linked dashboard
 * @param {string} prefix the prefix of the widget ids
 * @returns {object} the widget with prefixed interaction paths and effect senders
 */
export function prefixWidgetInteractionIds(widget = {}, prefix) {
    return {
        ...widget,
        ...(widget.interactions ? {
            interactions: widget.interactions.map(interaction => ({
                ...interaction,
                source: prefixNodePath(interaction.source, prefix),
                target: prefixNodePath(interaction.target, prefix)
            }))
        } : {}),
        ...(widget.interactionFilters ? { interactionFilters: prefixAppliedFromWidget(widget.interactionFilters, prefix) } : {}),
        ...(widget.charts ? {
            charts: widget.charts.map(chart => ({
                ...chart,
                ...(chart.traces ? { traces: chart.traces.map(trace => ({ ...trace, ...(trace.interactionFilters ? { interactionFilters: prefixAppliedFromWidget(trace.interactionFilters, prefix) } : {}) })) } : {})
            }))
        } : {}),
        ...(widget.maps ? {
            maps: widget.maps.map(map => ({
                ...map,
                ...(map.layers ? {
                    layers: map.layers.map(layer => layer.layerFilter?.filters
                        ? { ...layer, layerFilter: { ...layer.layerFilter, filters: prefixAppliedFromWidget(layer.layerFilter.filters, prefix) } }
                        : layer)
                } : {})
            }))
        } : {})
    };
}

