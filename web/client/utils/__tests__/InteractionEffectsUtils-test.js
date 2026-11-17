/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    TARGET_EFFECTS,
    SENDER_DATA_BUILDERS,
    applyFilterEffect,
    applyStyleEffect,
    applyDimensionEffect,
    buildFilterWidgetAppliedData,
    buildTableWidgetAppliedData,
    getTableWidgetZoomExtentLayers,
    buildMapWidgetAppliedData,
    applyViewSyncEffect,
    prefixWidgetInteractionIds,
    applyZoomToFeatureEffect,
    applyLegendEffect,
    mergeLegendLayerChanges,
    EVENT_TARGET_TYPES,
    getTargetGeometryAttribute,
    isTransientEffectSender,
    stripTransientEffects,
    SENDER_ZOOM_EXTENT_LAYERS,
    getSenderSourceIds,
    cleanupEffectsBySenderId,
    cleanupInteractionsAfterLayerDeletion,
    cleanupInteractionsAfterWidgetDeletion,
    INTERACTION_UPDATES
} from '../InteractionEffectsUtils';
import { TARGET_TYPES } from '../InteractionUtils';
import { buildExcludeCQLFilter } from '../FilterEventUtils';
import { FILTER_SELECTION_MODES } from '../../components/widgets/builder/wizard/filter/FilterDataTab/constants';

const SENDER_ID = 'filter-widget-1';
const FILTER_ID = 'filter-1';
const TABLE_ID = 'table-1';
const LAYER_ID = 'layer-1';

const makeFilterWidget = (overrides = {}) => ({
    id: SENDER_ID,
    widgetType: 'filter',
    filters: [{
        id: FILTER_ID,
        data: { dataSource: 'features', valuesFrom: 'grouped', valueAttribute: 'STATE_NAME' }
    }],
    selections: { [FILTER_ID]: ['Arizona'] },
    interactions: [],
    ...overrides
});

const makeInteraction = (overrides = {}) => ({
    id: 'int-1',
    plugged: true,
    targetType: TARGET_TYPES.APPLY_FILTER,
    source: { nodePath: `root.widgets[${SENDER_ID}].filters[${FILTER_ID}]` },
    target: { nodePath: `root.widgets[${TABLE_ID}]` },
    appliedData: { format: 'cql', version: '1.0.0', body: "STATE_NAME = 'Arizona'" },
    ...overrides
});

const makeContext = ({ widgets = [], layers = [] } = {}) => ({ widgets, layers, target: 'floating' });

