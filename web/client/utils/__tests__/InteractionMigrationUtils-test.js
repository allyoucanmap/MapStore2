/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import omit from 'lodash/omit';
import {
    getLegacyConnectionSource,
    migrateLegacyConnections,
    LEGACY_CONNECTION_CONVERTERS,
    LEGACY_CONNECTION_EFFECT_WRITERS,
    MAIN_MAP_SENDER_ID,
    convertTableLegacyConnection,
    convertMapLegacyConnection,
    buildMainMapDefaultInteractions
} from '../InteractionMigrationUtils';

const TABLE_ID = 'table-1';
const CHART_ID = 'chart-1';

const makeTable = (overrides = {}) => ({ id: TABLE_ID, widgetType: 'table', title: 'Table', ...overrides });
const makeConnectedChart = (overrides = {}) => ({
    id: CHART_ID,
    widgetType: 'chart',
    title: 'Chart',
    mapSync: true,
    dependenciesMap: {
        filter: `widgets[${TABLE_ID}].filter`,
        quickFilters: `widgets[${TABLE_ID}].quickFilters`
    },
    ...overrides
});

const testConverters = {
    table: (receiver, sender) => ({
        interactions: [{
            plugged: true,
            targetType: 'applyFilter',
            source: { nodePath: `widgets[${sender.id}]` },
            target: { nodePath: `widgets[${receiver.id}]` }
        }],
        receiver: omit(receiver, ['mapSync', 'dependenciesMap'])
    })
};

