/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    get,
    find,
    isNumber,
    round,
    findIndex,
    isEmpty,
    omit,
    castArray,
    pick,
    isString,
    uniq
} from 'lodash';
import set from "lodash/fp/set";
import { CHARTS_REGEX, TRACES_REGEX, MAPS_REGEX, WIDGETS_REGEX, LAYERS_REGEX } from '../actions/widgets';
import { v1 as uuidv1 } from "uuid";
import { arrayUpsert } from "./ImmutableUtils";
import { randomInt } from "./RandomUtils";
import moment from 'moment';
import { dateFormats } from './FeatureGridUtils';
import { createNewFilter } from '../plugins/widgetbuilder/utils/filterBuilder';

export const FONT = {
    FAMILY: "inherit",
    SIZE: 12,
    COLOR: "#000000"
};

/**
 * Get a widget by its dependency path
 * @param {string} k - The dependency path
 * @param {object[]} widgets - The list of widgets
 * @returns {object|null} The widget or null if not found
 */
export const getWidgetByDependencyPath = (k, widgets) => {
    const [match, id] = WIDGETS_REGEX.exec(k) ?? [];
    if (match) {
        return find(widgets, { id });
    }
    return null;
};

/**
 * Get a map dependency path
 * @param {string} k - The dependency path
 * @param {string} widgetId - The ID of the widget
 * @param {object[]} widgetMaps - The list of widget maps
 * @returns {string} The modified dependency path
 */
export const getMapDependencyPath = (k, widgetId, widgetMaps) => {
    let [match, mapId, rest] = MAPS_REGEX.exec(k) || [];
    let newPath = k;
    const { maps } = find(widgetMaps, {id: widgetId}) || {};
    if (match && !isEmpty(maps)) {
        const index = findIndex(maps, { mapId });
        newPath = match.replace(mapId, index);
        // replace also layers[<layerId>] paths for layers in map widgets
        // note LAYERS_REGEX matches only the beginning of the string
        const layerMatch = LAYERS_REGEX.exec(rest);
        if (layerMatch) {
            const layerId = layerMatch[1];
            const { layers } = maps[index] || {};
            const layerIndex = findIndex(layers, { id: layerId });
            if (layerIndex !== -1) {
                newPath = newPath.replace(layerId, layerIndex);
            }
        }
    }
    return newPath;
};

/**
 * Get a chart axis dependency path (resolves charts[chartId].xAxisOpts[axisId] to indices).
 * It also supports axis paths displayed under a trace node, resolving them to the chart-level axis.
 * @param {string} k - The dependency path
 * @param {string} widgetId - The ID of the widget
 * @param {object[]} widgets - The list of widgets
 * @returns {string} The modified dependency path
 */
export const getChartAxisDependencyPath = (k, widgetId, widgets) => {
    const axisPathRegex = /^charts\["?([^"\]]*)"?\]\.(?:traces\["?([^"\]]*)"?\]\.)?(xAxisOpts|yAxisOpts)\["?([^"\]]*)"?\]\.?(.*)$/;
    const [, chartId, , axisOptsKey, axisId, rest] = axisPathRegex.exec(k) || [];
    if (!chartId || !axisOptsKey) {
        return k;
    }
    const widget = find(widgets, { id: widgetId });
    const charts = get(widget, 'charts', []) || [];
    const chartIndex = findIndex(charts, { chartId });
    if (chartIndex === -1) {
        return k;
    }
    const chart = charts[chartIndex] || {};
    const axisIndex = findIndex(chart[axisOptsKey] || [], axis => String(axis?.id) === String(axisId));
    if (axisIndex === -1) {
        return k;
    }
    return `charts[${chartIndex}].${axisOptsKey}[${axisIndex}]${rest ? `.${rest}` : ''}`;
};

/**
 * Get a traces dependency path (resolves charts[chartId].traces[traceId] to indices)
 * @param {string} k - The dependency path (e.g. "charts[chartId].traces[traceId].filter")
 * @param {string} widgetId - The ID of the widget
 * @param {object[]} widgets - The list of widgets
 * @returns {string} The modified dependency path
 */
export const getTracesDependencyPath = (k, widgetId, widgets) => {
    let [chartMatch, chartId, chartRest] = CHARTS_REGEX.exec(k) || [];
    let newPath = k;
    const widget = find(widgets, { id: widgetId });
    const charts = get(widget, 'charts', []) || [];
    if (chartMatch && !isEmpty(charts)) {
        const chartIndex = findIndex(charts, { chartId });
        if (chartIndex !== -1) {
            newPath = newPath.replace(chartId, chartIndex);
            // replace also traces[<traceId>] paths for traces in chart widgets
            const traceMatch = TRACES_REGEX.exec(chartRest);
            if (traceMatch) {
                const traceId = traceMatch[1];
                const chart = charts[chartIndex] || {};
                const traces = get(chart, 'traces', []) || [];
                const traceIndex = findIndex(traces, { id: traceId });
                if (traceIndex !== -1) {
                    newPath = newPath.replace(traceId, traceIndex);
                }
            }
        }
    }
    return newPath;
};

/**
 * Get a widget dependency
 * @param {string} k - The dependency path
 * @param {object[]} widgets - The list of widgets
 * @param {object[]} maps - The list of maps
 * @returns {object|null} The widget dependency or null if not found
 */
