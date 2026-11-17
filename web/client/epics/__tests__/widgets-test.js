/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import { testEpic, addTimeoutEpic, TEST_TIMEOUT } from './epicTestUtils';

import {
    clearWidgetsOnLocationChange,
    updateLayerOnLayerPropertiesChange,
    updateLayerOnLoadingErrorChange,
    onWidgetCreationFromMap,
    onMapEditorOpenEpic,
    onOpenFilterEditorEpic
} from '../widgets';

import {
    CLEAR_WIDGETS,
    UPDATE_LAYER,
    EDITOR_CHANGE,
    onEditorChange,
    UPDATE_PROPERTY,
    openFilterEditor
} from '../../actions/widgets';

import { configureMap } from '../../actions/config';
import { changeLayerProperties, layerLoad, layerError, updateNode } from '../../actions/layers';
import { onLocationChanged } from 'connected-react-router';
import { ActionsObservable } from 'redux-observable';
import Rx from 'rxjs';
import { HIDE, save } from '../../actions/mapEditor';
import { CHANGE_MAP_EDITOR } from '../../actions/queryform';

describe('widgets Epics', () => {
    it('onOpenFilterEditorEpic initializes the spatial filter map from the layer bbox', (done) => {
        const state = {
            widgets: {
                builder: {
                    editor: {
                        layer: {
                            bbox: {
                                crs: 'EPSG:4326',
                                bounds: {
                                    minx: -124,
                                    miny: 24,
                                    maxx: -66,
                                    maxy: 49
                                }
                            }
                        }
                    }
                }
            }
        };
        testEpic(onOpenFilterEditorEpic, 1, openFilterEditor(), ([action]) => {
            expect(action.type).toBe(CHANGE_MAP_EDITOR);
            expect(action.mapData.center).toEqual({
                crs: 'EPSG:4326',
                x: -95,
                y: 36.5
            });
            expect(action.mapData.zoom).toBeA('number');
        }, state, done);
    });

    it('onOpenFilterEditorEpic does not fail when the layer bbox is missing', (done) => {
        const state = {
            widgets: {
                builder: {
                    editor: {
                        layer: {
                            type: 'wfs'
                        }
                    }
                }
            }
        };
        testEpic(onOpenFilterEditorEpic, 1, openFilterEditor(), ([action]) => {
            expect(action.type).toBe(CHANGE_MAP_EDITOR);
            expect(action.mapData).toBe(null);
        }, state, done);
    });

    it('clearWidgetsOnLocationChange triggers CLEAR_WIDGETS on LOCATION_CHANGE', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            const action = actions[0];
            expect(action.type).toBe(CLEAR_WIDGETS);
            done();
        };
        let count = 0;
        testEpic(clearWidgetsOnLocationChange,
            1,
            [configureMap(), onLocationChanged({
                pathname: "newPath"
            })],
            checkActions,
            () => {
                return count++
                    ? {
                        router: {
                            location: { pathname: "new/3012"}
                        }
                    }
                    : {
                        router: {
                            location: { pathname: "old/2013"}
                        }
                    };
            });
    });
    it('clearWidgetsOnLocationChange does not trigger CLEAR_WIDGETS on replace location', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            const action = actions[0];
            expect(action.type).toBe(TEST_TIMEOUT);
            done();
        };
        testEpic(addTimeoutEpic(clearWidgetsOnLocationChange, 20),
            1,
            [configureMap(), onLocationChanged({
                pathname: "newPath"
            }, 'REPLACE')],
            checkActions);
    });


    it('changeLayerPropertiesEpic triggers updateWidgetLayer on filterLayer change', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(UPDATE_LAYER);
            expect(actions[0].layer).toEqual({
                id: "1",
                name: "layer"
            });
            done();
        };
        testEpic(updateLayerOnLayerPropertiesChange,
            1,
            [changeLayerProperties(
                "1",
                {layerFilter: {rowId: 1567705038414}}
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        filterLayer: {rowId: 1567705038414}
                    }, {
                        id: "3",
                        name: "layer3"
                    }]
                }
            });
    });
    it('changeLayerPropertiesEpic triggers updateWidgetLayer on fields change', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(UPDATE_LAYER);
            expect(actions[0].layer).toEqual({
                id: "1",
                name: "layer"
            });
            done();
        };
        testEpic(updateLayerOnLayerPropertiesChange,
            1,
            [changeLayerProperties(
                "1",
                {fields: [{name: "field1", type: "string", alias: "Field 1"}]}
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        fields: [{name: "field1", type: "string", alias: "Field 1"}]
                    }, {
                        id: "3",
                        name: "layer3"
                    }]
                }
            });
    });
    it('changeLayerPropertiesEpic does not triger updateWidgetLayer on visibility change', (done) => {
        const action = changeLayerProperties("1", {visibility: false});
        const state = {
            layers: {
                flat: [{
                    id: "1",
                    name: "layer"
                }, {
                    id: "2",
                    name: "layer2",
                    filterLayer: {rowId: 1567705038414}
                }, {
                    id: "3",
                    name: "layer3"
                }]
            }
        };
        const checkActions = actions => {
            expect(actions.length).toBe(0);
            done();
        };
        updateLayerOnLayerPropertiesChange(new ActionsObservable(Rx.Observable.of(action)), {getState: () => state})
            .toArray()
            .subscribe(checkActions);
    });
    it('updateNode triggers updateWidgetLayer on filterLayer change', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(UPDATE_LAYER);
            expect(actions[0].layer).toEqual({
                id: "1",
                name: "layer"
            });
            done();
        };
        testEpic(updateLayerOnLayerPropertiesChange,
            1,
            [updateNode(
                "1",
                "layers",
                {layerFilter: {rowId: 1567705038414}}
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        filterLayer: {rowId: 1567705038414}
                    }, {
                        id: "3",
                        name: "layer3"
                    }]
                }
            });
    });
    it('updateNode does not trigger updateWidgetLayer layer property change', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(TEST_TIMEOUT);
            done();
        };
        testEpic(addTimeoutEpic(updateLayerOnLayerPropertiesChange, 0),
            1,
            [updateNode(
                "1",
                "layers",
                {filter: {rowId: 1567705038414}}
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        filterLayer: {rowId: 1567705038414}
                    }]
                }
            });
    });
    it('updateNode does not trigger updateWidgetLayer group property change', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(TEST_TIMEOUT);
            done();
        };
        testEpic(addTimeoutEpic(updateLayerOnLayerPropertiesChange, 0),
            1,
            [updateNode(
                "1",
                "groups",
                {test: "some"}
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        filterLayer: {rowId: 1567705038414}
                    }]
                }
            });
    });
    it('updateLayerOnLoadingErrorChange triggers updateWidgetLayer on LAYER_LOAD error', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(UPDATE_LAYER);
            expect(actions[0].layer).toEqual({
                id: "2",
                name: "layer2",
                loadingError: "Error"
            });
            done();
        };
        testEpic(updateLayerOnLoadingErrorChange,
            1,
            [layerLoad(
                "2",
                "Error"
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        loadingError: "Error"
                    }, {
                        id: "3",
                        name: "layer3"
                    }]
                }
            });
    });
    it('updateLayerOnLoadingErrorChange triggers updateWidgetLayer on LAYER_ERROR error', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(UPDATE_LAYER);
            expect(actions[0].layer).toEqual({
                id: "2",
                name: "layer2",
                loadingError: "Error"
            });
            done();
        };
        testEpic(updateLayerOnLoadingErrorChange,
            1,
            [layerError(
                "2",
                10,
                10
            )],
            checkActions,
            {
                layers: {
                    flat: [{
                        id: "1",
                        name: "layer"
                    }, {
                        id: "2",
                        name: "layer2",
                        loadingError: "Error"
                    }, {
                        id: "3",
                        name: "layer3"
                    }]
                }
            });
    });
    it('updateLayerOnLoadingErrorChange does not trigger updateWidgetLayer if loadingError does not change', (done) => {
        const action = layerLoad("3", "Error");
        const state = {
            layers: {
                flat: [{
                    id: "1",
                    name: "layer"
                }, {
                    id: "2",
                    name: "layer2",
                    loadingError: "Error"
                }, {
                    id: "3",
                    name: "layer3",
                    previousLoadingError: "Error",
                    loadingError: "Error"
                }]
            }
        };
        const checkActions = actions => {
            expect(actions.length).toBe(0);
            done();
        };
        updateLayerOnLoadingErrorChange(new ActionsObservable(Rx.Observable.of(action)), {getState: () => state})
            .toArray()
            .subscribe(checkActions);
    });

    it('onWidgetCreationFromMap', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(1);
            expect(actions[0].type).toBe(EDITOR_CHANGE);
            expect(actions[0].key).toBe("chart-layers");
            expect(actions[0].value).toEqual([{id: "1", name: "layer"}]);
            done();
        };
        const state = {
            layers: {
                flat: [{
                    id: "1",
                    name: "layer"
                }, {
                    id: "2",
                    name: "layer2"
                }, {
                    id: "3",
                    name: "layer3"
                }],
                selected: ["1"]
            },
            dashboard: {
                editor: {
                    available: false
                },
                editing: false
            }
        };
        testEpic(onWidgetCreationFromMap,
            1,
            [onEditorChange("widgetType", "chart")],
            checkActions, state);
    });
    it('onMapEditorOpenEpic triggers updateWidgetProperty and hide on SAVE with widgetId', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(2);
            expect(actions[0].type).toBe(UPDATE_PROPERTY);
            expect(actions[0].id).toBe("widget-123");
            expect(actions[0].key).toBe("maps");
            expect(actions[0].value).toEqual({
                widgetId: "widget-123",
                mapId: "map-456",
                layers: ["layer1", "layer2"],
                center: { x: 0, y: 0, crs: "EPSG:4326" },
                zoom: 5
            });
            expect(actions[0].mode).toBe("merge");
            expect(actions[1].type).toBe(HIDE);
            expect(actions[1].owner).toBe("widgetInlineEditor");
            done();
        };
        const mapData = {
            widgetId: "widget-123",
            mapId: "map-456",
            layers: ["layer1", "layer2"],
            center: { x: 0, y: 0, crs: "EPSG:4326" },
            zoom: 5
        };
        testEpic(onMapEditorOpenEpic,
            2,
            [save(mapData, "widgetInlineEditor")],
            checkActions);
    });
    it('onMapEditorOpenEpic does not trigger actions when map has no widgetId', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(0);
            done();
        };
        const mapData = {
            mapId: "map-456",
            layers: ["layer1", "layer2"],
            center: { x: 0, y: 0, crs: "EPSG:4326" },
            zoom: 5
        };
        testEpic(onMapEditorOpenEpic,
            0,
            [save(mapData, "widgetInlineEditor")],
            checkActions);
    });
    it('onMapEditorOpenEpic does not trigger actions when map is undefined', (done) => {
        const checkActions = actions => {
            expect(actions.length).toBe(0);
            done();
        };
        testEpic(onMapEditorOpenEpic,
            0,
            [save(undefined, "widgetInlineEditor")],
            checkActions);
    });
});
