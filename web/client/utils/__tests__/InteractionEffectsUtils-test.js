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
        it('returns the same widgets when there is nothing to remove', () => {
            const widgets = [{ id: 'counter-1', interactionFilters: [persisted] }, { id: 'text-1' }];
            expect(stripTransientEffects(widgets)).toBe(widgets);
            expect(stripTransientEffects(undefined)).toBe(undefined);
        });
    });
});