export const getWidgetDependency = (k, widgets, maps) => {
    const regRes = WIDGETS_REGEX.exec(k);
    let rest = regRes && regRes[2];
    const widgetId = regRes[1];
    // in case of Map and layers regex matches, we need to extract the layer part.
    rest = getMapDependencyPath(rest, widgetId, maps);
    // in case of chart axis paths, resolve chart and axis ids to array indices.
    rest = getChartAxisDependencyPath(rest, widgetId, widgets);
    // in case of traces regex matches, we need to extract the trace part.
    rest = getTracesDependencyPath(rest, widgetId, widgets);

    const widget = getWidgetByDependencyPath(k, widgets);
    return rest
        ? get(widget, rest)
        : widget;
};

/**
 * it checks if a number is higher than threshold and returns a shortened version of it
 * @param {number} label to parse
 * @param {number} threshold threshold to check if it needs to be rounded
 * @param {number} decimals number of decimal to use when rounding
 * @return the shortened number plus a suffix or the label is a string is passed
*/
export const shortenLabel = (label, threshold = 1000, decimals = 1) => {
    if (!isNumber(label)) {
        return label;
    }
    let unit;
    let number = round(label);
    let add = number.toString().length % 3;
    if (number >= threshold) {
        let trimedDigits = number.toString().length - ( add === 0 ? add + 3 : add );
        let zeroNumber = (trimedDigits) / 3;
        let trimedNumber = number / Math.pow(10, trimedDigits);
        switch (zeroNumber) {
        case 1 :
            unit = ' K';
            break;
        case 2 :
            unit = ' M';
            break;
        case 3 :
            unit = ' B';
            break;
        case 4 :
            unit = ' T';
            break;
        default:
            unit = '';
        }
        number = round(trimedNumber, decimals) + unit;
    } else {
        number = round(label, Math.abs(4 - number.toString().length));
    }
    return number;
};

/**
 * returns default aggregation operations for
 * charts that can be used in widgtes and for
 * other features
 */
export const getDefaultAggregationOperations = () => {
    return [
        { value: "Count", label: "widgets.operations.COUNT"},
        { value: "Sum", label: "widgets.operations.SUM"},
        { value: "Average", label: "widgets.operations.AVG"},
        { value: "StdDev", label: "widgets.operations.STDDEV"},
        { value: "Min", label: "widgets.operations.MIN"},
        { value: "Max", label: "widgets.operations.MAX"}
    ];
};

export const CHART_PROPS = ["selectedChartId", "selectedTraceId", "id", "widgetType", "charts", "dataGrid", "title", "description", "globalWidgetMode"];
export const FILTER_PROPS = ["selectedFilterId", "id", "widgetType", "filters", "selections", "dataGrid", "title", "description", "interactions", "globalWidgetMode"];

/**
 * Check if layer can support a widget
 * @param {object} layer the map layer
 * @return {boolean} true if the layer can support a widget
 */
export const isWidgetLayerSupported = (layer) => !!layer?.search && layer.search !== 'vector';

const legacyColorsMap = {
    'global.colors.blue': '#0888A1',
    'global.colors.red': '#CD4A29',
    'global.colors.green': '#29CD2E',
    'global.colors.brown': '#CD8029',
    'global.colors.purple': '#CD29C7'
};
const legacyColorsToRamps = {
    'global.colors.blue': 'blues',
    'global.colors.red': 'reds',
    'global.colors.green': 'greens',
    'global.colors.brown': 'ylorbr',
    'global.colors.purple': 'purples',
    'global.colors.random': 'random'
};
/**
 * Return a default trace style
 * @param {string} type trace type one of `line`, `bar` or `pie`
 * @param {string} options.color overrides the default color
 * @param {string} options.ramp overrides the default color ramp value
 * @returns {object} trace style
 */
export const defaultChartStyle = (type, {
    color = legacyColorsMap['global.colors.blue'],
    ramp = 'blues'
} = {}) => {
    if (type === 'pie') {
        return {
            msClassification: {
                method: 'uniqueInterval',
                intervals: 5,
                reverse: false,
                ramp
            }
        };
    }
    if (type === 'bar') {
        return {
            msMode: 'simple',
            line: {
                color: 'rgb(0, 0, 0)',
                width: 0
            },
            marker: {
                color
            }
        };
    }
    return {
        line: {
            color,
            width: 2
        },
        marker: {
            color,
            size: 6
        }
    };
};
/**
 * Convert autoColorOptions style to trace style
 * @param {object} options.autoColorOptions a legacy color value
 * @param {string} options.type trace type one of `line`, `bar` or `pie`
 * @param {string} options.classificationAttributeType type of the classification attribute
 * @returns {object} trace style object
 */
const applyDefaultStyle = ({ autoColorOptions, type, classificationAttributeType }) => {
    if (!autoColorOptions) {
        return { style: defaultChartStyle(type) };
    }
    const method = classificationAttributeType === 'number' ? 'equalInterval' : 'uniqueInterval';
    if (autoColorOptions?.name === 'global.colors.custom') {
        return {
            style: {
                ...(['bar', 'line'].includes(type) ? { msMode: 'classification' } : {}),
                msClassification: {
                    method,
                    intervals: 5,
                    reverse: false,
                    ramp: 'viridis',
                    defaultColor: autoColorOptions.defaultCustomColor,
                    defaultLabel: autoColorOptions.defaultClassLabel,
                    classes: (method === 'uniqueInterval'
                        ? autoColorOptions.classification
                        : autoColorOptions.rangeClassification) || []
                }
            }
        };
    }
    if (type === 'pie') {
        return {
            style: {
                msClassification: {
                    method,
                    intervals: 5,
                    reverse: false,
                    ramp: legacyColorsToRamps[autoColorOptions.name]
                }
            }
        };
    }
    const color = legacyColorsMap[autoColorOptions.name];
    return { style: defaultChartStyle(type, { color }) };
};
/**
 * Generate the aggregation data key based on the availability of the aggregation function
 * @param {string} options.aggregateFunction aggregation function
 * @param {string} options.aggregationAttribute aggregation attribute
 * @returns {string} aggregation data key
 */
