/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';
import axios from '../../libs/ajax';
import MockAdapter from 'axios-mock-adapter';

import { testEpic, addTimeoutEpic, TEST_TIMEOUT } from './epicTestUtils';
import { applyWidgetInteractionsEpic, cleanupAndReapplyWidgetInteractionsEpic, applyOnSenderPropertyChangeEpic, zoomToFeatureEpic, applyTransientEffectsOnLoadEpic } from '../interactions';
import { applyWidgetInteractions, zoomToFilterExtent, zoomToFeature, APPLY_WIDGET_INTERACTIONS } from '../../actions/interactions';
import { UPDATE_PROPERTY, DELETE, insertWidget, updateWidgetProperty } from '../../actions/widgets';
import { dashboardLoaded } from '../../actions/dashboard';
import { CHANGE_LAYER_PARAMS, CHANGE_LAYER_PROPERTIES, removeNode } from '../../actions/layers';
import { TARGET_TYPES } from '../../utils/InteractionUtils';

const FILTER_ID = 'filter-1';
const FILTER_WIDGET_ID = 'filter-widget-1';
const CHART_WIDGET_ID = 'chart-widget-1';
const TABLE_WIDGET_ID = 'table-widget-1';
const MAP_WIDGET_ID = 'map-widget-1';
const MAP_ID = 'map-1';
const MAP_LAYER_ID = 'layer-1';
const TRACE_ID = 'trace-1';
const CHART_ID = 'chart-1';

