/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { get } from 'lodash';
import { DEFAULT_TARGET } from '../../actions/widgets';
import { STATE_INTERACTION_DASH_1, STATE_INTERACTION_MAP_1 } from './widgets-test-data';

import expect from 'expect';

import {
    getFloatingWidgets,
    getFloatingWidgetsLayout,
    getDashboardWidgets,
    getDashboardWidgetsLayout,
    getEditingWidget,
    getEditingWidgetLayer,
    getEditingWidgetFilter,
    getEditorSettings,
    getWidgetLayer,
    getWidgetAttributeFilter,
    createPathSelector,
    returnToFeatureGridSelector,
    isTrayEnabled,
    getVisibleFloatingWidgets,
    getChartWidgetLayers,
    getWidgetFilterKey,
    getWidgetInteractionTreeGenerated,
    interactionsNodesSelector,
    interactionTargetVisibilitySelector,
    interactionTargetsFilterDisabledSelector,
    getApplyStyleOutOfSyncForFilterWidget,
    getApplyDimensionOutOfSyncForFilterWidget,
    inactiveInteractionIdsForWidgetSelector,
    isTimelineEnabledForInteractions,
    shouldSkipInteraction,
    widgetsConfig,
    getMainMapWidget,
    getMapWidgets,
    getLegendMapsSelector,
    getEditingLegendMapSelector,
    widgetTypesAvailabilitySelector
} from '../widgets';