export const getAggregationAttributeDataKey = (options = {}) => {
    return !options.aggregateFunction || options.aggregateFunction === 'None'
        ? options.aggregationAttribute || ''
        : `${options.aggregateFunction}(${options.aggregationAttribute})`;
};
/**
 * Generate a new trace with default values
 * @param {string} options.type trace type one of `line`, `bar` or `pie`
 * @param {string} options.color default color of the trace
 * @param {boolean} options.randomColor use a random color if true and `color` is not defined
 * @param {string} options.geomProp the geometry property name associated with the layer
 * @param {object} options.layer a layer object configuration
 * @param {object} options.filter filter object associated with the layer
 * @returns {object} new trace object
 */
export const generateNewTrace = (options) => {
    const type = options?.type || 'bar';
    const color = options?.color
        ? options.color
        : options?.randomColor
            ? `rgb(${randomInt(255)}, ${randomInt(255)}, ${randomInt(255)})`
            : undefined;
    return {
        id: uuidv1(),
        type,
        layer: options?.layer,
        ...(options?.geomProp && { geomProp: options.geomProp }),
        ...(options?.filter && { filter: options.filter }),
        options: {},
        style: defaultChartStyle(type, { color })
    };
};
/**
 * Generate a chart supporting multiple traces structure
 * @param {object} chart legacy chart
 * @returns {object} chart structure using traces
 */
export const legacyChartToChartWithTraces = ({
    yAxis,
    xAxisAngle,
    type,
    options: chartOptions,
    autoColorOptions,
    legend,
    cartesian,
    chartId,
    xAxisOpts,
    yAxisOpts: yAxisOptsProp,
    yAxisLabel,
    tickPrefix,
    format,
    tickSuffix,
    formula,
    name,
    geomProp,
    layer,
    barChartType
} = {}) => {
    const { classificationAttributeType, ...options } = chartOptions || {};
    const {
        textinfo,
        includeLegendPercent,
        ...yAxisOpts
    } = yAxisOptsProp || {};
    return {
        name,
        legend,
        cartesian,
        chartId,
        barChartType,
        xAxisOpts: [{
            ...xAxisOpts,
            angle: xAxisAngle,
            id: 0
        }],
        yAxisOpts: [{
            ...yAxisOpts,
            hide: yAxis === false,
            id: 0
        }],
        traces: [{
            id: `trace-${chartId}`,
            name: yAxisLabel,
            type,
            options,
            ...applyDefaultStyle({
                autoColorOptions,
                classificationAttributeType,
                type
            }),
            textinfo,
            tickPrefix,
            format,
            tickSuffix,
            formula,
            geomProp,
            layer,
            includeLegendPercent
        }]
    };
};

const overflowsRows = (item, maxRows) => item.y + item.h > maxRows;

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const contentRows = (items = []) => items.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);

/**
 * First free position in reading order, null when a bounded grid is full.
 */
const findFreeSlot = (placed, size, cols, maxRows) => {
    const bounded = !!maxRows && isFinite(maxRows);
    const w = Math.min(size.w, cols);
    const h = bounded ? Math.min(size.h, maxRows) : size.h;
    const lastRow = bounded ? maxRows - h : contentRows(placed);
    for (let y = 0; y <= lastRow; y++) {
        for (let x = 0; x <= cols - w; x++) {
            const candidate = { x, y, w, h };
            if (!placed.some(other => overlaps(candidate, other))) {
                return candidate;
            }
        }
    }
    return null;
};

/**
 * Moves back the widgets saved beyond the available rows, unreachable where the container does not scroll.
 * @param {object[]} layout the layout items of one breakpoint
 * @param {number} cols columns of that breakpoint
 * @param {number} maxRows rows available, nothing is corrected without it
 * @returns {object[]} the layout, unchanged when every widget already fits
 */
export const fitLayoutInRows = (layout = [], cols = 6, maxRows) => {
    if (!maxRows || !isFinite(maxRows) || !layout.some(item => overflowsRows(item, maxRows))) {
        return layout;
    }
    const placed = layout.filter(item => !overflowsRows(item, maxRows));
    return layout.map(item => {
        if (!overflowsRows(item, maxRows)) {
            return item;
        }
        const w = Math.min(item.w, cols);
        const h = Math.min(item.h, maxRows);
        const slot = findFreeSlot(placed, { w: item.w, h: item.h }, cols, maxRows)
            || { x: Math.min(item.x, cols - w), y: maxRows - h, w, h };
        const fitted = { ...item, ...slot };
        placed.push(fitted);
        return fitted;
    });
};

/**
 * Places the widgets without a layout entry in free space, falling back to the origin on a full grid.
 * @param {object[]} layout the layout items of one breakpoint
 * @param {object[]} widgets the widgets of that container
 * @param {number} cols columns of that breakpoint
 * @param {number} maxRows rows available, unbounded when missing
 * @returns {object[]} the layout, with an entry added for every widget that lacked one
 */