describe('InteractionMigrationUtils', () => {
    describe('getLegacyConnectionSource', () => {
        it('returns null when not connected', () => {
            expect(getLegacyConnectionSource(makeConnectedChart({ mapSync: false }))).toBe(null);
            expect(getLegacyConnectionSource({ id: 'w' })).toBe(null);
            expect(getLegacyConnectionSource()).toBe(null);
        });
        it('returns the main map without dependenciesMap', () => {
            expect(getLegacyConnectionSource({ mapSync: true })).toEqual({ senderId: MAIN_MAP_SENDER_ID, mapId: 'main' });
            expect(getLegacyConnectionSource({ mapSync: true, dependenciesMap: {} })).toEqual({ senderId: MAIN_MAP_SENDER_ID, mapId: 'main' });
        });
        it('returns the sender widget', () => {
            expect(getLegacyConnectionSource(makeConnectedChart())).toEqual({ senderId: TABLE_ID });
        });
        it('returns the sender map widget and map, also with quoted ids', () => {
            const widget = { mapSync: true, dependenciesMap: { viewport: 'widgets["map-w"].maps["map-1"].viewport', zoom: 'widgets["map-w"].maps["map-1"].zoom' } };
            expect(getLegacyConnectionSource(widget)).toEqual({ senderId: 'map-w', mapId: 'map-1' });
        });
        it('returns the main map when no path refers to a widget', () => {
            expect(getLegacyConnectionSource({ mapSync: true, dependenciesMap: { viewport: 'viewport', center: 'center' } })).toEqual({ senderId: MAIN_MAP_SENDER_ID, mapId: 'main' });
        });
    });

    describe('migrateLegacyConnections', () => {
        it('registers the table and map converters and effect writers', () => {
            expect(Object.keys(LEGACY_CONNECTION_CONVERTERS)).toEqual(['table', 'map']);
            expect(Object.keys(LEGACY_CONNECTION_EFFECT_WRITERS)).toEqual(['table', 'map']);
        });
        it('returns the same configuration without converters or widgets', () => {
            const config = { widgets: [makeTable(), makeConnectedChart()] };
            expect(migrateLegacyConnections(config, {})).toBe(config);
            expect(migrateLegacyConnections(undefined, testConverters)).toBe(undefined);
            const noWidgets = { layouts: {} };
            expect(migrateLegacyConnections(noWidgets, testConverters)).toBe(noWidgets);
        });
        it('converts a legacy connection into a sender interaction', () => {
            const migrated = migrateLegacyConnections({ widgets: [makeTable(), makeConnectedChart()] }, testConverters);
            const [table, chart] = migrated.widgets;
            expect(table.interactions.length).toBe(1);
            expect(table.interactions[0].id).toBe(`legacy:${CHART_ID}:applyFilter:widgets[${CHART_ID}]`);
            expect(chart.mapSync).toNotExist();
            expect(chart.dependenciesMap).toNotExist();
        });
        it('is idempotent', () => {
            const once = migrateLegacyConnections({ widgets: [makeTable(), makeConnectedChart()] }, testConverters);
            expect(migrateLegacyConnections(once, testConverters)).toBe(once);
            const senderAlreadyMigrated = { widgets: [once.widgets[0], makeConnectedChart()] };
            expect(migrateLegacyConnections(senderAlreadyMigrated, testConverters).widgets[0].interactions.length).toBe(1);
        });
        it('preserves existing interactions and properties', () => {
            const existing = { id: 'int-1', targetType: 'applyFilter' };
            const config = { layouts: { md: [] }, widgets: [makeTable({ interactions: [existing] }), makeConnectedChart(), { id: 'other', widgetType: 'counter' }] };
            const migrated = migrateLegacyConnections(config, testConverters);
            expect(migrated.layouts).toBe(config.layouts);
            expect(migrated.widgets[0].title).toBe('Table');
            expect(migrated.widgets[0].interactions[0]).toBe(existing);
            expect(migrated.widgets[0].interactions.length).toBe(2);
            expect(migrated.widgets[1].title).toBe('Chart');
            expect(migrated.widgets[2]).toBe(config.widgets[2]);
        });
        it('adds the receiver interactions to the receiver, without touching a sender that gets none', () => {
            const receiverConverters = {
                table: (receiver) => ({
                    interactions: [],
                    receiverInteractions: [{ plugged: true, targetType: 'applyLegend', source: { nodePath: `widgets[${receiver.id}]` }, target: { nodePath: `widgets[${TABLE_ID}].maps[m1].applyLegend` } }],
                    receiver: omit(receiver, ['mapSync', 'dependenciesMap'])
                })
            };
            const table = makeTable();
            const migrated = migrateLegacyConnections({ widgets: [table, makeConnectedChart()] }, receiverConverters, {});
            expect(migrated.widgets[0]).toBe(table);
            expect(migrated.widgets[1].interactions.map(i => i.id)).toEqual([`legacy:${CHART_ID}:applyLegend:widgets[${TABLE_ID}].maps[m1].applyLegend`]);
            expect(migrateLegacyConnections(migrated, receiverConverters, {})).toBe(migrated);
        });
        it('keeps connections without a converter, to the main map or rejected by the converter', () => {
            const mainMap = { id: 'counter-1', widgetType: 'counter', mapSync: true };
            const config = { widgets: [makeTable(), mainMap] };
            expect(migrateLegacyConnections(config, testConverters)).toBe(config);
            const rejected = { widgets: [makeTable(), makeConnectedChart()] };
            expect(migrateLegacyConnections(rejected, { table: () => null })).toBe(rejected);
            expect(migrateLegacyConnections(rejected, { chart: testConverters.table })).toBe(rejected);
        });
    });

    describe('table legacy connections', () => {
        const LAYER = { id: 'states', name: 'topp:states', url: '/geoserver/wms' };
        const OTHER_LAYER = { id: 'roads', name: 'topp:roads', url: '/geoserver/wms' };
        const options = { propertyName: ['STATE_NAME'] };
        const quickFilters = { STATE_NAME: { rawValue: 'Arizona', value: 'Arizona', operator: 'ilike', type: 'string', attribute: 'STATE_NAME' } };
        const legacyDependencies = {
            mapSync: true,
            dependenciesMap: {
                filter: `widgets[${TABLE_ID}].filter`,
                quickFilters: `widgets[${TABLE_ID}].quickFilters`,
                layer: `widgets[${TABLE_ID}].layer`,
                options: `widgets[${TABLE_ID}].options`
            }
        };
        const table = makeTable({ layer: LAYER, options });
        const counter = { id: 'counter-1', widgetType: 'counter', layer: LAYER, ...legacyDependencies };

        it('converts a counter connection into a filter interaction', () => {
            const { interactions, receiver } = convertTableLegacyConnection(counter, table);
            expect(interactions.length).toBe(1);
            expect(interactions[0].targetType).toBe('applyFilter');
            expect(interactions[0].plugged).toBe(true);
            expect(interactions[0].source.nodePath).toBe(`widgets[${TABLE_ID}]`);
            expect(interactions[0].target.nodePath).toBe('widgets[counter-1]');
            expect(interactions[0].target.metaData.constraints.layer.name).toBe(LAYER.name);
            expect(receiver.mapSync).toNotExist();
            expect(receiver.dependenciesMap).toNotExist();
            expect(receiver.layer).toBe(LAYER);
        });
        it('converts only the chart traces on the table layer', () => {
            const chart = {
                id: CHART_ID,
                widgetType: 'chart',
                charts: [{ chartId: 'c1', traces: [{ id: 't1', layer: LAYER }, { id: 't2', layer: OTHER_LAYER }] }],
                ...legacyDependencies
            };
            const { interactions } = convertTableLegacyConnection(chart, table);
            expect(interactions.map(i => i.target.nodePath)).toEqual([`widgets[${CHART_ID}].charts[c1].traces[t1]`]);
        });
        it('converts a map widget connection into layer filters and auto zoom for each map', () => {
            const mapWidget = {
                id: 'map-w',
                widgetType: 'map',
                maps: [
                    { mapId: 'm1', layers: [{ id: 'osm', name: 'osm' }, { id: 'l1', name: LAYER.name }] },
                    { mapId: 'm2', layers: [{ id: 'l2', name: OTHER_LAYER.name }] }
                ],
                ...legacyDependencies
            };
            const { interactions } = convertTableLegacyConnection(mapWidget, table);
            expect(interactions.map(i => [i.targetType, i.target.nodePath])).toEqual([
                ['applyFilter', 'widgets[map-w].maps[m1].layers[l1]'],
                ['applyZoomTo', 'widgets[map-w].maps[m1].applyZoomTo'],
                ['applyZoomToFeature', 'widgets[map-w].maps[m1].applyZoomToFeature'],
                ['applyZoomTo', 'widgets[map-w].maps[m2].applyZoomTo'],
                ['applyZoomToFeature', 'widgets[map-w].maps[m2].applyZoomToFeature']
            ]);
            expect(interactions[1].configuration.autoZoom).toBe(true);
            expect(interactions[0].configuration.autoZoom).toBe(false);
            expect(interactions.every(i => i.plugged)).toBe(true);
        });
        it('keeps the connection legacy when the table is connected to a map or nothing can be converted', () => {
            expect(convertTableLegacyConnection(counter, { ...table, mapSync: true })).toBe(null);
            expect(convertTableLegacyConnection({ ...counter, widgetType: 'text' }, table)).toBe(null);
            expect(convertTableLegacyConnection({ id: CHART_ID, widgetType: 'chart', charts: [] }, table)).toBe(null);
        });
        it('migrates the connection and writes the current table filter into the receiver', () => {
            const existing = { id: 'other-filter', appliedFromWidget: 'filter-w' };
            const config = { widgets: [{ ...table, quickFilters }, { ...counter, interactionFilters: [existing] }] };
            const migrated = migrateLegacyConnections(config);
            const [migratedTable, migratedCounter] = migrated.widgets;
            const interactionId = migratedTable.interactions[0].id;
            expect(interactionId).toBe('legacy:counter-1:applyFilter:widgets[counter-1]');
            expect(migratedCounter.mapSync).toNotExist();
            expect(migratedCounter.interactionFilters.length).toBe(2);
            expect(migratedCounter.interactionFilters[0]).toEqual(existing);
            expect(migratedCounter.interactionFilters[1].id).toBe(interactionId);
            expect(migratedCounter.interactionFilters[1].appliedFromWidget).toBe(TABLE_ID);
            expect(migratedCounter.interactionFilters[1].filters[0].body).toContain('STATE_NAME');
            expect(migrateLegacyConnections(migrated)).toBe(migrated);
        });
        it('converts widgets chained through a map widget into direct table interactions', () => {
            const mapWidget = {
                id: 'map-w',
                widgetType: 'map',
                maps: [{ mapId: 'm1', layers: [{ id: 'l1', name: LAYER.name }] }],
                ...legacyDependencies
            };
            const chainedChart = {
                id: CHART_ID,
                widgetType: 'chart',
                charts: [{ chartId: 'c1', traces: [{ id: 't1', layer: LAYER }] }],
                mapSync: true,
                dependenciesMap: {
                    viewport: 'widgets[map-w].maps[m1].viewport',
                    filter: 'widgets[map-w].filter',
                    quickFilters: 'widgets[map-w].quickFilters'
                }
            };
            const legend = { id: 'legend-1', widgetType: 'legend', mapSync: true, dependenciesMap: { layers: 'widgets[map-w].maps[m1].layers' } };
            const migrated = migrateLegacyConnections({ widgets: [{ ...table, quickFilters }, mapWidget, chainedChart, legend] });
            const [migratedTable, migratedMap, migratedChart, migratedLegend] = migrated.widgets;
            const chartInteraction = migratedTable.interactions.find(i => i.target.nodePath === `widgets[${CHART_ID}].charts[c1].traces[t1]`);
            expect(chartInteraction).toExist();
            expect(migratedTable.interactions.length).toBe(4);
            expect(migratedMap.dependenciesMap).toNotExist();
            expect(migratedMap.maps[0].layers[0].layerFilter.filters.length).toBe(1);
            expect(migratedChart.dependenciesMap).toBe(chainedChart.dependenciesMap);
            expect(migratedChart.charts[0].traces[0].interactionFilters[0].id).toBe(chartInteraction.id);
            expect(migratedLegend).toBe(legend);
            expect(migrateLegacyConnections(migrated)).toBe(migrated);
        });
        it('writes no filter when the table has none', () => {
            const migrated = migrateLegacyConnections({ widgets: [table, counter] });
            expect(migrated.widgets[1].interactionFilters).toNotExist();
            expect(migrated.widgets[0].interactions.length).toBe(1);
        });
    });

    describe('map widget legacy connections', () => {
        const bbox = { bounds: { minx: -10, miny: -20, maxx: 30, maxy: 40 }, crs: 'EPSG:4326' };
        const mapWidget = { id: 'map-w', widgetType: 'map', selectedMapId: 'm1', maps: [{ mapId: 'm1', bbox, layers: [] }] };
        const viewportDependencies = {
            mapSync: true,
            dependenciesMap: {
                viewport: 'widgets[map-w].maps[m1].viewport',
                layers: 'widgets[map-w].maps[m1].layers'
            }
        };
        const source = { senderId: 'map-w', mapId: 'm1' };
        const counter = { id: 'counter-1', widgetType: 'counter', geomProp: 'the_geom', ...viewportDependencies };

        it('converts a viewport connection into a spatial filter of the map', () => {
            const { interactions, receiver } = convertMapLegacyConnection(counter, mapWidget, source);
            expect(interactions.length).toBe(1);
            expect(interactions[0].targetType).toBe('applySpatialFilter');
            expect(interactions[0].source.nodePath).toBe('widgets[map-w].maps[m1]');
            expect(interactions[0].target.nodePath).toBe('widgets[counter-1]');
            expect(interactions[0].target.metaData.constraints).toEqual({});
            expect(receiver.mapSync).toNotExist();
            expect(receiver.dependenciesMap).toNotExist();
        });
        it('converts only the chart traces with a geometry attribute', () => {
            const chart = {
                id: CHART_ID,
                widgetType: 'chart',
                charts: [{ chartId: 'c1', traces: [{ id: 't1', geomProp: 'the_geom' }, { id: 't2' }] }],
                ...viewportDependencies
            };
            const { interactions } = convertMapLegacyConnection(chart, mapWidget, source);
            expect(interactions.map(i => i.target.nodePath)).toEqual([`widgets[${CHART_ID}].charts[c1].traces[t1]`]);
        });
        it('keeps connections without geometry, viewport or view legacy', () => {
            expect(convertMapLegacyConnection({ ...counter, geomProp: undefined }, mapWidget, source)).toBe(null);
            expect(convertMapLegacyConnection({ ...counter, widgetType: 'map' }, mapWidget, source)).toBe(null);
            expect(convertMapLegacyConnection({ ...counter, dependenciesMap: { layers: 'widgets[map-w].maps[m1].layers' } }, mapWidget, source)).toBe(null);
        });
        it('converts a map receiver following center and zoom into view sync on each of its maps', () => {
            const mapReceiver = {
                id: 'map-r',
                widgetType: 'map',
                maps: [{ mapId: 'r1' }, { mapId: 'r2' }],
                mapSync: true,
                dependenciesMap: { center: 'widgets[map-w].maps[m1].center', zoom: 'widgets[map-w].maps[m1].zoom' }
            };
            const { interactions, receiver } = convertMapLegacyConnection(mapReceiver, mapWidget, source);
            expect(interactions.map(i => [i.targetType, i.target.nodePath])).toEqual([
                ['applyViewSync', 'widgets[map-r].maps[r1].applyViewSync'],
                ['applyViewSync', 'widgets[map-r].maps[r2].applyViewSync']
            ]);
            expect(interactions[0].source.nodePath).toBe('widgets[map-w].maps[m1]');
            expect(receiver.dependenciesMap).toNotExist();
        });
        it('converts a legend connection into the legend own interaction controlling the map', () => {
            const legend = { id: 'legend-1', widgetType: 'legend', mapSync: true, dependenciesMap: { layers: 'widgets[map-w].maps[m1].layers', zoom: 'widgets[map-w].maps[m1].zoom' } };
            const migrated = migrateLegacyConnections({ widgets: [mapWidget, legend] });
            const [migratedMap, migratedLegend] = migrated.widgets;
            expect(migratedLegend.mapSync).toNotExist();
            expect(migratedLegend.dependenciesMap).toNotExist();
            expect(migratedLegend.interactions.map(i => [i.targetType, i.source.nodePath, i.target.nodePath, i.plugged])).toEqual([
                ['applyLegend', 'widgets[legend-1]', 'widgets[map-w].maps[m1].applyLegend', true]
            ]);
            expect(migratedLegend.interactions[0].id).toBe('legacy:legend-1:applyLegend:widgets[map-w].maps[m1].applyLegend');
            expect(migratedMap).toBe(mapWidget);
            expect(migrateLegacyConnections(migrated)).toBe(migrated);
        });
        it('migrates the connection and writes the viewport filter as transient', () => {
            const migrated = migrateLegacyConnections({ widgets: [mapWidget, counter] });
            const [migratedMap, migratedCounter] = migrated.widgets;
            expect(migratedMap.interactions.length).toBe(1);
            expect(migratedCounter.mapSync).toNotExist();
            const [filter] = migratedCounter.interactionFilters;
            expect(filter.id).toBe(migratedMap.interactions[0].id);
            expect(filter.transient).toBe(true);
            expect(filter.filters[0].body).toContain('INTERSECTS("the_geom"');
            expect(migrateLegacyConnections(migrated)).toBe(migrated);
        });
    });

    describe('main map legacy connections', () => {
        const counter = { id: 'counter-1', widgetType: 'counter', geomProp: 'the_geom', mapSync: true, dependenciesMap: { viewport: 'viewport', center: 'center', zoom: 'zoom' } };

        it('converts them into the main map entry, created when missing, in the map viewer', () => {
            const migrated = migrateLegacyConnections({ widgets: [counter] }, undefined, undefined, { mainMap: true });
            const [migratedCounter, mainMap] = migrated.widgets;
            expect(migratedCounter.mapSync).toNotExist();
            expect(mainMap.id).toBe(MAIN_MAP_SENDER_ID);
            expect(mainMap.mainMap).toBe(true);
            expect(mainMap.interactions.map(i => [i.targetType, i.source.nodePath, i.target.nodePath])).toEqual([
                ['applySpatialFilter', 'widgets[map].maps[main]', 'widgets[counter-1]']
            ]);
            expect(migrateLegacyConnections(migrated, undefined, undefined, { mainMap: true })).toBe(migrated);
        });
        it('treats a connection with only mapSync as the viewport filter and reuses the existing main map entry', () => {
            const existing = { id: MAIN_MAP_SENDER_ID, widgetType: 'map', mainMap: true, maps: [{ mapId: 'main' }], interactions: [] };
            const migrated = migrateLegacyConnections({ widgets: [existing, { ...counter, dependenciesMap: undefined }] }, undefined, undefined, { mainMap: true });
            expect(migrated.widgets.length).toBe(2);
            expect(migrated.widgets[0].interactions.length).toBe(1);
        });
        it('keeps them legacy without a main map and adds no entry when nothing is converted', () => {
            const config = { widgets: [counter] };
            expect(migrateLegacyConnections(config)).toBe(config);
            const noGeometry = { widgets: [{ ...counter, geomProp: undefined }] };
            expect(migrateLegacyConnections(noGeometry, undefined, undefined, { mainMap: true })).toBe(noGeometry);
        });
    });

    describe('main map default interactions', () => {
        const chart = {
            id: CHART_ID,
            widgetType: 'chart',
            charts: [{
                chartId: 'c1',
                xAxisOpts: [{ id: 0, type: 'date', showCurrentTime: true }],
                yAxisOpts: [{ id: 0 }],
                traces: [{ id: 't1', geomProp: 'the_geom' }, { id: 't2' }, { id: 't3', type: 'pie' }]
            }]
        };
        it('builds only the viewport filter for a new widget, the timeline time is connected on purpose', () => {
            const interactions = buildMainMapDefaultInteractions(chart);
            expect(interactions.map(i => [i.targetType, i.source.nodePath, i.target.nodePath])).toEqual([
                ['applySpatialFilter', 'widgets[map].maps[main]', `widgets[${CHART_ID}].charts[c1].traces[t1]`]
            ]);
            expect(interactions.every(i => i.plugged && !i.id)).toBe(true);
        });
        it('builds nothing for widgets without geometry or date axes, or for maps', () => {
            expect(buildMainMapDefaultInteractions({ id: 'counter-1', widgetType: 'counter' })).toEqual([]);
            expect(buildMainMapDefaultInteractions({ id: 'map-w', widgetType: 'map', maps: [{ mapId: 'm1' }] })).toEqual([]);
            expect(buildMainMapDefaultInteractions({ id: 'text-1', widgetType: 'text' })).toEqual([]);
        });
        it('converts the timeline time of a legacy main map connection once per date axis showing it, not of a map widget one', () => {
            const legacyChart = { ...chart, mapSync: true, dependenciesMap: { viewport: 'viewport', 'dimension.currentTime': 'dimension.currentTime' } };
            const migrated = migrateLegacyConnections({ widgets: [legacyChart] }, undefined, undefined, { mainMap: true });
            const mainMap = migrated.widgets.find(w => w.id === MAIN_MAP_SENDER_ID);
            expect(mainMap.interactions.map(i => [i.targetType, i.target.nodePath])).toEqual([
                ['applySpatialFilter', `widgets[${CHART_ID}].charts[c1].traces[t1]`],
                ['applyDimension', `widgets[${CHART_ID}].charts[c1].traces[t1].xAxisOpts[0].appliedCurrentTime`]
            ]);
            expect(mainMap.interactions[1].target.metaData.dimension).toBe('time');
            const mapWidget = { id: 'map-w', widgetType: 'map', maps: [{ mapId: 'm1', layers: [] }] };
            const { interactions } = convertMapLegacyConnection({ ...legacyChart, dependenciesMap: { viewport: 'widgets[map-w].maps[m1].viewport', 'dimension.currentTime': 'dimension.currentTime' } }, mapWidget, { senderId: 'map-w', mapId: 'm1' });
            expect(interactions.map(i => i.targetType)).toEqual(['applySpatialFilter']);
        });
    });
});