import { set } from '../../utils/ImmutableUtils';
describe('widgets selectors', () => {
    it('getFloatingWidgets', () => {
        const state = set(`widgets.containers[${DEFAULT_TARGET}].widgets`, [{title: "TEST"}], {});
        expect(getFloatingWidgets(state)).toExist();
        expect(getFloatingWidgets(state)[0]).toExist();
        expect(getFloatingWidgets(state)[0].title).toBe("TEST");
    });
    it('getFloatingWidgetsLayout', () => {
        const state = set(`widgets.containers[${DEFAULT_TARGET}].layouts`, [{ title: "TEST" }], {});
        expect(getFloatingWidgetsLayout(state)).toExist();
        expect(getFloatingWidgetsLayout(state)[0]).toExist();
        expect(getFloatingWidgetsLayout(state)[0].title).toBe("TEST");
    });
    it('getFloatingWidgets', () => {
        const state = set(`widgets.containers[${DEFAULT_TARGET}].widgets`, [{ title: "TEST" }], {});
        expect(getDashboardWidgets(state)).toExist();
        expect(getDashboardWidgets(state)[0]).toExist();
        expect(getDashboardWidgets(state)[0].title).toBe("TEST");
    });
    it('getFloatingWidgetsLayout', () => {
        const state = set(`widgets.containers[${DEFAULT_TARGET}].layouts`, [{ title: "TEST" }], {});
        expect(getDashboardWidgetsLayout(state)).toExist();
        expect(getDashboardWidgetsLayout(state)[0]).toExist();
        expect(getDashboardWidgetsLayout(state)[0].title).toBe("TEST");
    });
    it('returns the maps controlled by the legends', () => {
        const map = { mapId: 'm1', layers: [] };
        const legendInteraction = (id, plugged = true) => ({ id, plugged, targetType: 'applyLegend', target: { nodePath: 'widgets[map-w].maps[m1].applyLegend' } });
        const legend = { id: 'legend-1', widgetType: 'legend', interactions: [legendInteraction('i1')] };
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        widgets: [
                            { id: 'map-w', widgetType: 'map', maps: [map] },
                            legend,
                            { id: 'legend-2', widgetType: 'legend', interactions: [legendInteraction('i2', false)] },
                            { id: 'legend-3', widgetType: 'legend', interactions: [{ ...legendInteraction('i3'), target: { nodePath: 'widgets[deleted].maps[m1].applyLegend' } }] }
                        ]
                    }
                },
                builder: { editor: legend }
            }
        };
        expect(getLegendMapsSelector(state)).toEqual({ 'legend-1': { widgetId: 'map-w', mapId: 'm1', map } });
        expect(getEditingLegendMapSelector(state)).toEqual({ widgetId: 'map-w', mapId: 'm1', map });
    });
    it('does not render or list the main map entry', () => {
        const mainMap = { id: 'map', widgetType: 'map', mainMap: true, maps: [{ mapId: 'main' }] };
        const mapWidget = { id: 'map-w', widgetType: 'map', maps: [{ mapId: 'm1' }] };
        const state = { widgets: { containers: { [DEFAULT_TARGET]: { widgets: [mainMap, mapWidget] } } } };
        expect(getVisibleFloatingWidgets(state)).toEqual([mapWidget]);
        expect(getMapWidgets(state)).toEqual([mapWidget]);
        expect(getMainMapWidget(state)).toBe(mainMap);
    });
    it('widgetsConfig does not save transient effects', () => {
        const persisted = { id: 'table-filter', appliedFromWidget: 'table-1' };
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        widgets: [{ id: 'counter-1', widgetType: 'counter', interactionFilters: [persisted, { id: 'viewport', appliedFromWidget: 'map-w', "transient": true }] }]
                    }
                }
            }
        };
        expect(widgetsConfig(state).widgets[0].interactionFilters).toEqual([persisted]);
    });
    it('widgetsConfig uses canonical state while maximized and filters linked views', () => {
        const widget = {
            id: 'widget-1',
            layoutId: 'view-1',
            dataGrid: { x: 1, y: 2, w: 3, h: 4 }
        };
        const linkedWidget = {
            id: 'widget-2',
            layoutId: 'view-2',
            dataGrid: { x: 0, y: 0, w: 1, h: 1 }
        };
        const layouts = [{
            id: 'view-1',
            name: 'Main view',
            md: [{ i: widget.id, x: 1, y: 2, w: 3, h: 4 }],
            xxs: [{ i: widget.id, x: 0, y: 0, w: 1, h: 4 }]
        }, {
            id: 'view-2',
            name: 'Linked view',
            dashboard: { id: 10 },
            md: [{ i: linkedWidget.id, x: 0, y: 0, w: 1, h: 1 }],
            xxs: [{ i: linkedWidget.id, x: 0, y: 0, w: 1, h: 1 }]
        }];
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        widgets: [widget, linkedWidget],
                        layouts,
                        maximized: {
                            widget: [widget]
                        }
                    }
                }
            }
        };

        const config = widgetsConfig(state);
        expect(config.widgets).toEqual([widget]);
        expect(config.layouts[0]).toEqual(layouts[0]);
        expect(config.layouts[1]).toEqual({
            ...layouts[1],
            color: undefined,
            linkExistingDashboard: undefined,
            md: [],
            xxs: []
        });
    });
    it('getEditingWidget', () => {
        const state = set(`widgets.builder.editor`, { title: "TEST" }, {});
        expect(getEditingWidget(state)).toExist();
        expect(getEditingWidget(state).title).toBe("TEST");
    });
    it('getEditingWidgetLayer', () => {
        const state = set(`widgets.builder.editor`, { layer: { name: "TEST"}}, {});
        expect(getEditingWidgetLayer(state)).toExist();
        expect(getEditingWidgetLayer(state).name).toBe("TEST");
    });
    it('getEditingWidgetFilter', () => {
        const state = set(`widgets.builder.editor`, { filter: { name: "TEST" } }, {});
        expect(getEditingWidgetFilter(state)).toExist();
    });
    it('getEditingWidgetFilter - chart', () => {
        const state = set(`widgets.builder.editor`, {widgetType: "chart", charts: [{chartId: "1", traces: [{ filter: { name: "TEST" }}] }], selectedChartId: "1" }, {});
        expect(getEditingWidgetFilter(state)).toBeTruthy();
    });
    it('getEditorSettings', () => {
        const state = set(`widgets.builder.settings`, { flag: true }, {});
        expect(getEditorSettings(state)).toExist();
        expect(getEditorSettings(state).flag).toBe(true);
    });
    it('returnToFeatureGridSelector', () => {
        const state = set(`widgets.builder.editor`, { returnToFeatureGrid: true }, {});
        expect(returnToFeatureGridSelector(state)).toExist();
        expect(returnToFeatureGridSelector(state)).toBe(true);
    });

    it('getWidgetAttributeFilter', () => {
        const state = {
            widgets: {
                containers: {
                    floating: {
                        widgets: [{
                            id: "wId",
                            quickFilters: {
                                state: {
                                    rawValue: 'y',
                                    value: 'y',
                                    operator: 'ilike',
                                    type: 'string',
                                    attribute: 'state'
                                }
                            },
                            options: {
                                propertyName: ['state']
                            }
                        }]
                    }
                }
            }
        };
        const widgetFilter = getWidgetAttributeFilter("wId", "state")(state);
        expect(widgetFilter).toExist();
        expect(widgetFilter).toEqual({ rawValue: 'y', value: 'y', operator: 'ilike', type: 'string', attribute: 'state' });

    });
    it('getWidgetAttributeFilter propertyName with array of objects', () => {
        const state = {
            widgets: {
                containers: {
                    floating: {
                        widgets: [{
                            id: "wId",
                            quickFilters: {
                                state: {
                                    rawValue: 'y',
                                    value: 'y',
                                    operator: 'ilike',
                                    type: 'string',
                                    attribute: 'state'
                                }
                            },
                            options: {
                                propertyName: [{name: 'state'}]
                            }
                        }]
                    }
                }
            }
        };
        const widgetFilter = getWidgetAttributeFilter("wId", "state")(state);
        expect(widgetFilter).toExist();
        expect(widgetFilter).toEqual({ rawValue: 'y', value: 'y', operator: 'ilike', type: 'string', attribute: 'state' });

    });
    it('getWidgetLayer', () => {
        const tocLayerState = {'layers': { selected: ["TEST1"], flat: [{id: "TEST1", name: "TEST1"}] }};
        expect(getWidgetLayer(tocLayerState)).toExist();
        expect(getWidgetLayer(tocLayerState).name).toBe("TEST1");
        const dashboardNoLayer = set('dashboard.editing', true, set('dashboard.editor.available', true, tocLayerState));
        expect(getWidgetLayer(dashboardNoLayer)).toNotExist();
        const widgetLayer = set(`widgets.builder.editor`, { layer: { name: "TEST2" } }, dashboardNoLayer);
        expect(getWidgetLayer(widgetLayer).name).toBe("TEST2");
        const chartWidgetLayer = set(`widgets.builder.editor`,
            { selectedChartId: "1", charts: [{ chartId: "1", traces: [{ layer: {name: "TEST2"} }] }] }, dashboardNoLayer);
        expect(getWidgetLayer(chartWidgetLayer).name).toBe("TEST2");
    });
    it('getEditingWidgetLayer charts', () => {
        const chartWidgetLayer =
            getEditingWidgetLayer(set(`widgets.builder.editor`, { selectedChartId: "1", charts: [{ chartId: "1", traces: [{ layer: {name: "TEST2"} }] }] }, {}));
        expect(chartWidgetLayer.name).toBe("TEST2");
    });
    it('getWidgetLayers charts', () => {
        const chartWidgetLayer =
            getChartWidgetLayers(set(`widgets.builder.editor`, {
                selectedChartId: "1",
                charts: [{ chartId: "1", layer: {name: "TEST1"} },
                    { chartId: "2", layer: {name: "TEST2"} }]}, {})
            );
        expect(chartWidgetLayer.length).toBe(2);
    });
    it('widgetTypesAvailabilitySelector', () => {
        const mapWidget = { id: 'map-w', widgetType: 'map', maps: [{ mapId: 'm1' }] };
        const mainMapEntry = { id: 'map', widgetType: 'map', mainMap: true, maps: [{ mapId: 'main' }] };
        expect(widgetTypesAvailabilitySelector({
            map: { present: { center: {} } },
            widgets: { containers: { [DEFAULT_TARGET]: { widgets: [mainMapEntry] } } }
        })).toEqual({ hasMapWidgets: false, mainMapAvailable: true });
        expect(widgetTypesAvailabilitySelector({
            dashboard: { editor: { available: true } },
            widgets: { containers: { [DEFAULT_TARGET]: { widgets: [mapWidget] } } }
        })).toEqual({ hasMapWidgets: true, mainMapAvailable: false });
    });
    it('createDependenciesSelector', () => {
        const LAYER_1 = {
            id: "l1"
        };
        const LAYER_2 = {
            id: "l2"
        };
        const state = {
            layers: [{

            }],
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        widgets: [{
                            id: "WIDGET",
                            maps: [{mapId: "MAP1", layers: LAYER_1}],
                            widgetType: "map"
                        }, {

                        }, {
                            id: "table-1",
                            widgetType: "table",
                            layer: LAYER_2
                        }, {
                            widgetType: "chart"
                        }]
                    }
                }
            }
        };
        const tests = [
            {
                path: 'widgets[WIDGET].maps[MAP1].layers',
                expected: LAYER_1
            },
            {
                path: 'widgets[table-1].layer',
                expected: LAYER_2
            }
        ];
        tests.forEach(({path, expected}) => {
            expect(createPathSelector(path)(state)).toEqual(expected);
        });

    });
    it('isTrayEnabled', () => {
        expect(isTrayEnabled({
            widgets: {
                tray: true
            }
        })).toBe(true);
        expect(isTrayEnabled({
            widgets: {
                tray: false
            }
        })).toBe(false);
    });
    it('getVisibleFloatingWidgets with collapsed', () => {
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        collapsed: {
                            'widget2': {
                                layout: [{
                                    i: 'widget2'
                                }],
                                layouts: {
                                    xxs: [{
                                        i: 'widget2'
                                    }]
                                }
                            }
                        },
                        widgets: [{
                            widgetType: "table",
                            id: "widget1"
                        }, {
                            widgetType: "table",
                            id: "widget2",
                            layer: {
                                name: "layername"
                            }
                        },
                        {
                            widgetType: "map",
                            id: "widget3",
                            layer: {
                                name: "layername"
                            }
                        }],
                        layout: [{
                            i: 'widget1'
                        }, {
                            i: 'widget3'
                        }],
                        layouts: {
                            xxs: [{
                                i: 'widget1'
                            }, {
                                i: 'widget3'
                            }]
                        }
                    }
                }
            }
        };
        const result = getVisibleFloatingWidgets(state);
        expect(result).toExist();
        expect(result.length).toBe(2);
        expect(result[0].id).toBe('widget1');
        expect(result[1].id).toBe('widget3');
    });
    it('getVisibleFloatingWidgets with maximized', () => {
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        maximized: {
                            layout: [{
                                i: 'widget1'
                            }, {
                                i: 'widget2'
                            }, {
                                i: 'widget3'
                            }],
                            layouts: {
                                xxs: [{
                                    i: 'widget1'
                                }, {
                                    i: 'widget2'
                                }, {
                                    i: 'widget3'
                                }]
                            },
                            widget: {
                                widgetType: "map",
                                id: "widget3",
                                layer: {
                                    name: "layername"
                                }
                            }
                        },
                        widgets: [{
                            widgetType: "table",
                            id: "widget1"
                        }, {
                            widgetType: "table",
                            id: "widget2",
                            layer: {
                                name: "layername"
                            }
                        },
                        {
                            widgetType: "map",
                            id: "widget3",
                            layer: {
                                name: "layername"
                            }
                        }],
                        layout: [{
                            i: 'widget3'
                        }],
                        layouts: {
                            xxs: [{
                                i: 'widget3'
                            }]
                        }
                    }
                }
            }
        };
        const result = getVisibleFloatingWidgets(state);
        expect(result).toExist();
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('widget3');
    });
    it('getVisibleFloatingWidgets with maximized and collapsed', () => {
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        maximized: {
                            layout: [{
                                i: 'widget1'
                            }, {
                                i: 'widget2'
                            }, {
                                i: 'widget3'
                            }],
                            layouts: {
                                xxs: [{
                                    i: 'widget1'
                                }, {
                                    i: 'widget2'
                                }, {
                                    i: 'widget3'
                                }]
                            },
                            widget: {
                                widgetType: "map",
                                id: "widget3",
                                layer: {
                                    name: "layername"
                                }
                            }
                        },
                        collapsed: {
                            'widget2': {
                                layout: [{
                                    i: 'widget2'
                                }],
                                layouts: {
                                    xxs: [{
                                        i: 'widget2'
                                    }]
                                }
                            }
                        },
                        widgets: [{
                            widgetType: "table",
                            id: "widget1"
                        }, {
                            widgetType: "table",
                            id: "widget2",
                            layer: {
                                name: "layername"
                            }
                        },
                        {
                            widgetType: "map",
                            id: "widget3",
                            layer: {
                                name: "layername"
                            }
                        }],
                        layout: [{
                            i: 'widget3'
                        }],
                        layouts: {
                            xxs: [{
                                i: 'widget3'
                            }]
                        }
                    }
                }
            }
        };
        const result = getVisibleFloatingWidgets(state);
        expect(result).toExist();
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('widget3');
    });
    it('getVisibleFloatingWidgets with no collapsed or maximized', () => {
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        widgets: [{
                            widgetType: "table",
                            id: "widget1"
                        }, {
                            widgetType: "table",
                            id: "widget2",
                            layer: {
                                name: "layername"
                            }
                        },
                        {
                            widgetType: "map",
                            id: "widget3",
                            layer: {
                                name: "layername"
                            }
                        }],
                        layout: [{
                            i: 'widget1'
                        }, {
                            i: 'widget2'
                        }, {
                            i: 'widget3'
                        }],
                        layouts: {
                            xxs: [{
                                i: 'widget1'
                            }, {
                                i: 'widget2'
                            }, {
                                i: 'widget3'
                            }]
                        }
                    }
                }
            }
        };
        const result = getVisibleFloatingWidgets(state);
        expect(result).toExist();
        expect(result.length).toBe(3);
        expect(result[0].id).toBe('widget1');
        expect(result[1].id).toBe('widget2');
        expect(result[2].id).toBe('widget3');
    });
    it('getWidgetFilterKey without chart', () => {
        const state = set("widgets.builder.editor", { widgetType: "table" }, {});
        expect(getWidgetFilterKey(state)).toBe("filter");
    });
    it('getWidgetFilterKey with chart', () => {
        const state = set("widgets.builder.editor", { widgetType: "chart", selectedChartId: "chart-01", charts: [{ chartId: 'chart-01', traces: [{ id: 'trace-01' }] }] }, {});
        expect(getWidgetFilterKey(state)).toBe("charts[chart-01].traces[trace-01].filter");
    });
    it('getWidgetInteractionTreeGenerated without editing widget', () => {
        const state = set(`widgets.containers[${DEFAULT_TARGET}].widgets`, [
            { id: 'widget1', widgetType: 'table', title: 'Table Widget' },
            { id: 'widget2', widgetType: 'counter', title: 'Counter Widget' }
        ], {
            layers: {
                flat: [
                    { id: 'layer1', name: 'layer1', title: 'Layer 1' }
                ]
            }
        });
        const result = getWidgetInteractionTreeGenerated(state);
        expect(result).toExist();
        expect(result.id).toBe('root');
        expect(result.children).toExist();
        const widgetsCollection = result.children.find(c => c.id === 'widgets');
        expect(widgetsCollection).toExist();
        expect(widgetsCollection.children.length).toBe(2);
        const mapCollection = result.children.find(c => c.id === "map");
        expect(mapCollection).toExist();
        expect(mapCollection.children.map(c => c.id)).toEqual(['layers', 'applyZoomTo', 'applyZoomToFeature']);
    });
    it('getWidgetInteractionTreeGenerated with filter widget as editing widget', () => {
        const state = set(`widgets.builder.editor`, {
            id: 'widget2',
            widgetType: 'filter',
            title: 'Editing Filter Widget',
            filters: [{
                id: 'filter-1',
                label: 'Filter 1',
                title: 'First Filter',
                data: {
                    layer: { id: 'layer1', name: 'layer1' }
                }
            }],
            selectedFilterId: 'filter-1'
        }, set(`widgets.containers[${DEFAULT_TARGET}].widgets`, [
            { id: 'widget2', widgetType: 'counter', title: 'Counter Widget' }
        ]));
        const result = getWidgetInteractionTreeGenerated(state);
        expect(result).toExist();
        expect(result.id).toBe('root');
        const widgetsCollection = result.children.find(c => c.id === 'widgets');
        expect(widgetsCollection).toExist();
        expect(widgetsCollection.children.length).toBe(1);
        const editingWidget = widgetsCollection.children.find(w => w.id === 'widget2');
        expect(editingWidget).toExist();
    });
    it('shouldSkipInteraction lets the main map timeline time reach chart axes while the timeline is active', () => {
        const state = {
            widgets: {
                containers: {
                    [DEFAULT_TARGET]: {
                        widgets: [{ id: 'chart-1', widgetType: 'chart', charts: [{ chartId: 'c1', xAxisOpts: [{ id: 0, type: 'date' }], traces: [{ id: 't1' }] }] }]
                    }
                }
            }
        };
        const axisInteraction = (sourceNodePath) => ({
            targetType: 'applyDimension',
            source: { nodePath: sourceNodePath },
            target: { nodePath: 'widgets[chart-1].charts[c1].traces[t1].xAxisOpts[0].appliedCurrentTime' }
        });
        expect(shouldSkipInteraction(axisInteraction('widgets[map].maps[main]'), state)).toBe(false);
        expect(shouldSkipInteraction(axisInteraction('widgets[filter-1].filters[f1]'), state)).toBe(true);
    });
    it('isTimelineEnabledForInteractions', () => {
        expect(isTimelineEnabledForInteractions({})).toBe(true);
        expect(isTimelineEnabledForInteractions({
            context: {
                currentContext: {
                    plugins: {
                        desktop: []
                    }
                }
            }
        })).toBe(false);
        expect(isTimelineEnabledForInteractions({
            dashboard: {
                editing: true
            }
        })).toBe(false);
    });
    describe('inactiveInteractionIdsForWidgetSelector', () => {
        const getChartAxisInteractionState = ({ axisType = 'date', includeAxis = true } = {}) => ({
            context: {
                currentContext: {
                    plugins: {
                        desktop: []
                    }
                }
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: [{
                            id: 'filter-widget',
                            widgetType: 'filter',
                            interactions: [{
                                id: 'chart-axis-time-interaction',
                                source: {
                                    nodePath: 'widgets[filter-widget].filters[filter-1]'
                                },
                                target: {
                                    nodePath: 'widgets[chart-widget].charts[chart-1].traces[trace-1].xAxisOpts[0].appliedCurrentTime',
                                    metaData: {
                                        dimension: 'time'
                                    }
                                },
                                plugged: true,
                                targetType: 'applyDimension'
                            }]
                        }, {
                            id: 'chart-widget',
                            widgetType: 'chart',
                            charts: [{
                                chartId: 'chart-1',
                                traces: [{ id: 'trace-1', type: 'bar' }],
                                ...(includeAxis ? {
                                    xAxisOpts: [{ id: 0, type: axisType }]
                                } : {})
                            }]
                        }]
                    }
                }
            }
        });

        it('does not mark plugged chart axis time interactions of date axes inactive', () => {
            expect(inactiveInteractionIdsForWidgetSelector(
                getChartAxisInteractionState(),
                'filter-widget'
            )).toEqual([]);
        });

        it('marks plugged chart axis time interactions inactive when axis is not date type', () => {
            expect(inactiveInteractionIdsForWidgetSelector(
                getChartAxisInteractionState({ axisType: 'linear' }),
                'filter-widget'
            )).toEqual(['chart-axis-time-interaction']);
        });

        it('marks plugged chart axis time interactions inactive when default axis options are missing', () => {
            expect(inactiveInteractionIdsForWidgetSelector(
                getChartAxisInteractionState({ includeAxis: false }),
                'filter-widget'
            )).toEqual(['chart-axis-time-interaction']);
        });
    });
    it('interactionTargetVisibilitySelector', () => {

        const tests = [
            {
                path: `widgets[53b5cfc0-fac9-11f0-b714-1b62e8a515ce]`
            },
            {
                path: 'widgets[746e1fb0-fac9-11f0-b714-1b62e8a515ce]'
            }, {
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce]'
            }
        ];
        const map = interactionsNodesSelector(STATE_INTERACTION_MAP_1);
        tests.forEach(({path}) => {
            expect(map.get(path)).toExist();
        });
    });
    it('interactionsNodesSelector should resolve layer dimension target to layer object when param value exists', () => {
        const path = 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce].params.time';
        const stateWithTimeDimension = set(
            'layers.flat[0].params.time',
            '2026-05-13T00:00:00.000Z',
            set('layers.flat[0].dimensions', [{ name: 'time' }], STATE_INTERACTION_MAP_1)
        );
        const state = set('widgets.containers.floating.widgets[0].interactions[0].target.nodePath', path, stateWithTimeDimension);
        const map = interactionsNodesSelector(state);
        expect(map.get(path)?.id).toBe('test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce');
    });
    describe("interactionTargetVisibilitySelector", () => {
        const tests = [
            // MAP
            {
                state: STATE_INTERACTION_MAP_1,
                name: "check widget visibility true",
                path: 'widgets[746e1fb0-fac9-11f0-b714-1b62e8a515ce]',
                expected: true
            }, {
                state: STATE_INTERACTION_MAP_1,
                name: "check layer visibility true",
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce]',
                expected: true
            }, {
                state: set('layers.flat[0].visibility', false, STATE_INTERACTION_MAP_1),
                name: "check layer visibility set to false",
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce]',
                expected: false
            }, {
                state: set('layers.groups[0].visibility', false, STATE_INTERACTION_MAP_1),
                name: "check layer visibility with group visibility set to false",
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce]',
                expected: false
            }, {
                state: set('layers.flat[0].dimensions', [{ name: 'elevation' }], STATE_INTERACTION_MAP_1),
                name: "check main map layer dimension visibility from parent layer",
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce].params.elevation',
                expected: true
            }, {
                state: set('layers.flat[0].visibility', false, set('layers.flat[0].dimensions', [{ name: 'elevation' }], STATE_INTERACTION_MAP_1)),
                name: "check main map layer dimension visibility false when parent layer is hidden",
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce].params.elevation',
                expected: false
            }, {
                state: set(
                    'widgets.containers.floating.widgets[0].interactions[0].target.nodePath',
                    'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce].params.time',
                    set('layers.flat[0].params.time', '2026-05-13T00:00:00.000Z', set('layers.flat[0].dimensions', [{ name: 'time' }], STATE_INTERACTION_MAP_1))
                ),
                name: "check main map layer time dimension visibility when param value exists",
                path: 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce].params.time',
                expected: true
            }, {
                state: set('widgets.containers.floating.collapsed["746e1fb0-fac9-11f0-b714-1b62e8a515ce"]', {
                    "layout": {
                        "w": 2,
                        "h": 2,
                        "x": 2,
                        "y": 2,
                        "i": "746e1fb0-fac9-11f0-b714-1b62e8a515ce",
                        "moved": false,
                        "static": false
                    },
                    "layouts": {
                        "md": {
                            "w": 2,
                            "h": 2,
                            "x": 2,
                            "y": 2,
                            "i": "746e1fb0-fac9-11f0-b714-1b62e8a515ce",
                            "moved": false,
                            "static": false
                        }
                    }
                }, STATE_INTERACTION_MAP_1),
                name: "check widget visibility with widget collapsed",
                path: 'widgets[746e1fb0-fac9-11f0-b714-1b62e8a515ce]',
                expected: false
            },
            // DASHBOARD
            {
                state: STATE_INTERACTION_DASH_1,
                path: 'widgets[5640f860-fad2-11f0-9e1f-7900d8be1f6f].maps[5917e620-fad2-11f0-9e1f-7900d8be1f6f].layers[test:states_training__5e262640-fad2-11f0-9e1f-7900d8be1f6f]',
                name: "dashboard visibility of map layers",
                expected: true
            }, {
                state: set('widgets.containers.floating.widgets[1].maps[0].layers[0].visibility', false, STATE_INTERACTION_DASH_1),
                path: 'widgets[5640f860-fad2-11f0-9e1f-7900d8be1f6f].maps[5917e620-fad2-11f0-9e1f-7900d8be1f6f].layers[test:states_training__5e262640-fad2-11f0-9e1f-7900d8be1f6f]',
                name: "dashboard visibility of map layers in map layers when LAYER has visibility false",
                expected: false
            },
            {
                state: set('widgets.containers.floating.widgets[1].maps[0].groups[0].visibility', false, STATE_INTERACTION_DASH_1),
                path: 'widgets[5640f860-fad2-11f0-9e1f-7900d8be1f6f].maps[5917e620-fad2-11f0-9e1f-7900d8be1f6f].layers[test:states_training__5e262640-fad2-11f0-9e1f-7900d8be1f6f]',
                name: "dashboard visibility of map layers in map layers when GROUP has visibility false",
                expected: false
            },
            {
                state: set('widgets.containers.floating.widgets[1].maps[0].layers[0].dimensions', [{ name: 'elevation' }], STATE_INTERACTION_DASH_1),
                path: 'widgets[5640f860-fad2-11f0-9e1f-7900d8be1f6f].maps[5917e620-fad2-11f0-9e1f-7900d8be1f6f].layers[test:states_training__5e262640-fad2-11f0-9e1f-7900d8be1f6f].params.elevation',
                name: "dashboard visibility of map layer dimension from parent layer",
                expected: true
            },
            {
                state: set('widgets.containers.floating.widgets[1].maps[0].layers[0].visibility', false, set('widgets.containers.floating.widgets[1].maps[0].layers[0].dimensions', [{ name: 'elevation' }], STATE_INTERACTION_DASH_1)),
                path: 'widgets[5640f860-fad2-11f0-9e1f-7900d8be1f6f].maps[5917e620-fad2-11f0-9e1f-7900d8be1f6f].layers[test:states_training__5e262640-fad2-11f0-9e1f-7900d8be1f6f].params.elevation',
                name: "dashboard visibility of map layer dimension false when parent layer is hidden",
                expected: false
            }
        ];
        tests.forEach(({state, name, path, expected}) => {
            it(name, () => {
                const result = interactionTargetVisibilitySelector(state);
                expect(result[path]).toEqual(expected);
            });
        });
    });

    describe('interactionTargetsFilterDisabledSelector', () => {
        const layerPath = 'map.layers[test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce]';

        it('returns false for layer path when layerFilter.disabled is not set', () => {
            const result = interactionTargetsFilterDisabledSelector(STATE_INTERACTION_MAP_1);
            expect(result[layerPath]).toBe(false);
        });

        it('returns true for layer path when layerFilter.disabled is true', () => {
            const state = set('layers.flat[0].layerFilter', { filters: [], disabled: true }, STATE_INTERACTION_MAP_1);
            const result = interactionTargetsFilterDisabledSelector(state);
            expect(result[layerPath]).toBe(true);
        });

        it('returns false for layer path when layerFilter.disabled is false', () => {
            const state = set('layers.flat[0].layerFilter', { filters: [], disabled: false }, STATE_INTERACTION_MAP_1);
            const result = interactionTargetsFilterDisabledSelector(state);
            expect(result[layerPath]).toBe(false);
        });
    });

    describe('getApplyStyleOutOfSyncForFilterWidget', () => {
        const widgetId = '53b5cfc0-fac9-11f0-b714-1b62e8a515ce';
        const filterId = '54955a50-fac9-11f0-b714-1b62e8a515ce';
        const layerId = 'test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce';

        it('returns empty object when style matches (in sync)', () => {
            const state = set('layers.flat[0].style', 'ExpectedStyle', STATE_INTERACTION_MAP_1);
            const stateWithStyleFilter = set(`widgets.containers.floating.widgets[0].filters[0].data.userDefinedItems`, [
                { id: 'style-item-1', style: { name: 'ExpectedStyle' } }
            ], state);
            const stateWithSelection = set(`widgets.containers.floating.widgets[0].selections.${filterId}`, ['style-item-1'], stateWithStyleFilter);
            const applyStyleInteraction = {
                id: 'apply-style-1',
                plugged: true,
                targetType: 'applyStyle',
                source: { nodePath: `widgets[${widgetId}].filters[${filterId}]` },
                target: { nodePath: `map.layers[${layerId}]` }
            };
            const existingInteractions = get(stateWithSelection, 'widgets.containers.floating.widgets[0].interactions') || [];
            const stateWithInteraction = set('widgets.containers.floating.widgets[0].interactions', [...existingInteractions, applyStyleInteraction], stateWithSelection);
            expect(getApplyStyleOutOfSyncForFilterWidget(stateWithInteraction, widgetId)).toEqual({});
        });

        it('returns showBanner when style is out of sync', () => {
            const state = set('layers.flat[0].style', 'CurrentLayerStyle', STATE_INTERACTION_MAP_1);
            const stateWithStyleFilter = set(`widgets.containers.floating.widgets[0].filters[0].data.userDefinedItems`, [
                { id: 'style-item-1', style: { name: 'ExpectedStyle' } }
            ], state);
            const stateWithSelection = set(`widgets.containers.floating.widgets[0].selections.${filterId}`, ['style-item-1'], stateWithStyleFilter);
            const applyStyleInteraction = {
                id: 'apply-style-1',
                plugged: true,
                targetType: 'applyStyle',
                source: { nodePath: `widgets[${widgetId}].filters[${filterId}]` },
                target: { nodePath: `map.layers[${layerId}]` }
            };
            const existingInteractions = get(stateWithSelection, 'widgets.containers.floating.widgets[0].interactions') || [];
            const stateWithInteraction = set('widgets.containers.floating.widgets[0].interactions', [...existingInteractions, applyStyleInteraction], stateWithSelection);
            const result = getApplyStyleOutOfSyncForFilterWidget(stateWithInteraction, widgetId);
            expect(result[filterId]).toExist();
            expect(result[filterId].showBanner).toBe(true);
            expect(result[filterId].actionParams).toEqual({ widgetId, filterId, target: 'floating' });
        });
    });

    describe('getApplyDimensionOutOfSyncForFilterWidget', () => {
        const widgetId = '53b5cfc0-fac9-11f0-b714-1b62e8a515ce';
        const filterId = '54955a50-fac9-11f0-b714-1b62e8a515ce';
        const layerId = 'test:states_training__51824df0-fac9-11f0-b714-1b62e8a515ce';

        it('returns empty object when layer elevation matches selected value', () => {
            const state = set('layers.flat[0].params.elevation', '100', STATE_INTERACTION_MAP_1);
            const stateWithSelection = set(`widgets.containers.floating.widgets[0].selections.${filterId}`, ['100'], state);
            const applyDimensionInteraction = {
                id: 'apply-dimension-1',
                plugged: true,
                targetType: 'applyDimension',
                source: { nodePath: `widgets[${widgetId}].filters[${filterId}]` },
                target: {
                    nodePath: `map.layers[${layerId}].params.elevation`,
                    metaData: { dimension: 'elevation' }
                }
            };
            const existingInteractions = get(stateWithSelection, 'widgets.containers.floating.widgets[0].interactions') || [];
            const stateWithInteraction = set('widgets.containers.floating.widgets[0].interactions', [...existingInteractions, applyDimensionInteraction], stateWithSelection);
            expect(getApplyDimensionOutOfSyncForFilterWidget(stateWithInteraction, widgetId)).toEqual({});
        });

        it('returns showBanner when layer time is out of sync', () => {
            const state = set('layers.flat[0].params.time', '2020-01-01T00:00:00.000Z', STATE_INTERACTION_MAP_1);
            const stateWithSelection = set(`widgets.containers.floating.widgets[0].selections.${filterId}`, ['2021-01-01T00:00:00.000Z'], state);
            const applyDimensionInteraction = {
                id: 'apply-dimension-1',
                plugged: true,
                targetType: 'applyDimension',
                source: { nodePath: `widgets[${widgetId}].filters[${filterId}]` },
                target: {
                    nodePath: `map.layers[${layerId}].params.time`,
                    metaData: { dimension: 'time' }
                }
            };
            const existingInteractions = get(stateWithSelection, 'widgets.containers.floating.widgets[0].interactions') || [];
            const stateWithInteraction = set('widgets.containers.floating.widgets[0].interactions', [...existingInteractions, applyDimensionInteraction], stateWithSelection);
            const stateWithTimelineUnavailable = set('context.currentContext.plugins.desktop', [], stateWithInteraction);
            const result = getApplyDimensionOutOfSyncForFilterWidget(stateWithTimelineUnavailable, widgetId);
            expect(result[filterId]).toExist();
            expect(result[filterId].showBanner).toBe(true);
            expect(result[filterId].actionParams).toEqual({ widgetId, filterId, target: 'floating' });
        });
    });
});