export const placeNewWidgets = (layout = [], widgets = [], cols = 6, maxRows) => {
    const missing = widgets.filter(widget => !layout.some(item => item.i === widget.id));
    if (!missing.length) {
        return layout;
    }
    const placed = [...layout];
    missing.forEach(widget => {
        const { w = 1, h = 1 } = widget.dataGrid || {};
        const slot = findFreeSlot(placed, { w, h }, cols, maxRows)
            || { x: 0, y: 0, w: Math.min(w, cols), h };
        const added = { ...slot, i: widget.id };
        placed.push(added);
    });
    return placed;
};

const MAXIMIZE_TRANSIENT_PROPS = ['isDraggable', 'isResizable'];

const cleanLayoutItems = (items) => Array.isArray(items)
    ? items.map(item => omit(item, MAXIMIZE_TRANSIENT_PROPS))
    : items;

const cleanLayouts = (layouts) => {
    if (Array.isArray(layouts)) {
        return layouts.map(view => Object.keys(view || {})
            .reduce((acc, key) => ({ ...acc, [key]: cleanLayoutItems(view[key]) }), {}));
    }
    if (layouts && typeof layouts === 'object') {
        return Object.keys(layouts)
            .reduce((acc, key) => ({ ...acc, [key]: cleanLayoutItems(layouts[key]) }), {});
    }
    return layouts;
};

/**
 * Remove transient maximization properties from a stored widgets configuration.
 * The static property is a persistent user setting and is intentionally preserved.
 * @param {object} config stored widgets configuration
 * @returns {object} cleaned widgets configuration
 */
export const cleanMaximizedState = (config = {}) => ({
    ...config,
    ...(config.widgets ? {
        widgets: config.widgets.map(widget => widget.dataGrid
            ? { ...widget, dataGrid: omit(widget.dataGrid, MAXIMIZE_TRANSIENT_PROPS) }
            : widget)
    } : {}),
    ...(config.layouts ? { layouts: cleanLayouts(config.layouts) } : {}),
    ...(config.layout ? { layout: cleanLayoutItems(config.layout) } : {})
});

/**
 * Generate widget editor props
 * @param {object} action
 * @returns {object} updated editor change props
 */
export const editorChangeProps = (action) => {
    let key = action.key;
    let pathProp = key;
    const value = action.value;
    let regex = '';
    let identifier = '';
    if (key.includes('maps')) {
        pathProp = 'maps';
        regex = MAPS_REGEX;
        identifier = 'mapId';
    } else if (key.includes('charts')) {
        pathProp = 'charts';
        regex = CHARTS_REGEX;
        identifier = 'chartId';
    }
    return { path: `builder.editor.${pathProp}`, value, key, regex, identifier };
};

/**
 * Chart widget specific operation to perform multi chart management
 * @param {object} editorData
 * @param {string} key
 * @param {any} value
 * @returns {*}
 */
const chartWidgetOperation = ({ editorData, key, value }) => {

    const editorProp = pick(editorData, CHART_PROPS) || {};

    if (key === 'chart-layers') {
        const charts = value?.map((v) => ({
            chartId: uuidv1(),
            traces: [generateNewTrace({
                layer: v
            })]
        }));
        return {
            ...editorProp,
            charts,
            selectedChartId: charts?.[0]?.chartId,
            selectedTraceId: charts?.[0]?.traces?.[0]?.id
        };
    }
    if (key === 'chart-delete') {
        const charts = value;
        return {
            ...editorProp,
            charts,
            selectedChartId: charts?.[0]?.chartId,
            selectedTraceId: charts?.[0]?.traces?.[0]?.id
        };
    }
    if (key === 'chart-add') {
        const newCharts = value?.map(v => ({
            chartId: uuidv1(),
            traces: [generateNewTrace({
                layer: v
            })]
        }));
        const charts = [ ...(editorProp?.charts || []), ...newCharts ];
        return {
            ...editorProp,
            charts,
            selectedChartId: newCharts?.[0]?.chartId || charts?.[0]?.chartId,
            selectedTraceId: newCharts?.[0]?.traces?.[0]?.id || charts?.[0]?.traces?.[0]?.id
        };
    }
    if (key === 'chart-layer-replace') {
        const layer = value.layer[0];
        const charts = (editorProp.charts || []).map((chart) => {
            if (chart.chartId === value.chartId) {
                return {
                    ...chart,
                    traces: (chart?.traces || []).map((trace) => {
                        if (trace.id === value.traceId) {
                            return { ...trace, layer, options: {} };
                        }
                        return trace;
                    })
                };
            }
            return chart;
        });
        return {
            ...editorProp,
            charts
        };
    }

    return editorProp;
};

/**
 * Filter widget specific operation to perform multi filter management
 * @param {object} editorData
 * @param {string} key
 * @param {any} value
 * @returns {*}
 */