const makeFilterWidget = (overrides = {}) => ({
    id: FILTER_WIDGET_ID,
    widgetType: 'filter',
    title: 'Filter Widget',
    filters: [{
        id: FILTER_ID,
        data: {
            dataSource: 'features',
            valuesFrom: 'grouped',
            valueAttribute: 'STATE_NAME'
        }
    }],
    selections: { [FILTER_ID]: ['Arizona'] },
    interactions: [
        {
            id: 'int-1',
            plugged: true,
            targetType: 'applyFilter',
            source: { nodePath: `root.widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
            target: { nodePath: `root.widgets[${CHART_WIDGET_ID}].charts[${CHART_ID}].traces[${TRACE_ID}]` }
        }
    ],
    ...overrides
});

const makeChartWidget = (overrides = {}) => ({
    id: CHART_WIDGET_ID,
    widgetType: 'chart',
    title: 'Chart Widget',
    charts: [{
        chartId: CHART_ID,
        traces: [{
            id: TRACE_ID,
            type: 'pie',
            layer: { name: 'test:layer', id: 'layer-1' }
        }]
    }],
    ...overrides
});

const makeTableWidget = (overrides = {}) => ({
    id: TABLE_WIDGET_ID,
    widgetType: 'table',
    title: 'Table Widget',
    layer: { name: 'test:layer', id: 'layer-1' },
    ...overrides
});

const makeMapWidget = (overrides = {}) => ({
    id: MAP_WIDGET_ID,
    widgetType: 'map',
    title: 'Map Widget',
    maps: [{
        mapId: MAP_ID,
        name: 'Map 1',
        layers: [{
            id: MAP_LAYER_ID,
            name: 'test:layer',
            type: 'wms',
            group: 'overlay'
        }]
    }],
    ...overrides
});

const makeState = (widgets, layersState = null) => {
    const state = {
        widgets: {
            containers: {
                floating: {
                    widgets
                }
            }
        }
    };
    if (layersState) {
        state.layers = layersState;
    }
    return state;
};

describe('interactions epics', () => {
    describe('applyWidgetInteractionsEpic', () => {
        it('dispatches updateWidgetProperty with charts and trace.interactionFilters for chart target', (done) => {
            const filterWidget = makeFilterWidget();
            const chartWidget = makeChartWidget();
            const state = makeState([filterWidget, chartWidget]);

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(CHART_WIDGET_ID);
                    expect(actions[0].key).toBe('charts');
                    expect(Array.isArray(actions[0].value)).toBe(true);
                    const charts = actions[0].value;
                    expect(charts.length).toBe(1);
                    const traces = charts[0].traces || [];
                    expect(traces.length).toBe(1);
                    expect(Array.isArray(traces[0].interactionFilters)).toBe(true);
                    expect(traces[0].interactionFilters.length).toBeGreaterThan(0);
                    expect(traces[0].interactionFilters[0].appliedFromWidget).toBe(FILTER_WIDGET_ID);
                    expect(traces[0].layer).toBeTruthy();
                    expect(traces[0].layer.layerFilter).toBeFalsy();
                },
                state,
                done
            );
        });

        it('dispatches changeLayerProperties with full default layerFilter when layer has null layerFilter (map layer target)', (done) => {
            const LAYER_ID = 'layer-1';
            const filterWidget = makeFilterWidget({
                interactions: [{
                    id: 'int-map-layer',
                    plugged: true,
                    targetType: 'applyFilter',
                    source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: { nodePath: `map.layers[${LAYER_ID}]` }
                }]
            });
            const layersState = { flat: [{ id: LAYER_ID, name: 'test:layer' }] };
            const state = makeState([filterWidget], layersState);

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(CHANGE_LAYER_PROPERTIES);
                    expect(actions[0].layer).toBe(LAYER_ID);
                    const layerFilter = actions[0].newProperties?.layerFilter;
                    expect(layerFilter).toBeTruthy();
                    expect(Array.isArray(layerFilter.groupFields)).toBe(true);
                    expect(layerFilter.groupFields.length).toBeGreaterThan(0);
                    expect(Array.isArray(layerFilter.filterFields)).toBe(true);
                    expect(layerFilter.attributePanelExpanded).toBe(true);
                    expect(layerFilter.spatialField).toBeTruthy();
                    expect(Array.isArray(layerFilter.filters)).toBe(true);
                    expect(layerFilter.filters.length).toBeGreaterThan(0);
                },
                state,
                done
            );
        });

        it('disabled filter behaves like a cleared filter: emits update with empty interactionFilters', (done) => {
            const filterWidget = makeFilterWidget({
                filters: [{
                    id: FILTER_ID,
                    disabled: true,
                    data: {
                        dataSource: 'features',
                        valuesFrom: 'grouped',
                        valueAttribute: 'STATE_NAME',
                        noSelectionMode: 'exclude'
                    }
                }],
                selections: { [FILTER_ID]: [] },
                interactions: [{
                    id: 'int-2',
                    plugged: true,
                    targetType: 'applyFilter',
                    source: { nodePath: `root.widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: { nodePath: `root.widgets[${TABLE_WIDGET_ID}]` }
                }]
            });
            const tableWidget = makeTableWidget();
            const state = makeState([filterWidget, tableWidget]);

            testEpic(
                addTimeoutEpic(applyWidgetInteractionsEpic, 100),
                2,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    const update = actions.find(a => a.type === UPDATE_PROPERTY);
                    expect(update).toBeTruthy();
                    expect(update.id).toBe(TABLE_WIDGET_ID);
                    expect(update.key).toBe('interactionFilters');
                    expect(Array.isArray(update.value)).toBe(true);
                    expect(update.value.length).toBe(0);
                },
                state,
                done
            );
        });

        it('dispatches updateWidgetProperty with interactionFilters for table target', (done) => {
            const filterWidget = makeFilterWidget({
                interactions: [{
                    id: 'int-2',
                    plugged: true,
                    targetType: 'applyFilter',
                    source: { nodePath: `root.widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: { nodePath: `root.widgets[${TABLE_WIDGET_ID}]` }
                }]
            });
            const tableWidget = makeTableWidget();
            const state = makeState([filterWidget, tableWidget]);

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(TABLE_WIDGET_ID);
                    expect(actions[0].key).toBe('interactionFilters');
                    expect(Array.isArray(actions[0].value)).toBe(true);
                    expect(actions[0].value.length).toBeGreaterThan(0);
                    expect(actions[0].value[0].appliedFromWidget).toBe(FILTER_WIDGET_ID);
                },
                state,
                done
            );
        });

        it('dispatches updateWidgetProperty with maps for layer time dimension target when timeline is unavailable', (done) => {
            const filterWidget = makeFilterWidget({
                selections: { [FILTER_ID]: ['2020-01-01T00:00:00Z'] },
                interactions: [{
                    id: 'int-dim',
                    plugged: true,
                    targetType: 'applyDimension',
                    source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: {
                        nodePath: `widgets[${MAP_WIDGET_ID}].maps[${MAP_ID}].layers[${MAP_LAYER_ID}].params.time`,
                        metaData: {
                            dimension: 'time'
                        }
                    }
                }]
            });
            const mapWidget = makeMapWidget();
            const state = {
                ...makeState([filterWidget, mapWidget]),
                context: {
                    currentContext: {
                        plugins: {
                            desktop: []
                        }
                    }
                }
            };

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(MAP_WIDGET_ID);
                    expect(actions[0].key).toBe('maps[0].layers[0].params.time');
                    expect(actions[0].value).toBe('2020-01-01T00:00:00Z');
                },
                state,
                done
            );
        });

        it('dispatches updateWidgetProperty with maps for elevation dimension target on map layer', (done) => {
            const filterWidget = makeFilterWidget({
                selections: { [FILTER_ID]: [200] },
                interactions: [{
                    id: 'int-elev',
                    plugged: true,
                    targetType: 'applyDimension',
                    source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: {
                        nodePath: `widgets[${MAP_WIDGET_ID}].maps[${MAP_ID}].layers[${MAP_LAYER_ID}].params.elevation`,
                        metaData: {
                            dimension: 'elevation'
                        }
                    }
                }]
            });
            const mapWidget = makeMapWidget();
            const state = makeState([filterWidget, mapWidget]);

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(MAP_WIDGET_ID);
                    expect(actions[0].key).toBe('maps[0].layers[0].params.elevation');
                    expect(actions[0].value).toBe(200);
                },
                state,
                done
            );
        });

        it('dispatches changeLayerParams for elevation dimension target on main map layer', (done) => {
            const LAYER_ID = 'mapstore:elevation_test__094852c0-0585-11f1-bc35-ed1a4c87fb4e';
            const filterWidget = makeFilterWidget({
                selections: { [FILTER_ID]: [200] },
                interactions: [{
                    id: 'int-main-map-elev',
                    plugged: true,
                    targetType: 'applyDimension',
                    source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: {
                        nodePath: `map.layers[${LAYER_ID}].params.elevation`,
                        metaData: {
                            dimension: 'elevation'
                        }
                    }
                }]
            });
            const state = makeState([filterWidget]);

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(CHANGE_LAYER_PARAMS);
                    expect(actions[0].layer).toBe(LAYER_ID);
                    expect(actions[0].params).toEqual({ elevation: 200 });
                },
                state,
                done
            );
        });

        it('dispatches updateWidgetProperty for chart axis applied current time dimension target', (done) => {
            const filterWidget = makeFilterWidget({
                selections: { [FILTER_ID]: ['2020-01-01T00:00:00Z'] },
                interactions: [{
                    id: 'int-chart-axis-time',
                    plugged: true,
                    targetType: 'applyDimension',
                    source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: {
                        nodePath: `widgets[${CHART_WIDGET_ID}].charts[${CHART_ID}].traces[${TRACE_ID}].xAxisOpts[x-axis-1].appliedCurrentTime`,
                        metaData: {
                            dimension: 'time'
                        }
                    }
                }]
            });
            const chartWidget = makeChartWidget({
                charts: [{
                    chartId: CHART_ID,
                    xAxisOpts: [{ id: 0 }, { id: 'x-axis-1', type: 'date', showCurrentTime: true }],
                    yAxisOpts: [{ id: 0 }],
                    traces: [{
                        id: TRACE_ID,
                        type: 'bar',
                        xaxis: 'x-axis-1',
                        layer: { name: 'test:layer', id: 'layer-1' }
                    }]
                }]
            });
            const state = makeState([filterWidget, chartWidget]);
            state.context = {
                currentContext: {
                    plugins: {
                        desktop: []
                    }
                }
            };

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(CHART_WIDGET_ID);
                    expect(actions[0].key).toBe('charts[0].xAxisOpts[1].appliedCurrentTime');
                    expect(actions[0].value).toBe('2020-01-01T00:00:00Z');
                },
                state,
                done
            );
        });

        it('only processes zoomTo interactions when isManualZoomTrigger is true (ZOOM_TO_FILTER_EXTENT)', (done) => {
            const LAYER_ID = 'layer-1';
            const filterWidget = makeFilterWidget({
                interactions: [
                    {
                        id: 'int-map-layer',
                        plugged: true,
                        targetType: TARGET_TYPES.APPLY_FILTER,
                        source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                        target: { nodePath: `map.layers[${LAYER_ID}]` }
                    },
                    {
                        id: 'int-zoom-to',
                        plugged: true,
                        targetType: TARGET_TYPES.APPLY_ZOOM_TO,
                        source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                        target: { nodePath: 'map.zoomTo' }
                    }
                ]
            });
            const layersState = { flat: [{ id: LAYER_ID, name: 'test:layer' }] };
            const state = makeState([filterWidget], layersState);

            testEpic(
                addTimeoutEpic(applyWidgetInteractionsEpic, 10),
                1,
                [zoomToFilterExtent(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    // It should not dispatch CHANGE_LAYER_PROPERTIES because applyFilter is skipped.
                    // Instead it times out waiting for zoomTo async WFS request (which fails silently).
                    expect(actions[0].type).toBe(TEST_TIMEOUT);
                },
                state,
                done
            );
        });

        it('processes zoomTo interactions after other interactions (using concatMap)', (done) => {
            const LAYER_ID = 'layer-1';
            const filterWidget = makeFilterWidget({
                interactions: [
                    {
                        id: 'int-zoom-to', // Placed first, but sortBy should move it to the end
                        plugged: true,
                        targetType: TARGET_TYPES.APPLY_ZOOM_TO,
                        source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                        target: { nodePath: 'map.zoomTo' }
                    },
                    {
                        id: 'int-map-layer',
                        plugged: true,
                        targetType: TARGET_TYPES.APPLY_FILTER,
                        source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                        target: { nodePath: `map.layers[${LAYER_ID}]` }
                    }
                ]
            });
            const layersState = { flat: [{ id: LAYER_ID, name: 'test:layer' }] };
            const state = makeState([filterWidget], layersState);

            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(FILTER_WIDGET_ID, 'floating', FILTER_ID)],
                (actions) => {
                    // Even with zoomTo placed first, applyFilter should still be executed and emit its action.
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(CHANGE_LAYER_PROPERTIES);
                },
                state,
                done
            );
        });
    });

    describe('cleanupAndReapplyWidgetInteractionsEpic', () => {
        it('on remove map layer, removes interactions targeting deleted main map layer', (done) => {
            const deletedLayerId = 'layer-A';
            const remainingLayerId = 'layer-B';
            const filterWidget = makeFilterWidget({
                interactions: [
                    {
                        id: 'int-layer-a',
                        plugged: true,
                        targetType: 'applyStyle',
                        source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                        target: { nodePath: `map.layers[${deletedLayerId}]` }
                    },
                    {
                        id: 'int-layer-b',
                        plugged: true,
                        targetType: 'applyStyle',
                        source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                        target: { nodePath: `map.layers[${remainingLayerId}]` }
                    }
                ]
            });
            const state = makeState([filterWidget]);

            testEpic(
                cleanupAndReapplyWidgetInteractionsEpic,
                1,
                [removeNode(deletedLayerId, 'layers')],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(FILTER_WIDGET_ID);
                    expect(actions[0].key).toBe('interactions');
                    const updatedInteractions = actions[0].value || [];
                    expect(updatedInteractions.length).toBe(1);
                    expect(updatedInteractions[0].id).toBe('int-layer-b');
                    expect(updatedInteractions[0].target.nodePath).toBe(`map.layers[${remainingLayerId}]`);
                },
                state,
                done
            );
        });

        it('on DELETE filter widget, cleans up trace.interactionFilters from chart and dispatches updateWidgetProperty(charts)', (done) => {
            const filterWidget = makeFilterWidget();
            const chartWidget = makeChartWidget({
                charts: [{
                    chartId: CHART_ID,
                    traces: [{
                        id: TRACE_ID,
                        type: 'pie',
                        layer: { name: 'test:layer', id: 'layer-1' },
                        interactionFilters: [{
                            id: 'f1',
                            appliedFromWidget: FILTER_WIDGET_ID,
                            format: 'logic',
                            filters: []
                        }]
                    }]
                }]
            });
            const state = makeState([filterWidget, chartWidget]);

            testEpic(
                cleanupAndReapplyWidgetInteractionsEpic,
                1,
                [{ type: DELETE, widget: filterWidget, target: 'floating' }],
                (actions) => {
                    const updateActions = actions.filter(a => a.type === UPDATE_PROPERTY);
                    expect(updateActions.length >= 1).toBe(true);
                    const chartUpdate = updateActions.find(a => a.key === 'charts' && a.id === CHART_WIDGET_ID);
                    expect(chartUpdate).toBeTruthy();
                    const traces = chartUpdate.value[0].traces || [];
                    expect(traces.length).toBe(1);
                    expect(traces[0].interactionFilters).toEqual([]);
                },
                state,
                done
            );
        });

        it('on DELETE filter widget, cleans up widget.interactionFilters from table and dispatches updateWidgetProperty(interactionFilters)', (done) => {
            const filterWidget = makeFilterWidget();
            const tableWidget = makeTableWidget({
                interactionFilters: [{
                    id: 'f1',
                    appliedFromWidget: FILTER_WIDGET_ID,
                    format: 'logic',
                    filters: []
                }]
            });
            const state = makeState([filterWidget, tableWidget]);

            testEpic(
                cleanupAndReapplyWidgetInteractionsEpic,
                1,
                [{ type: DELETE, widget: filterWidget, target: 'floating' }],
                (actions) => {
                    const updateActions = actions.filter(a => a.type === UPDATE_PROPERTY);
                    expect(updateActions.length >= 1).toBe(true);
                    const tableUpdate = updateActions.find(a => a.key === 'interactionFilters' && a.id === TABLE_WIDGET_ID);
                    expect(tableUpdate).toBeTruthy();
                    expect(tableUpdate.value).toEqual([]);
                },
                state,
                done
            );
        });

        it('on DELETE filter widget, resets connected chart axis applied current time', (done) => {
            const filterWidget = makeFilterWidget({
                interactions: [{
                    id: 'int-chart-axis-time',
                    plugged: true,
                    targetType: 'applyDimension',
                    source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[${FILTER_ID}]` },
                    target: {
                        nodePath: `widgets[${CHART_WIDGET_ID}].charts[${CHART_ID}].traces[${TRACE_ID}].xAxisOpts[x-axis-1].appliedCurrentTime`,
                        metaData: { dimension: 'time' }
                    }
                }]
            });
            const chartWidget = makeChartWidget({
                charts: [{
                    chartId: CHART_ID,
                    xAxisOpts: [{ id: 0 }, { id: 'x-axis-1', type: 'date', showCurrentTime: true, appliedCurrentTime: '2020-01-01T00:00:00Z' }],
                    traces: [{
                        id: TRACE_ID,
                        type: 'bar',
                        xaxis: 'x-axis-1'
                    }]
                }]
            });
            const state = makeState([chartWidget]);

            testEpic(
                cleanupAndReapplyWidgetInteractionsEpic,
                1,
                [{ type: DELETE, widget: filterWidget, target: 'floating' }],
                (actions) => {
                    const axisUpdate = actions.find(a =>
                        a.type === UPDATE_PROPERTY
                        && a.id === CHART_WIDGET_ID
                        && a.key === 'charts[0].xAxisOpts[1].appliedCurrentTime'
                    );
                    expect(axisUpdate).toBeTruthy();
                    expect(axisUpdate.value).toBe(null);
                },
                state,
                done
            );
        });

        it('on INSERT filter widget, resets chart axis effects from deleted interactions', (done) => {
            const deletedInteraction = {
                id: 'deleted-chart-axis-time',
                plugged: true,
                targetType: 'applyDimension',
                source: { nodePath: `widgets[${FILTER_WIDGET_ID}].filters[deleted-filter]` },
                target: {
                    nodePath: `widgets[${CHART_WIDGET_ID}].charts[${CHART_ID}].traces[${TRACE_ID}].xAxisOpts[x-axis-1].appliedCurrentTime`,
                    metaData: { dimension: 'time' }
                }
            };
            const filterWidget = makeFilterWidget({
                filters: [],
                selections: {},
                interactions: [],
                deletedInteractions: [deletedInteraction]
            });
            const chartWidget = makeChartWidget({
                charts: [{
                    chartId: CHART_ID,
                    xAxisOpts: [{ id: 0 }, { id: 'x-axis-1', type: 'date', showCurrentTime: true, appliedCurrentTime: '2020-01-01T00:00:00Z' }],
                    traces: [{
                        id: TRACE_ID,
                        type: 'bar',
                        xaxis: 'x-axis-1'
                    }]
                }]
            });
            const state = makeState([{ ...filterWidget, deletedInteractions: undefined }, chartWidget]);

            testEpic(
                cleanupAndReapplyWidgetInteractionsEpic,
                1,
                [insertWidget(filterWidget, 'floating')],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(CHART_WIDGET_ID);
                    expect(actions[0].key).toBe('charts[0].xAxisOpts[1].appliedCurrentTime');
                    expect(actions[0].value).toBe(null);
                },
                state,
                done
            );
        });
    });

    describe('table sender', () => {
        const tableInteraction = {
            id: 'table-int-1',
            plugged: true,
            targetType: 'applyFilter',
            source: { nodePath: `root.widgets[${TABLE_WIDGET_ID}]` },
            target: { nodePath: `root.widgets[${CHART_WIDGET_ID}].charts[${CHART_ID}].traces[${TRACE_ID}]` }
        };
        const makeSenderTable = () => makeTableWidget({
            options: { propertyName: ['STATE_NAME'] },
            quickFilters: { STATE_NAME: { rawValue: 'Arizona', value: 'Arizona', operator: 'ilike', type: 'string', attribute: 'STATE_NAME' } },
            interactions: [tableInteraction]
        });

        it('applies the table column filter to the target chart trace', (done) => {
            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID)],
                (actions) => {
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(CHART_WIDGET_ID);
                    expect(actions[0].key).toBe('charts');
                    const [filter] = actions[0].value[0].traces[0].interactionFilters;
                    expect(filter.id).toBe('table-int-1');
                    expect(filter.appliedFromWidget).toBe(TABLE_WIDGET_ID);
                    expect(filter.filters[0].body).toContain('STATE_NAME');
                },
                makeState([makeSenderTable(), makeChartWidget()]),
                done
            );
        });

        it('reapplies the table interactions when a column filter changes', (done) => {
            testEpic(
                applyOnSenderPropertyChangeEpic,
                1,
                [updateWidgetProperty(TABLE_WIDGET_ID, 'quickFilters.STATE_NAME', {})],
                (actions) => {
                    expect(actions[0].type).toBe(APPLY_WIDGET_INTERACTIONS);
                    expect(actions[0].widgetId).toBe(TABLE_WIDGET_ID);
                    expect(actions[0].sourceId).toBe(TABLE_WIDGET_ID);
                },
                makeState([makeSenderTable()]),
                done
            );
        });

        it('does not reapply for other properties or non sender widgets', (done) => {
            testEpic(
                addTimeoutEpic(applyOnSenderPropertyChangeEpic, 20),
                1,
                [
                    updateWidgetProperty(TABLE_WIDGET_ID, 'options.columnSettings', {}),
                    updateWidgetProperty(CHART_WIDGET_ID, 'filter', {})
                ],
                (actions) => {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(TEST_TIMEOUT);
                },
                makeState([makeSenderTable(), makeChartWidget()]),
                done
            );
        });

        describe('zoom to filtered bounds', () => {
            const BOUNDS = '<?xml version="1.0" encoding="UTF-8"?><ows:BoundingBox xmlns:ows="http://www.opengis.net/ows/1.1" crs="EPSG:4326"><ows:LowerCorner>-10 20</ows:LowerCorner><ows:UpperCorner>30 40</ows:UpperCorner></ows:BoundingBox>';
            const zoomInteraction = {
                id: 'table-zoom-1',
                plugged: true,
                targetType: TARGET_TYPES.APPLY_ZOOM_TO,
                source: { nodePath: `widgets[${TABLE_WIDGET_ID}]` },
                target: { nodePath: `widgets[${MAP_WIDGET_ID}].maps[${MAP_ID}].applyZoomTo` },
                configuration: { autoZoom: true }
            };
            const makeZoomTable = (overrides = {}) => makeTableWidget({
                layer: { name: 'test:layer', id: 'layer-1', url: '/geoserver/wms' },
                options: { propertyName: ['STATE_NAME'] },
                quickFilters: { STATE_NAME: { rawValue: 'Arizona', value: 'Arizona', operator: 'ilike', type: 'string', attribute: 'STATE_NAME' } },
                interactions: [zoomInteraction],
                ...overrides
            });
            let mockAxios;
            let requests;
            beforeEach(() => {
                requests = 0;
                mockAxios = new MockAdapter(axios);
                mockAxios.onPost().reply(() => {
                    requests++;
                    return [200, BOUNDS];
                });
            });
            afterEach(() => {
                mockAxios.restore();
            });

            it('zooms the map widget to the table filtered records without layer filter interactions', (done) => {
                testEpic(
                    applyWidgetInteractionsEpic,
                    1,
                    [zoomToFilterExtent(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID)],
                    (actions) => {
                        expect(actions[0].type).toBe(UPDATE_PROPERTY);
                        expect(actions[0].id).toBe(MAP_WIDGET_ID);
                        expect(actions[0].key).toBe('maps');
                        expect(actions[0].value.mapId).toBe(MAP_ID);
                        expect(actions[0].value.zoomToRequest.extent).toEqual([-10, 20, 30, 40]);
                    },
                    makeState([makeZoomTable(), makeMapWidget()]),
                    done
                );
            });

            it('requests the extent once when the table filter changes quickly', (done) => {
                testEpic(
                    applyWidgetInteractionsEpic,
                    1,
                    [
                        applyWidgetInteractions(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID),
                        applyWidgetInteractions(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID)
                    ],
                    (actions) => {
                        expect(actions[0].key).toBe('maps');
                        expect(requests).toBe(1);
                    },
                    makeState([makeZoomTable(), makeMapWidget()]),
                    done
                );
            });

            it('zooms automatically also without the auto zoom configuration', (done) => {
                testEpic(
                    applyWidgetInteractionsEpic,
                    1,
                    [applyWidgetInteractions(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID)],
                    (actions) => {
                        expect(actions[0].key).toBe('maps');
                    },
                    makeState([makeZoomTable({ interactions: [{ ...zoomInteraction, configuration: { autoZoom: false } }] }), makeMapWidget()]),
                    done
                );
            });

            it('keeps the pending zoom of a sender when another sender applies', (done) => {
                const OTHER_TABLE_ID = 'table-widget-2';
                const otherTable = makeZoomTable({
                    id: OTHER_TABLE_ID,
                    interactions: [{ ...zoomInteraction, id: 'table-zoom-2', source: { nodePath: `widgets[${OTHER_TABLE_ID}]` } }]
                });
                testEpic(
                    applyWidgetInteractionsEpic,
                    2,
                    [
                        applyWidgetInteractions(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID),
                        applyWidgetInteractions(OTHER_TABLE_ID, 'floating', OTHER_TABLE_ID)
                    ],
                    (actions) => {
                        expect(actions.map(action => action.key)).toEqual(['maps', 'maps']);
                        expect(requests).toBe(2);
                    },
                    makeState([makeZoomTable(), otherTable, makeMapWidget()]),
                    done
                );
            });

            it('does not zoom when the table has no filter', (done) => {
                testEpic(
                    addTimeoutEpic(applyWidgetInteractionsEpic, 20),
                    1,
                    [zoomToFilterExtent(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID)],
                    (actions) => {
                        expect(actions[0].type).toBe(TEST_TIMEOUT);
                        expect(requests).toBe(0);
                    },
                    makeState([makeZoomTable({ quickFilters: {} }), makeMapWidget()]),
                    done
                );
            });
        });

        describe('zoom to feature', () => {
            const makeZoomToFeatureInteraction = (overrides = {}) => ({
                id: 'table-zoom-feature-1',
                plugged: true,
                targetType: TARGET_TYPES.APPLY_ZOOM_TO_FEATURE,
                source: { nodePath: `widgets[${TABLE_WIDGET_ID}]` },
                target: { nodePath: `widgets[${MAP_WIDGET_ID}].maps[${MAP_ID}].applyZoomTo` },
                ...overrides
            });
            const feature = { type: 'Feature', id: 'f1', bbox: [1, 2, 3, 4], geometry: null };
            const options = { crs: 'EPSG:4326', maxZoom: 12 };

            it('zooms the plugged map widgets to the feature extent', (done) => {
                testEpic(
                    zoomToFeatureEpic,
                    1,
                    [zoomToFeature(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID, feature, options)],
                    (actions) => {
                        expect(actions[0].type).toBe(UPDATE_PROPERTY);
                        expect(actions[0].id).toBe(MAP_WIDGET_ID);
                        expect(actions[0].key).toBe('maps');
                        expect(actions[0].value).toEqual({ mapId: MAP_ID, zoomToRequest: { extent: [1, 2, 3, 4], crs: 'EPSG:4326', maxZoom: 12 } });
                    },
                    makeState([makeTableWidget({ interactions: [makeZoomToFeatureInteraction()] }), makeMapWidget()]),
                    done
                );
            });

            it('computes the extent from the geometry when the feature has no bbox', (done) => {
                const pointFeature = { type: 'Feature', id: 'f2', geometry: { type: 'Point', coordinates: [10, 20] } };
                testEpic(
                    zoomToFeatureEpic,
                    1,
                    [zoomToFeature(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID, pointFeature)],
                    (actions) => {
                        expect(actions[0].value.zoomToRequest.extent).toEqual([10, 20, 10, 20]);
                        expect(actions[0].value.zoomToRequest.crs).toBe('EPSG:4326');
                    },
                    makeState([makeTableWidget({ interactions: [makeZoomToFeatureInteraction()] }), makeMapWidget()]),
                    done
                );
            });

            it('ignores unplugged and other zoom interactions', (done) => {
                testEpic(
                    addTimeoutEpic(zoomToFeatureEpic, 20),
                    1,
                    [zoomToFeature(TABLE_WIDGET_ID, 'floating', TABLE_WIDGET_ID, feature, options)],
                    (actions) => {
                        expect(actions[0].type).toBe(TEST_TIMEOUT);
                    },
                    makeState([makeTableWidget({ interactions: [
                        makeZoomToFeatureInteraction({ plugged: false }),
                        makeZoomToFeatureInteraction({ id: 'zoom-bounds', targetType: TARGET_TYPES.APPLY_ZOOM_TO })
                    ] }), makeMapWidget()]),
                    done
                );
            });
        });
    });

    describe('map widget sender', () => {
        const bbox = { bounds: { minx: -10, miny: -20, maxx: 30, maxy: 40 }, crs: 'EPSG:4326' };
        const spatialInteraction = {
            id: 'map-spatial-1',
            plugged: true,
            targetType: TARGET_TYPES.APPLY_SPATIAL_FILTER,
            source: { nodePath: `widgets[${MAP_WIDGET_ID}].maps[${MAP_ID}]` },
            target: { nodePath: `widgets[${TABLE_WIDGET_ID}]` }
        };
        const makeSenderMap = () => makeMapWidget({
            maps: [{ ...makeMapWidget().maps[0], bbox }],
            interactions: [spatialInteraction]
        });
        const makeReceiverTable = (overrides = {}) => makeTableWidget({ geomProp: 'the_geom', ...overrides });

        it('applies the viewport spatial filter to the table as a transient effect', (done) => {
            testEpic(
                applyWidgetInteractionsEpic,
                1,
                [applyWidgetInteractions(MAP_WIDGET_ID, 'floating', MAP_ID)],
                (actions) => {
                    expect(actions[0].type).toBe(UPDATE_PROPERTY);
                    expect(actions[0].id).toBe(TABLE_WIDGET_ID);
                    expect(actions[0].key).toBe('interactionFilters');
                    const [filter] = actions[0].value;
                    expect(filter.id).toBe('map-spatial-1');
                    expect(filter.appliedFromWidget).toBe(MAP_WIDGET_ID);
                    expect(filter.transient).toBe(true);
                    expect(filter.filters[0].body).toContain('INTERSECTS("the_geom"');
                },
                makeState([makeSenderMap(), makeReceiverTable()]),
                done
            );
        });

        it('does not dispatch when the receiver already has the same filter', (done) => {
            // first apply computes the filter, the second one runs on a state that already has it
            testEpic(applyWidgetInteractionsEpic, 1, [applyWidgetInteractions(MAP_WIDGET_ID, 'floating', MAP_ID)], ([first]) => {
                testEpic(
                    addTimeoutEpic(applyWidgetInteractionsEpic, 20),
                    1,
                    [applyWidgetInteractions(MAP_WIDGET_ID, 'floating', MAP_ID)],
                    (actions) => {
                        expect(actions[0].type).toBe(TEST_TIMEOUT);
                    },
                    makeState([makeSenderMap(), makeReceiverTable({ interactionFilters: first.value })]),
                    done
                );
            }, makeState([makeSenderMap(), makeReceiverTable()]));
        });

        it('syncs the view of a connected map widget, skipping it when already in place', (done) => {
            const RECEIVER_ID = 'map-widget-2';
            const center = { x: 10, y: 20, crs: 'EPSG:4326' };
            const syncInteraction = {
                id: 'map-sync-1',
                plugged: true,
                targetType: TARGET_TYPES.APPLY_VIEW_SYNC,
                source: { nodePath: `widgets[${MAP_WIDGET_ID}].maps[${MAP_ID}]` },
                target: { nodePath: `widgets[${RECEIVER_ID}].maps[r1].applyZoomTo` }
            };
            const sender = makeMapWidget({ maps: [{ ...makeMapWidget().maps[0], center, zoom: 6 }], interactions: [syncInteraction] });
            const receiver = (map = {}) => ({ id: RECEIVER_ID, widgetType: 'map', maps: [{ mapId: 'r1', ...map }] });
            testEpic(applyWidgetInteractionsEpic, 1, [applyWidgetInteractions(MAP_WIDGET_ID, 'floating', MAP_ID)], (actions) => {
                expect(actions[0].type).toBe(UPDATE_PROPERTY);
                expect(actions[0].id).toBe(RECEIVER_ID);
                expect(actions[0].mode).toBe('merge');
                expect(actions[0].value).toEqual({ mapId: 'r1', center, zoom: 6 });
                testEpic(
                    addTimeoutEpic(applyWidgetInteractionsEpic, 20),
                    1,
                    [applyWidgetInteractions(MAP_WIDGET_ID, 'floating', MAP_ID)],
                    (next) => {
                        expect(next[0].type).toBe(TEST_TIMEOUT);
                    },
                    makeState([sender, receiver({ center: { x: 10 + 1e-9, y: 20, crs: 'EPSG:4326' }, zoom: 6 })]),
                    done
                );
            }, makeState([sender, receiver({ center: { x: 0, y: 0, crs: 'EPSG:4326' }, zoom: 2 })]));
        });

        it('reapplies on map widget updates', (done) => {
            testEpic(
                applyOnSenderPropertyChangeEpic,
                1,
                [updateWidgetProperty(MAP_WIDGET_ID, 'maps', { mapId: MAP_ID, bbox }, 'merge')],
                (actions) => {
                    expect(actions[0].type).toBe(APPLY_WIDGET_INTERACTIONS);
                    expect(actions[0].widgetId).toBe(MAP_WIDGET_ID);
                    expect(actions[0].sourceId).toBe(MAP_ID);
                },
                makeState([makeSenderMap(), makeReceiverTable()]),
                done
            );
        });

        it('reapplies the transient effects on load', (done) => {
            testEpic(
                applyTransientEffectsOnLoadEpic,
                1,
                [dashboardLoaded({}, {})],
                (actions) => {
                    expect(actions[0].type).toBe(APPLY_WIDGET_INTERACTIONS);
                    expect(actions[0].widgetId).toBe(MAP_WIDGET_ID);
                    expect(actions[0].sourceId).toBe(MAP_ID);
                },
                makeState([makeSenderMap(), makeReceiverTable(), makeFilterWidget()]),
                done
            );
        });
    });
});