describe('InteractionEffectsUtils', () => {
    describe('registries', () => {
        it('TARGET_EFFECTS maps target types to effects, zoom-to excluded', () => {
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_FILTER]).toBe(applyFilterEffect);
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_STYLE]).toBe(applyStyleEffect);
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_DIMENSION]).toBe(applyDimensionEffect);
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_SPATIAL_FILTER]).toBe(applyFilterEffect);
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_ZOOM_TO]).toNotExist();
        });
        it('SENDER_DATA_BUILDERS has the filter, table and map widgets', () => {
            expect(Object.keys(SENDER_DATA_BUILDERS)).toEqual(['filter', 'table', 'map']);
            expect(SENDER_DATA_BUILDERS.map).toBe(buildMapWidgetAppliedData);
            expect(SENDER_DATA_BUILDERS.filter).toBe(buildFilterWidgetAppliedData);
            expect(SENDER_DATA_BUILDERS.table).toBe(buildTableWidgetAppliedData);
        });
        it('getSenderSourceIds', () => {
            expect(getSenderSourceIds(makeFilterWidget())).toEqual([FILTER_ID]);
            expect(getSenderSourceIds({ widgetType: 'filter' })).toEqual([]);
            expect(getSenderSourceIds({ id: TABLE_ID, widgetType: 'table' })).toEqual([TABLE_ID]);
            expect(getSenderSourceIds({ widgetType: 'table' })).toEqual([]);
            expect(getSenderSourceIds({ id: 'm', widgetType: 'map', maps: [{ mapId: 'm1' }, { mapId: 'm2' }] })).toEqual(['m1', 'm2']);
            expect(getSenderSourceIds({ id: 'legend-1', widgetType: 'legend' })).toEqual(['legend-1']);
            expect(getSenderSourceIds({ id: 'c', widgetType: 'chart' })).toEqual([]);
            expect(getSenderSourceIds()).toEqual([]);
        });
    });

    describe('buildFilterWidgetAppliedData', () => {
        it('returns the CQL filter of the selections', () => {
            const data = buildFilterWidgetAppliedData(makeFilterWidget(), FILTER_ID, makeInteraction());
            expect(data.format).toBe('cql');
            expect(data.body).toContain('Arizona');
            expect(data.filterId).toBe(FILTER_ID);
        });
        it('returns null for a disabled or missing filter', () => {
            const widget = makeFilterWidget({ filters: [{ ...makeFilterWidget().filters[0], disabled: true }] });
            expect(buildFilterWidgetAppliedData(widget, FILTER_ID, makeInteraction())).toBe(null);
            expect(buildFilterWidgetAppliedData(makeFilterWidget(), 'missing', makeInteraction())).toBe(null);
        });
        it('applies the no selection mode only without selections', () => {
            const filter = { ...makeFilterWidget().filters[0], data: { ...makeFilterWidget().filters[0].data, noSelectionMode: FILTER_SELECTION_MODES.EXCLUDE } };
            const noSelection = makeFilterWidget({ filters: [filter], selections: {} });
            expect(buildFilterWidgetAppliedData(noSelection, FILTER_ID, makeInteraction())).toEqual(buildExcludeCQLFilter(FILTER_ID));
            const defaultMode = makeFilterWidget({ selections: {} });
            expect(buildFilterWidgetAppliedData(defaultMode, FILTER_ID, makeInteraction())).toBe(null);
        });
        it('returns the style name for apply style', () => {
            const widget = makeFilterWidget({
                filters: [{ id: FILTER_ID, data: { userDefinedItems: [{ id: 'item-1', style: { name: 'red' } }] } }],
                selections: { [FILTER_ID]: ['item-1'] }
            });
            expect(buildFilterWidgetAppliedData(widget, FILTER_ID, makeInteraction({ targetType: TARGET_TYPES.APPLY_STYLE }))).toBe('red');
            expect(buildFilterWidgetAppliedData(makeFilterWidget({ selections: {} }), FILTER_ID, makeInteraction({ targetType: TARGET_TYPES.APPLY_STYLE }))).toNotExist();
        });
        it('returns the selected value for apply dimension', () => {
            const interaction = makeInteraction({ targetType: TARGET_TYPES.APPLY_DIMENSION });
            expect(buildFilterWidgetAppliedData(makeFilterWidget({ selections: { [FILTER_ID]: [{ value: '2020-01-01' }] } }), FILTER_ID, interaction)).toBe('2020-01-01');
            expect(buildFilterWidgetAppliedData(makeFilterWidget({ selections: { [FILTER_ID]: ['2021'] } }), FILTER_ID, interaction)).toBe('2021');
            expect(buildFilterWidgetAppliedData(makeFilterWidget({ selections: {} }), FILTER_ID, interaction)).toBe(null);
        });
    });

    describe('buildTableWidgetAppliedData', () => {
        const options = { propertyName: ['STATE_NAME', 'PERSONS'] };
        const quickFilters = { STATE_NAME: { rawValue: 'Arizona', value: 'Arizona', operator: 'ilike', type: 'string', attribute: 'STATE_NAME' } };
        const filter = {
            groupFields: [{ id: 1, logic: 'OR', index: 0 }],
            filterFields: [{ rowId: 1, groupId: 1, attribute: 'PERSONS', operator: '>', value: 1000, type: 'number' }]
        };
        it('returns the CQL of the column filters', () => {
            const data = buildTableWidgetAppliedData({ quickFilters, options });
            expect(data.format).toBe('cql');
            expect(data.version).toBe('1.0.0');
            expect(data.body).toContain('STATE_NAME');
        });
        it('returns the CQL of the configured filter', () => {
            const data = buildTableWidgetAppliedData({ filter, options });
            expect(data.body).toContain('PERSONS');
        });
        it('combines configured filter and column filters', () => {
            const data = buildTableWidgetAppliedData({ filter, quickFilters, options });
            expect(data.body).toContain('PERSONS');
            expect(data.body).toContain('STATE_NAME');
        });
        it('ignores column filters of hidden columns', () => {
            expect(buildTableWidgetAppliedData({ quickFilters, options: { propertyName: ['PERSONS'] } })).toBe(null);
        });
        it('returns null without filters', () => {
            expect(buildTableWidgetAppliedData({ options })).toBe(null);
            expect(buildTableWidgetAppliedData()).toBe(null);
        });
    });

    describe('getTableWidgetZoomExtentLayers', () => {
        const layer = { id: 'layer-1', name: 'topp:states', url: '/geoserver/wms' };
        const options = { propertyName: ['STATE_NAME'] };
        const quickFilters = { STATE_NAME: { rawValue: 'Arizona', value: 'Arizona', operator: 'ilike', type: 'string', attribute: 'STATE_NAME' } };
        it('returns the table layer filtered by the table filters', () => {
            const [extentLayer] = getTableWidgetZoomExtentLayers({ layer, options, quickFilters });
            expect(extentLayer.name).toBe(layer.name);
            expect(extentLayer.url).toBe(layer.url);
            expect(Object.keys(extentLayer.layerFilter).length > 0).toBe(true);
            expect(SENDER_ZOOM_EXTENT_LAYERS.table).toBe(getTableWidgetZoomExtentLayers);
        });
        it('returns no layers without filter or layer', () => {
            expect(getTableWidgetZoomExtentLayers({ layer, options })).toEqual([]);
            expect(getTableWidgetZoomExtentLayers({ options, quickFilters })).toEqual([]);
            expect(getTableWidgetZoomExtentLayers()).toEqual([]);
        });
    });

    describe('applyFilterEffect', () => {
        it('adds the filter to a table widget tagged with the sender', () => {
            const context = makeContext({ widgets: [{ id: TABLE_ID, widgetType: 'table' }] });
            const action = applyFilterEffect(makeInteraction(), context);
            expect(action.type).toBe(INTERACTION_UPDATES.WIDGET_PROPERTY);
            expect(action.key).toBe('interactionFilters');
            expect(action.value.length).toBe(1);
            expect(action.value[0].id).toBe('int-1');
            expect(action.value[0].appliedFromWidget).toBe(SENDER_ID);
        });
        it('replaces its own filter and preserves the others', () => {
            const other = { id: 'other', appliedFromWidget: 'another-sender' };
            const previous = { id: 'int-1', appliedFromWidget: SENDER_ID, filters: [{ body: 'old' }] };
            const context = makeContext({ widgets: [{ id: TABLE_ID, widgetType: 'table', interactionFilters: [other, previous] }] });
            const action = applyFilterEffect(makeInteraction(), context);
            expect(action.value.length).toBe(2);
            expect(action.value[0]).toEqual(other);
            expect(action.value[1].filters[0].body).toBe("STATE_NAME = 'Arizona'");
        });
        it('removes its own filter when there is no applied data', () => {
            const previous = { id: 'int-1', appliedFromWidget: SENDER_ID };
            const context = makeContext({ widgets: [{ id: TABLE_ID, widgetType: 'table', interactionFilters: [previous] }] });
            expect(applyFilterEffect(makeInteraction({ appliedData: null }), context).value).toEqual([]);
        });
        it('adds the filter to a main map layer', () => {
            const context = makeContext({ layers: [{ id: LAYER_ID, layerFilter: { filters: [{ id: 'own' }] } }] });
            const action = applyFilterEffect(makeInteraction({ target: { nodePath: `map.layers[${LAYER_ID}]` } }), context);
            expect(action.type).toBe(INTERACTION_UPDATES.LAYER_PROPERTIES);
            expect(action.properties.layerFilter.filters.map(f => f.id)).toEqual(['own', 'int-1']);
        });
        it('returns null when the target widget does not exist', () => {
            expect(applyFilterEffect(makeInteraction(), makeContext())).toBe(null);
            expect(applyFilterEffect(makeInteraction({ target: {} }), makeContext())).toBe(null);
        });
    });

    describe('applyStyleEffect', () => {
        it('returns null when the target layer does not exist', () => {
            const interaction = makeInteraction({ targetType: TARGET_TYPES.APPLY_STYLE, target: { nodePath: `map.layers[${LAYER_ID}]` }, appliedData: 'red' });
            expect(applyStyleEffect(interaction, makeContext())).toBe(null);
            const action = applyStyleEffect(interaction, makeContext({ layers: [{ id: LAYER_ID }] }));
            expect(action.properties).toEqual({ style: 'red' });
        });
    });

    describe('applyDimensionEffect', () => {
        it('returns a current time update for the map time target', () => {
            const interaction = makeInteraction({ targetType: TARGET_TYPES.APPLY_DIMENSION, target: { nodePath: 'map.time', metaData: { dimension: 'time' } }, appliedData: '2020-01-01' });
            expect(applyDimensionEffect(interaction, makeContext())).toEqual({ type: INTERACTION_UPDATES.CURRENT_TIME, value: '2020-01-01' });
        });
        it('returns a layer params update for a main map layer dimension', () => {
            const interaction = makeInteraction({ targetType: TARGET_TYPES.APPLY_DIMENSION, target: { nodePath: `map.layers[${LAYER_ID}].params.elevation`, metaData: { dimension: 'elevation' } }, appliedData: 100 });
            expect(applyDimensionEffect(interaction, makeContext())).toEqual({ type: INTERACTION_UPDATES.LAYER_PARAMS, layerId: LAYER_ID, params: { elevation: 100 } });
        });
        it('returns null without dimension metadata', () => {
            const interaction = makeInteraction({ targetType: TARGET_TYPES.APPLY_DIMENSION, target: { nodePath: `map.layers[${LAYER_ID}]` } });
            expect(applyDimensionEffect(interaction, makeContext())).toBe(null);
        });
    });

    describe('cleanup', () => {
        it('cleanupEffectsBySenderId removes only the filters of the sender', () => {
            const other = { id: 'other', appliedFromWidget: 'another-sender' };
            const own = { id: 'int-1', appliedFromWidget: SENDER_ID };
            const context = makeContext({
                widgets: [{ id: TABLE_ID, widgetType: 'table', interactionFilters: [other, own] }],
                layers: [{ id: LAYER_ID, layerFilter: { groupFields: [], filters: [own] } }, { id: 'layer-2', layerFilter: { filters: [other] } }]
            });
            const actions = cleanupEffectsBySenderId(SENDER_ID, context);
            expect(actions.length).toBe(2);
            expect(actions).toEqual([
                { type: INTERACTION_UPDATES.LAYER_PROPERTIES, layerId: LAYER_ID, properties: { layerFilter: { groupFields: [], filters: [] } } },
                { type: INTERACTION_UPDATES.WIDGET_PROPERTY, widgetId: TABLE_ID, key: 'interactionFilters', value: [other] }
            ]);
            expect(cleanupEffectsBySenderId(undefined, context)).toEqual([]);
        });
        it('cleanupInteractionsAfterWidgetDeletion removes interactions targeting the widget from senders', () => {
            const kept = makeInteraction({ id: 'kept', target: { nodePath: 'root.widgets[chart-1].charts[c].traces[t]' } });
            const removed = makeInteraction();
            const context = makeContext({ widgets: [makeFilterWidget({ interactions: [kept, removed] })] });
            const actions = cleanupInteractionsAfterWidgetDeletion(TABLE_ID, context);
            expect(actions.length).toBe(1);
            expect(actions[0].widgetId).toBe(SENDER_ID);
            expect(actions[0].value).toEqual([kept]);
            expect(cleanupInteractionsAfterWidgetDeletion('unrelated', context)).toEqual([]);
        });
        it('cleanupInteractionsAfterLayerDeletion removes interactions targeting the main map layer', () => {
            const kept = makeInteraction({ id: 'kept' });
            const removed = makeInteraction({ id: 'removed', target: { nodePath: `map.layers[${LAYER_ID}]` } });
            const context = makeContext({ widgets: [makeFilterWidget({ interactions: [kept, removed] }), { id: 'chart-1', widgetType: 'chart', interactions: [removed] }] });
            const actions = cleanupInteractionsAfterLayerDeletion(LAYER_ID, context);
            expect(actions.length).toBe(1);
            expect(actions[0].widgetId).toBe(SENDER_ID);
            expect(actions[0].value).toEqual([kept]);
        });
        it('cleanupInteractionsAfterLayerDeletion keeps the table zoom-to plugged without layer filters', () => {
            const removed = makeInteraction({ id: 'removed', target: { nodePath: `map.layers[${LAYER_ID}]` } });
            const zoomTo = makeInteraction({ id: 'zoom', targetType: TARGET_TYPES.APPLY_ZOOM_TO, target: { nodePath: 'map.applyZoomTo' } });
            const context = makeContext({ widgets: [{ id: TABLE_ID, widgetType: 'table', interactions: [removed, zoomTo] }] });
            const [update] = cleanupInteractionsAfterLayerDeletion(LAYER_ID, context);
            expect(update.value).toEqual([zoomTo]);
        });
        it('cleanupInteractionsAfterLayerDeletion cleans the table sender interactions', () => {
            const kept = makeInteraction({ id: 'kept' });
            const removed = makeInteraction({ id: 'removed', target: { nodePath: `map.layers[${LAYER_ID}]` } });
            const context = makeContext({ widgets: [{ id: TABLE_ID, widgetType: 'table', interactions: [kept, removed] }] });
            const actions = cleanupInteractionsAfterLayerDeletion(LAYER_ID, context);
            expect(actions.length).toBe(1);
            expect(actions[0].widgetId).toBe(TABLE_ID);
            expect(actions[0].value).toEqual([kept]);
        });
    });

    describe('map widget sender', () => {
        const MAP_WIDGET_ID = 'map-w';
        const bbox = { bounds: { minx: '-10', miny: '-20', maxx: '30', maxy: '40' }, crs: 'EPSG:4326' };
        const makeMapWidget = (map = {}) => ({ id: MAP_WIDGET_ID, widgetType: 'map', maps: [{ mapId: 'm1', bbox, ...map }] });
        const makeSpatialInteraction = (targetNodePath) => ({
            id: 'spatial-1',
            plugged: true,
            targetType: TARGET_TYPES.APPLY_SPATIAL_FILTER,
            source: { nodePath: `widgets[${MAP_WIDGET_ID}].maps[m1]` },
            target: { nodePath: targetNodePath }
        });
        const table = { id: TABLE_ID, widgetType: 'table', geomProp: 'the_geom' };
        const chart = { id: 'chart-1', widgetType: 'chart', charts: [{ chartId: 'c1', traces: [{ id: 't1', geomProp: 'geom' }] }] };

        it('reads the target geometry attribute from the widget or the chart trace', () => {
            expect(getTargetGeometryAttribute(makeSpatialInteraction(`widgets[${TABLE_ID}]`), [table])).toBe('the_geom');
            expect(getTargetGeometryAttribute(makeSpatialInteraction('widgets[chart-1].charts[c1].traces[t1]'), [chart])).toBe('geom');
            expect(getTargetGeometryAttribute(makeSpatialInteraction('widgets[other]'), [table])).toNotExist();
        });
        it('builds the CQL spatial filter of the map extent on the target geometry', () => {
            const data = buildMapWidgetAppliedData(makeMapWidget(), 'm1', makeSpatialInteraction(`widgets[${TABLE_ID}]`), { widgets: [table] });
            expect(data.format).toBe('cql');
            expect(data.body).toContain('INTERSECTS("the_geom",SRID=4326;');
            expect(data.body).toContain('-10 -20');
            expect(data.body).toContain('30 40');
        });
        it('returns no filter without extent or target geometry', () => {
            const interaction = makeSpatialInteraction(`widgets[${TABLE_ID}]`);
            expect(buildMapWidgetAppliedData(makeMapWidget({ bbox: undefined }), 'm1', interaction, { widgets: [table] })).toBe(null);
            expect(buildMapWidgetAppliedData(makeMapWidget(), 'other-map', interaction, { widgets: [table] })).toBe(null);
            expect(buildMapWidgetAppliedData(makeMapWidget(), 'm1', interaction, { widgets: [{ ...table, geomProp: undefined }] })).toBe(null);
        });
        it('sends center and zoom for view sync and moves the target map', () => {
            const center = { x: 10, y: 20, crs: 'EPSG:4326' };
            const interaction = { ...makeSpatialInteraction('widgets[map-r].maps[r1].applyViewSync'), targetType: TARGET_TYPES.APPLY_VIEW_SYNC };
            const appliedData = buildMapWidgetAppliedData(makeMapWidget({ center, zoom: 5 }), 'm1', interaction, { widgets: [] });
            expect(appliedData).toEqual({ center, zoom: 5 });
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_VIEW_SYNC]).toBe(applyViewSyncEffect);
            const receiver = { id: 'map-r', widgetType: 'map', maps: [{ mapId: 'r1' }] };
            const update = applyViewSyncEffect({ ...interaction, appliedData }, { widgets: [receiver] });
            expect(update).toEqual({ type: INTERACTION_UPDATES.WIDGET_PROPERTY, widgetId: 'map-r', key: 'maps', value: { mapId: 'r1', center, zoom: 5 }, mode: 'merge' });
            expect(applyViewSyncEffect({ ...interaction, appliedData: null }, { widgets: [receiver] })).toBe(null);
            expect(applyViewSyncEffect({ ...interaction, appliedData }, { widgets: [] })).toBe(null);
        });
        it('writes the map effects as transient', () => {
            expect(isTransientEffectSender(makeMapWidget())).toBe(true);
            expect(isTransientEffectSender(table)).toBe(false);
            const interaction = { ...makeSpatialInteraction(`widgets[${TABLE_ID}]`), appliedData: { format: 'cql', version: '1.0.0', body: 'INCLUDE' }, "transient": true };
            const update = applyFilterEffect(interaction, { widgets: [table] });
            expect(update.value[0].transient).toBe(true);
            expect(update.value[0].appliedFromWidget).toBe(MAP_WIDGET_ID);
        });
    });

    describe('stripTransientEffects', () => {
        const persisted = { id: 'persisted', appliedFromWidget: 'table-1' };
        const transientFilter = { id: 'viewport', appliedFromWidget: 'map-w', "transient": true };
        it('removes transient filters from widgets and chart traces', () => {
            const widgets = [
                { id: 'counter-1', interactionFilters: [persisted, transientFilter] },
                { id: 'chart-1', charts: [{ chartId: 'c1', traces: [{ id: 't1', interactionFilters: [transientFilter] }, { id: 't2', interactionFilters: [persisted] }] }] }
            ];
            const [counter, chart] = stripTransientEffects(widgets);
            expect(counter.interactionFilters).toEqual([persisted]);
            expect(chart.charts[0].traces[0].interactionFilters).toEqual([]);
            expect(chart.charts[0].traces[1]).toBe(widgets[1].charts[0].traces[1]);
        });
        it('removes the mirrored view of the main map entry', () => {
            const mainMap = { id: 'map', widgetType: 'map', mainMap: true, maps: [{ mapId: 'main', bbox: {}, center: {}, zoom: 3 }], interactions: [{ id: 'i' }] };
            const [stripped] = stripTransientEffects([mainMap]);
            expect(stripped.maps).toEqual([{ mapId: 'main' }]);
            expect(stripped.interactions).toBe(mainMap.interactions);
            expect(stripTransientEffects([stripped])[0]).toBe(stripped);
        });
        it('returns the same widgets when there is nothing to remove', () => {
            const widgets = [{ id: 'counter-1', interactionFilters: [persisted] }, { id: 'text-1' }];
            expect(stripTransientEffects(widgets)).toBe(widgets);
            expect(stripTransientEffects(undefined)).toBe(undefined);
        });
    });

    describe('event effects', () => {
        const mapWidget = { id: 'map-w', widgetType: 'map', maps: [{ mapId: 'm1', layers: [{ id: 'l1', visibility: true, title: 'L1' }, { id: 'l2' }] }] };
        const makeEventInteraction = (targetType, nodePath, appliedData) => ({ id: 'e1', plugged: true, targetType, target: { nodePath }, appliedData });

        it('registers the event effects, applied only with event data', () => {
            expect(EVENT_TARGET_TYPES).toEqual([TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, TARGET_TYPES.APPLY_LEGEND]);
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_ZOOM_TO_FEATURE]).toBe(applyZoomToFeatureEffect);
            expect(TARGET_EFFECTS[TARGET_TYPES.APPLY_LEGEND]).toBe(applyLegendEffect);
        });
        it('zooms a map widget map to the feature with a zoom request', () => {
            const interaction = makeEventInteraction(TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, 'widgets[map-w].maps[m1].applyZoomToFeature', { feature: { bbox: [1, 2, 3, 4] }, maxZoom: 12 });
            expect(applyZoomToFeatureEffect(interaction, { widgets: [mapWidget] })).toEqual({
                type: INTERACTION_UPDATES.WIDGET_PROPERTY, widgetId: 'map-w', key: 'maps', mode: 'merge',
                value: { mapId: 'm1', zoomToRequest: { extent: [1, 2, 3, 4], crs: 'EPSG:4326', maxZoom: 12 } }
            });
        });
        it('zooms the main map to the feature geometry extent, with the main map padding', () => {
            const padding = { top: 0, right: 100, bottom: 0, left: 0 };
            const interaction = makeEventInteraction(TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, 'map.applyZoomToFeature', { feature: { geometry: { type: 'Point', coordinates: [10, 20] } } });
            expect(applyZoomToFeatureEffect(interaction, { widgets: [], mainMapPadding: padding })).toEqual({
                type: INTERACTION_UPDATES.ZOOM_TO_EXTENT, extent: [10, 20, 10, 20], crs: 'EPSG:4326', padding
            });
        });
        it('does not zoom without feature extent or target map', () => {
            expect(applyZoomToFeatureEffect(makeEventInteraction(TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, 'map.applyZoomToFeature', {}), {})).toBe(null);
            expect(applyZoomToFeatureEffect(makeEventInteraction(TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, 'widgets[other].maps[m1].applyZoomToFeature', { feature: { bbox: [1, 2, 3, 4] } }), { widgets: [mapWidget] })).toBe(null);
        });
        it('mergeLegendLayerChanges applies only the legend fields to the changed layers', () => {
            const layerFilter = { filters: [] };
            const merged = mergeLegendLayerChanges(mapWidget.maps[0].layers, [{ id: 'l1', visibility: false, opacity: 0.5, expanded: true, layerFilter, title: 'ignored' }]);
            expect(merged[0]).toEqual({ id: 'l1', visibility: false, opacity: 0.5, expanded: true, layerFilter, title: 'L1' });
            expect(merged[1]).toBe(mapWidget.maps[0].layers[1]);
        });
        it('writes the legend changes into the controlled map layers', () => {
            const interaction = makeEventInteraction(TARGET_TYPES.APPLY_LEGEND, 'widgets[map-w].maps[m1].applyLegend', { layers: [{ id: 'l1', visibility: false }] });
            const update = applyLegendEffect(interaction, { widgets: [mapWidget] });
            expect(update.widgetId).toBe('map-w');
            expect(update.mode).toBe('merge');
            expect(update.value.mapId).toBe('m1');
            expect(update.value.layers[0].visibility).toBe(false);
            expect(applyLegendEffect({ ...interaction, appliedData: {} }, { widgets: [mapWidget] })).toBe(null);
            expect(applyLegendEffect(interaction, { widgets: [] })).toBe(null);
        });
    });

    describe('main map timeline time', () => {
        const chart = { id: 'chart-1', widgetType: 'chart', charts: [{ chartId: 'c1', xAxisOpts: [{ id: 0, type: 'date', showCurrentTime: true }], traces: [{ id: 't1' }] }] };
        const timeInteraction = {
            id: 'time-1',
            plugged: true,
            targetType: TARGET_TYPES.APPLY_DIMENSION,
            source: { nodePath: 'widgets[map].maps[main]' },
            target: { nodePath: 'widgets[chart-1].charts[c1].traces[t1].xAxisOpts[0].appliedCurrentTime', metaData: { dimension: 'time' } }
        };
        it('sends the timeline range of the main map entry', () => {
            const mainMap = { id: 'map', widgetType: 'map', mainMap: true, maps: [{ mapId: 'main', currentTime: '2020-01-01', offsetTime: '2020-02-01' }] };
            expect(buildMapWidgetAppliedData(mainMap, 'main', timeInteraction, {})).toEqual({ currentTime: '2020-01-01', offsetTime: '2020-02-01' });
            expect(buildMapWidgetAppliedData({ ...mainMap, maps: [{ mapId: 'main' }] }, 'main', timeInteraction, {})).toBe(null);
        });
        it('writes current and offset time on the chart axis for a range', () => {
            const updates = applyDimensionEffect({ ...timeInteraction, appliedData: { currentTime: '2020-01-01', offsetTime: '2020-02-01' } }, { widgets: [chart] });
            expect(updates.map(update => [update.key, update.value])).toEqual([
                ['charts[0].xAxisOpts[0].appliedCurrentTime', '2020-01-01'],
                ['charts[0].xAxisOpts[0].appliedOffsetTime', '2020-02-01']
            ]);
        });
        it('writes a single value for the other senders', () => {
            const update = applyDimensionEffect({ ...timeInteraction, appliedData: '2020-01-01' }, { widgets: [chart] });
            expect([update.key, update.value]).toEqual(['charts[0].xAxisOpts[0].appliedCurrentTime', '2020-01-01']);
        });
    });

    describe('prefixWidgetInteractionIds', () => {
        it('prefixes the widget ids of interactions and effect senders', () => {
            const widget = {
                id: 'table-1',
                interactions: [{ id: 'i1', source: { nodePath: 'widgets[table-1]' }, target: { nodePath: 'widgets[map-w].maps[m1].layers[l1]' } }],
                interactionFilters: [{ id: 'f1', appliedFromWidget: 'filter-w' }, { id: 'own' }],
                charts: [{ chartId: 'c1', traces: [{ id: 't1', interactionFilters: [{ id: 'f2', appliedFromWidget: 'table-2' }] }] }],
                maps: [{ mapId: 'm1', layers: [{ id: 'l1', layerFilter: { filters: [{ id: 'f3', appliedFromWidget: 'table-1' }] } }, { id: 'l2' }] }]
            };
            const prefixed = prefixWidgetInteractionIds(widget, 'layout-1');
            expect(prefixed.interactions[0].id).toBe('i1');
            expect(prefixed.interactions[0].source.nodePath).toBe('widgets[layout-1-table-1]');
            expect(prefixed.interactions[0].target.nodePath).toBe('widgets[layout-1-map-w].maps[m1].layers[l1]');
            expect(prefixed.interactionFilters.map(f => f.appliedFromWidget)).toEqual(['layout-1-filter-w', undefined]);
            expect(prefixed.charts[0].traces[0].interactionFilters[0].appliedFromWidget).toBe('layout-1-table-2');
            expect(prefixed.maps[0].layers[0].layerFilter.filters[0].appliedFromWidget).toBe('layout-1-table-1');
            expect(prefixed.maps[0].layers[1]).toBe(widget.maps[0].layers[1]);
        });
        it('leaves widgets without interactions or effects as they are', () => {
            expect(prefixWidgetInteractionIds({ id: 'text-1', widgetType: 'text' }, 'layout-1')).toEqual({ id: 'text-1', widgetType: 'text' });
        });
    });
});