const filterWidgetOperation = ({ editorData, key, value }) => {
    const editorProp = pick(editorData, FILTER_PROPS) || {};
    if (key === 'filter-layer') {
        const { filterId, layer } = value || {};
        if (!filterId) {
            return editorProp;
        }
        const filters = (editorProp.filters || []).map((filter) => {
            if (filter.id === filterId) {
                return {
                    ...filter,
                    data: {
                        ...(filter.data || {}),
                        layer: layer[0],
                        valueAttribute: undefined,
                        labelAttribute: undefined,
                        sortByAttribute: undefined,
                        userDefinedItems: []
                    }
                };
            }
            return filter;
        });
        const newInteractions = (editorProp.interactions ?? []).filter(interaction => !interaction.source.nodePath.includes(filterId));
        return {
            ...editorProp,
            filters,
            selections: {
                ...(editorProp.selections || {}),
                [filterId]: []
            },
            interactions: newInteractions
        };
    }

    if (key === 'filter-add') {
        // value: array of layers
        const layers = castArray(value);
        const existingFilters = editorProp.filters || [];
        // createNewFilter signature: (filtersCount = 0) => { id, label, name, layout: { variant, icon, selectionMode, ... }, items, data }
        const newFilters = layers.map((layer, index) => {
            const filter = createNewFilter(existingFilters.length + index);
            // Set the layer from the value
            filter.data = {
                ...filter.data,
                layer
            };
            return filter;
        });
        const filters = [...existingFilters, ...newFilters];
        const newSelections = newFilters.reduce((acc, filter) => ({
            ...acc,
            [filter.id]: []
        }), {});
        return {
            ...editorProp,
            filters,
            selectedFilterId: newFilters[0]?.id || filters[0]?.id || editorProp.selectedFilterId,
            selections: {
                ...(editorProp.selections || {}),
                ...newSelections
            }
        };
    }
    if (key === 'filter-delete') {
        // value: array of filterIds or single filterId
        const filterIdsToDelete = castArray(value);
        const filters = (editorProp.filters || []).filter(filter => !filterIdsToDelete.includes(filter.id));
        const selections = { ...(editorProp.selections || {}) };
        filterIdsToDelete.forEach(filterId => {
            delete selections[filterId];
        });
        const selectedFilterId = filterIdsToDelete.includes(editorProp.selectedFilterId)
            ? (filters[0]?.id || null)
            : editorProp.selectedFilterId;
        return {
            ...editorProp,
            filters,
            selectedFilterId,
            selections
        };
    }

    return editorProp;
};

// Add value to trace[id] paths
const insertTracesOnEditorChange = ({
    identifier,
    id,
    charts,
    pathToUpdate,
    value
}) => {
    if (pathToUpdate.includes('traces[')) {
        const currentChart = charts.find(m => m[identifier] === id);
        const traces = get(currentChart, 'traces', []);
        const [, traceId, tracePathToUpdate] = TRACES_REGEX.exec(pathToUpdate) || [];
        const tracesIds = traces.map((trace) => trace.id);
        const traceIndex = tracesIds.indexOf(traceId);
        if (traceIndex > -1) {
            const newTraces = traces.map((trace) => trace.id === traceId ? set(tracePathToUpdate, value, trace) : trace);
            return set('traces', newTraces, charts.find(m => m[identifier] === id));
        }
    }
    return set(pathToUpdate, value, charts.find(m => m[identifier] === id));
};

/**
 * Perform state with widget editor changes
 * @param {object} action
 * @param {object} state object
 * @returns {object|object[]} updated state
 */
export const editorChange = (action, state) => {
    const { key, path, identifier, regex, value } = editorChangeProps(action);
    // Update multi widgets (currently charts and maps)
    if (['maps', 'charts'].some(k => key.includes(k))) {
        if (key === 'maps' && value === undefined) {
            return set(path, value, state);
        }
        const [, id, pathToUpdate] = regex.exec(key) || [];
        let updatedValue = value;
        if (id) {
            const editorArray = get(state, path, []);
            updatedValue = insertTracesOnEditorChange({
                identifier,
                id,
                charts: editorArray,
                pathToUpdate,
                value
            });
        }
        return arrayUpsert(path, updatedValue, {[identifier]: id || value?.[identifier]}, state);
    }
    const editorData = { ...state?.builder?.editor };
    // Widget specific editor changes
    if (key.includes(`chart-`)) {
        // TODO Allow to support all widget types that might support multi widget feature
        return set('builder.editor', chartWidgetOperation({key, value, editorData}), state);
    }
    if (key.includes(`filter-`)) {
        return set('builder.editor', filterWidgetOperation({key, value, editorData}), state);
    }
    return set(path, value, state);
};

/**
 * Get the current selected trace data
 * @param {object} chart widget chart data
 * @param {string} chart.selectedChartId selected chart identifier
 * @param {string} chart.selectedTraceId selected traces identifier
 * @param {array} chart.charts widget charts
 * @returns {object} selected trace data
 */
export const extractTraceData = ({ selectedChartId, selectedTraceId, charts } = {}) => {
    const selectedChart = (charts || []).find(chart => chart.chartId === selectedChartId);
    const selectedTrace = (selectedChart?.traces || []).find(trace => trace.id === selectedTraceId);
    return selectedTrace || selectedChart?.traces?.[0];
};
/**
 * Get editing widget from widget data with multi support
 * @param {object} widget editing widget
 * @returns {object} selected widget data
 */
/**
 * Updates a widget property in a widgets list. In `merge` mode, `maps` merges the map with the same `mapId`
 * and the other keys merge the object value
 * @param {object[]} widgets the widgets list
 * @param {object} update `{ id, key, value, mode }`
 * @returns {object[]} the updated widgets list
 */
export const updateWidgetPropertyInList = (widgets = [], { id, key, value, mode } = {}) => {
    const oldWidget = find(widgets, { id });
    let updatedValue = value;
    if (mode === "merge") {
        updatedValue = key === "maps"
            ? oldWidget?.maps?.map(m => m.mapId === value?.mapId ? { ...m, ...value } : m)
            : Object.assign({}, oldWidget?.[key], value);
    }
    return arrayUpsert(null, set(key, updatedValue, oldWidget), { id }, widgets);
};

export const getSelectedWidgetData = (widget = {}) => {
    if (widget.widgetType === 'chart' || widget.charts) {
        const widgetData = extractTraceData(widget);
        return widgetData;
    }
    if (widget.widgetType === 'map' || widget.maps) {
        return widget?.maps?.find(c => c.mapId === widget?.selectedMapId) || {};
    }
    return widget;
};

export const DEFAULT_MAP_SETTINGS = {
    projection: 'EPSG:900913',
    units: 'm',
    center: {
        x: 11.22894105149402,
        y: 43.380053862794,
        crs: 'EPSG:4326'
    },
    maxExtent: [
        -20037508.34,
        -20037508.34,
        20037508.34,
        20037508.34
    ],
    mapId: null,
    size: {
        width: 1300,
        height: 920
    },
    version: 2,
    limits: {},
    mousePointer: 'pointer',
    resolutions: [
        156543.03392804097,
        78271.51696402048,
        39135.75848201024,
        19567.87924100512,
        9783.93962050256,
        4891.96981025128,
        2445.98490512564,
        1222.99245256282,
        611.49622628141,
        305.748113140705,
        152.8740565703525,
        76.43702828517625,
        38.21851414258813,
        19.109257071294063,
        9.554628535647032,
        4.777314267823516,
        2.388657133911758,
        1.194328566955879,
        0.5971642834779395,
        0.29858214173896974,
        0.14929107086948487,
        0.07464553543474244,
        0.03732276771737122,
        0.01866138385868561,
        0.009330691929342804,
        0.004665345964671402,
        0.002332672982335701,
        0.0011663364911678506,
        0.0005831682455839253,
        0.00029158412279196264,
        0.00014579206139598132
    ]
};
// add labels and utils to classification classes
const parseClasses = (classes, {
    legendValue
} = {}) => {
    return classes.map((entry, idx, arr) => ({
        ...entry,
        index: idx,
        ...(entry.unique !== undefined
            ? {
                label: entry.title || entry.unique,
                insideClass: (value) => value === entry.unique
            }
            : {
                label: (entry.title || (
                    idx < arr.length - 1
                        ? `>= ${entry.min}<br>< ${entry.max}`
                        : `>= ${entry.min}<br><= ${entry.max}`
                )),
                insideClass: (value) => idx < arr.length - 1
                    ? value >= entry.min && value < entry.max
                    : value >= entry.min && value <= entry.max
            })
    })).map((entry) => ({
        ...entry,
        label: `${entry.label || ''}`
            .replace('${minValue}', entry.min ?? '')
            .replace('${maxValue}', entry.max ?? '')
            .replace('${legendValue}', legendValue || '')
    }));
};
// return correct sorting keys for classification based on the trace type
const getSortingKeys = ({ type, options, sortBy }) => {
    if (type === 'pie') {
        const labelDataKey = options?.groupByAttributes;
        const valueDataKey = getAggregationAttributeDataKey(options);
        const classificationDataKey = options?.classificationAttribute || labelDataKey;
        const sortByKey = sortBy !== 'groupBy' ?  valueDataKey : labelDataKey;
        const isNestedPieChart = !(classificationDataKey === labelDataKey);
        const sortKey = isNestedPieChart ? classificationDataKey : sortByKey;
        // we need to reverse the order when sorting by value data key
        // in this way we see the bigger slice as first from the top
        // with the other displayed clockwise
        const sortFunc = sortByKey === valueDataKey
            ? (a, b) => a.index > b.index ? -1 : 1
            : (a, b) => a.index > b.index ? 1 : -1;
        const legendValue = classificationDataKey;
        return {
            sortKey,
            sortByKey,
            classificationDataKey,
            legendValue,
            customSortFunc: !isNestedPieChart && sortFunc
        };
    }
    if (type === 'bar' || type === 'line') {
        const xDataKey = options?.groupByAttributes;
        const classificationDataKey = options?.classificationAttribute || xDataKey;
        const yDataKey = getAggregationAttributeDataKey(options);
        const sortByKey = sortBy !== 'aggregation' ?  xDataKey : yDataKey;
        const sortKey = classificationDataKey === xDataKey
            ? sortByKey
            : classificationDataKey;
        const legendValue = yDataKey;
        return { sortKey, sortByKey, classificationDataKey, legendValue };
    }
    return {};
};
/**
 * Get editing widget from widget data with multi support
 * @param {object} widget editing widget
 * @returns {object} selected widget data
 */
export const generateClassifiedData = ({
    type,
    data,
    sortBy,
    options,
    msClassification,
    classifyGeoJSON,
    excludeOthers,
    applyCustomSortFunctionOnClasses
}) => {
    const {
        ramp = 'viridis',
        intervals = 5,
        reverse,
        method: methodStyle = 'uniqueInterval',
        classes: classesStyle,
        defaultColor = '#ffff00',
        defaultLabel = 'Others'
    } = msClassification || {};

    const { customSortFunc, sortKey, sortByKey, classificationDataKey, legendValue } = getSortingKeys({ type, options, sortBy });

    const customClasses = classesStyle && parseClasses(classesStyle, {
        legendValue
    });
    const isStringData = isString(data?.[0]?.[classificationDataKey]);
    const sortFunc = data.type === 'pie'
        ? (a, b) => a[sortKey] > b[sortKey] ? -1 : 1
        : (a, b) => a[sortKey] > b[sortKey] ? 1 : -1;
    const initialSortedData = [...data].sort(sortFunc);
    const method = isStringData
        ? 'uniqueInterval'
        : methodStyle;
    const computedClasses = (customClasses || parseClasses(
        classifyGeoJSON({
            type: 'FeatureCollection',
            features: initialSortedData.map((properties) => ({ properties, type: 'Feature', geometry: null }))
        }, {
            attribute: classificationDataKey,
            method,
            ramp,
            reverse,
            intervals,
            sort: false
        })
    ));
    const othersClass = {
        color: defaultColor,
        label: (defaultLabel || '')
            .replace('${legendValue}', legendValue || ''),
        index: computedClasses.length
    };
    const classifiedData = initialSortedData.map((properties) => {
        const entry = computedClasses.find(({ insideClass }) => insideClass(properties[classificationDataKey]));
        const selectedEntry = entry ? entry : othersClass;
        return {
            ...selectedEntry,
            properties,
            label: (selectedEntry.label || '').replace('${groupByValue}', properties[options?.groupByAttributes] || '')
        };
    });
    const classes = excludeOthers
        ? computedClasses
        : [...computedClasses, othersClass];
    return {
        sortByKey,
        classes: customSortFunc && applyCustomSortFunctionOnClasses
            ? classes.sort(customSortFunc)
            : classes,
        classifiedData: customSortFunc
            ? classifiedData.sort(customSortFunc)
            : classifiedData
    };
};
/**
 * Ensure a valid number is returned
 * @param {number} num a number
 * @returns {number} valid number
 */
export const parseNumber = (num) => isNumber(num) && !isNaN(num) ? num : 0;
/**
 * Perform a sum aggregation for pie chart data with no aggregation
 * to get the correct number of slices
 * @param {object} data chart data
 * @param {string} options.groupByAttributes group by attribute
 * @param {string} options.aggregationAttribute aggregation attribute
 * @param {string} options.aggregateFunction aggregate function
 * @param {string} options.classificationAttribute classification function
 * @returns {object} aggregated data
 */
export const parsePieNoAggregationFunctionData = (data, options = {}) => {
    const labelDataKey = options?.groupByAttributes;
    const valueDataKey = getAggregationAttributeDataKey(options);
    const hasAggregateFunction = !(!options.aggregateFunction || options.aggregateFunction === 'None');
    const classificationDataKey = options?.classificationAttribute || labelDataKey;
    const isNestedPieChart = !(classificationDataKey === labelDataKey);
    if (data && !hasAggregateFunction && !isNestedPieChart) {
        // we need to sum value with the same label property
        // if the aggregation is missing
        // this is needed to get correct number of slices
        const labelProperties = uniq(data.map((properties) => properties[labelDataKey]));
        return labelProperties.map((labelProperty) => {
            const filteredData = data.filter(properties => properties[labelDataKey] === labelProperty);
            return {
                [labelDataKey]: labelProperty,
                [valueDataKey]: filteredData.reduce((sum, properties) => sum + parseNumber(properties[valueDataKey]), 0)
            };
        });
    }
    return data;
};
/**
 * Verify validity of a chart
 * @param {string} options.groupByAttributes group by attribute
 * @param {string} options.aggregationAttribute aggregation attribute
 * @param {string} options.aggregateFunction aggregate function
 * @param {string} options.classificationAttribute classification function
 * @param {boolean} props.hasAggregateProcess true if the associated service has aggregation
 * @returns {boolean} true if valid
 */
export const isChartOptionsValid = (options = {}, { hasAggregateProcess }) => {
    return !!(
        options.aggregationAttribute
        && options.groupByAttributes
        // if aggregate process is not present, the aggregateFunction is not necessary. if present, is mandatory
        && (!hasAggregateProcess || hasAggregateProcess && options.aggregateFunction)
        || options.classificationAttribute
    );
};
/**
 * Verify if the bar chart stack option can be enabled
 * @param {string} chart a widget chart configuration
 * @returns {boolean} true if the option can be enabled
 */
export const enableBarChartStack = (chart = {}) => {
    const barTraces = (chart?.traces || [])?.filter(trace => trace.type === 'bar');
    // if there is only one bar chart
    // allow the stack selection only for classification
    if (barTraces.length === 1) {
        return barTraces[0]?.style?.msMode === 'classification';
    }
    // if there is a single x/y axis
    // and multiple bar charts
    // allow the stack option
    if (barTraces.length > 1
        && (chart.xAxisOpts || [{ id: 0 }]).length === 1
        && (chart.yAxisOpts || [{ id: 0 }]).length === 1) {
        return true;
    }
    // in other all other cases allow only group
    // the reason is related to the overlay behavior for each new axis added
    return false;
};

/**
 * Returns true if the table shows the column filters, when it sends interactions
 * @param {object} widget the widget to check
 * @returns {boolean}
 */
/**
 * Widget properties of the UI state (e.g. the table zoom loader), not saved
 */
export const TRANSIENT_WIDGET_PROPS = ['zoomLoading'];

/**
 * Removes the transient UI properties from the widgets to save
 * @param {object[]} widgets the widgets
 * @returns {object[]} the widgets without the transient properties
 */
export const omitTransientWidgetProps = (widgets) => {
    if (!Array.isArray(widgets)) {
        return widgets;
    }
    const stripped = widgets.map(widget => TRANSIENT_WIDGET_PROPS.some(prop => prop in (widget || {}))
        ? omit(widget, TRANSIENT_WIDGET_PROPS)
        : widget);
    return stripped.some((widget, idx) => widget !== widgets[idx]) ? stripped : widgets;
};

export const isTableColumnFiltersEnabled = (widget) => widget?.widgetType === 'table'
    && (widget.interactions || []).some(interaction => interaction?.plugged);

const createRectShape = (axisId, axisType, startTime, endTime, fill = {}) => {
    const isX = axisType === 'x';
    return {
        type: 'rect',
        xref: isX ? axisId : 'paper',
        yref: isX ? 'paper' : axisId,
        x0: isX ? startTime : 0,
        x1: isX ? endTime : 1,
        y0: isX ? 0 : startTime,
        y1: isX ? 1 : endTime,
        fillcolor: 'rgba(187, 196, 198, 0.4)',
        line: { width: 0 },
        layer: 'below',
        ...fill
    };
};

const createLineShape = (axisId, axisType, time, line = {}) => {
    const isX = axisType === 'x';
    return {
        type: 'line',
        xref: isX ? axisId : 'paper',
        yref: isX ? 'paper' : axisId,
        x0: isX ? time : 0,
        x1: isX ? time : 1,
        y0: isX ? 0 : time,
        y1: isX ? 1 : time,
        layer: 'above',
        line: {
            color: 'rgb(55, 128, 191)',
            width: 3,
            ...line
        }
    };
};

export const DEFAULT_CURRENT_TIME_SHAPE_STYLE = [
    "solid",
    "dot",
    "dash",
    "longdash",
    "dashdot",
    "longdashdot"
];
export const DEFAULT_CURRENT_TIME_SHAPE_VALUES = {
    color: 'rgba(58, 186, 111, 0.75)',
    size: 3,
    style: DEFAULT_CURRENT_TIME_SHAPE_STYLE[2]
};

// the current time is set on the axis by the dimension interactions (e.g. the main map timeline)
const getAxisTimes = (axis) => ({
    startTime: axis.appliedCurrentTime,
    endTime: axis.appliedOffsetTime,
    hasBothDates: axis.appliedCurrentTime && axis.appliedOffsetTime
});

const addAxisShapes = (axisOpts, axisType) => {
    const shapes = [];

    axisOpts.forEach((axis, index) => {
        if (axis.type === 'date') {
            const { startTime, endTime, hasBothDates } = getAxisTimes(axis);
            if (!startTime && !endTime) {
                return;
            }
            const axisId = index === 0 ? axisType : `${axisType}${index + 1}`;
            if (hasBothDates) {
                shapes.push(createRectShape(axisId, axisType, startTime, endTime, {
                    fillcolor: axis.currentTimeShape?.color || DEFAULT_CURRENT_TIME_SHAPE_VALUES.color
                }));
            } else {
                // Single dashed line
                shapes.push(createLineShape(axisId, axisType, startTime, {
                    color: axis.currentTimeShape?.color || DEFAULT_CURRENT_TIME_SHAPE_VALUES.color,
                    dash: axis.currentTimeShape?.style || DEFAULT_CURRENT_TIME_SHAPE_VALUES.style,
                    width: axis.currentTimeShape?.size || DEFAULT_CURRENT_TIME_SHAPE_VALUES.size
                }));
            }
        }
    });

    return shapes;
};

/**
 * Returns the shapes of the current time (line) or time range (band) of the date axes of a chart
 * @param {object} data `{ xAxisOpts, yAxisOpts }` of the chart, with the axis `appliedCurrentTime` and `appliedOffsetTime`
 * @returns {object[]} the shapes of both axes
 */
export const addCurrentTimeShapes = (data = {}) => [
    ...addAxisShapes(data.xAxisOpts || [], 'x'),
    ...addAxisShapes(data.yAxisOpts || [], 'y')
];

/**
 * Returns the next available view name in the format "View X".
 *
 * @param {Array<{ name?: string }>} data - List of items containing view names.
 * @returns {string} Next available view name.
 */
export const getNextAvailableName = (data) => {
    const newViewPattern = /^View (\d+)$/;
    const existingNumbers = data
        .map(l => {
            const match = l.name?.match(newViewPattern);
            return match ? parseInt(match[1], 10) : null;
        })
        .filter(num => num !== null);

    if (existingNumbers.length === 0) {
        return `View 1`;
    }

    existingNumbers.sort((a, b) => a - b);

    let nextNumber = 1;
    for (const num of existingNumbers) {
        if (num === nextNumber) {
            nextNumber++;
        } else if (num > nextNumber) {
            break;
        }
    }

    return `View ${nextNumber}`;
};

/**
 * Returns the default placeholder for Null value based on the data type.
 * @param {string} type - The data type ('int', 'number', 'date', 'time', 'date-time', 'string', 'boolean')
 * @returns {number|string} The default placeholder value for the given type
 */
export const getDefaultNullPlaceholderForDataType = (type) => {
    switch (type) {
    case 'int':
    case 'number':
        return 0;
    case 'date':
        return moment().format(dateFormats.date); // e.g., "2025-10-21Z"
    case 'time':
        return `1970-01-01T${moment().format(dateFormats.time)}`; // e.g., "1970-01-01T14:30:45Z"
    case 'date-time':
        return moment().format(dateFormats['date-time']); // e.g., "2025-10-21T14:30:45Z"
    case 'string':
    case 'boolean':
    default:
        return "NULL";
    }
};

/**
 * Returns the appropriate error message ID based on HTTP status code.
 * @param {Object} error - The error object containing a status code.
 * @returns {string} The corresponding message ID for the given error.
 */
export function getErrorMessageId(error) {
    if (error.status === 403) {
        return "dashboard.errors.loading.dashboardNotAccessible";
    } else if (error.status === 404) {
        return "dashboard.errors.loading.dashboardDoesNotExist";
    }
    return "dashboard.errors.loading.title";
}

export const cleanPaths = p => {
    return p
        ?.replace(/^root/, '')
        .replace(/^\./, '') // remove dot at the beginning because root removed
        .replace(/^maps\./, 'map.'); // clean wrong maps. prefix for main map
};
