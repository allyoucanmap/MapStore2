/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import {createSink} from 'recompose';

import tableWidget from '../tableWidget';

describe('widgets tableWidget enhancer', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('tableWidget onAddFilter', (done) => {
        const someFilter = { attribute: "state"};
        const Sink = tableWidget(createSink( props => {
            expect(props).toExist();
            expect(props.gridEvents).toExist();
            expect(props.gridEvents.onAddFilter).toExist();
            expect(props.gridEvents.onColumnResize).toExist();

            props.gridEvents.onAddFilter(someFilter);
            done();
        }));
        ReactDOM.render(<Sink updateProperty={(path, filter) => {
            expect(path).toBe("quickFilters.state");
            expect(filter).toBe(someFilter);
        }}/>, document.getElementById("container"));
    });

    it('tableWidget shows the row zoom and sends the clicked feature to its zoom to feature interactions', (done) => {
        const interactions = [{ id: 'zoom-feature', plugged: true, targetType: 'applyZoomToFeature' }];
        const onApplyWidgetInteractions = expect.createSpy();
        const Sink = tableWidget(createSink( props => {
            expect(props.gridTools.length).toEqual(1);
            props.gridTools[0].events.onClick({ bbox: [-10, 0, 0, -10] }, {}, "", { maxZoom: 10 })
                .then(() => {
                    const [widgetId, target, sourceId, event] = onApplyWidgetInteractions.calls[0].arguments;
                    expect([widgetId, target, sourceId]).toEqual(['123456', undefined, '123456']);
                    expect(event.targetTypes).toEqual(['applyZoomToFeature']);
                    expect(event.data.feature.bbox).toEqual([-10, 0, 0, -10]);
                    expect(event.data.crs).toBe('EPSG:4326');
                    expect(event.data.maxZoom).toBe(10);
                    done();
                })
                .catch(done);
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget id="123456" interactions={interactions} widgetType={"table"} isDashboardWidget updateProperty={() => {}} onApplyWidgetInteractions={onApplyWidgetInteractions} />, document.getElementById("container"));
    });
    it('tableWidget zooms the main map to the clicked feature in the map viewer', (done) => {
        const onZoomToExtent = expect.createSpy();
        const Sink = tableWidget(createSink( props => {
            props.gridTools[0].events.onClick({ bbox: [-10, 0, 0, -10] }, {}, "", { maxZoom: 10 })
                .then(() => {
                    expect(onZoomToExtent).toHaveBeenCalledWith([-10, 0, 0, -10], 'EPSG:4326', 10);
                    done();
                })
                .catch(done);
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget id="123456" widgetType={"table"} updateProperty={() => {}} onZoomToExtent={onZoomToExtent} />, document.getElementById("container"));
    });
    it('tableWidget hides the row zoom when the zoom to feature interaction is unplugged', (done) => {
        const interactions = [{ id: 'zoom-feature', plugged: false, targetType: 'applyZoomToFeature' }];
        const Sink = tableWidget(createSink( props => {
            expect(props.gridTools.length).toEqual(0);
            done();
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget id="123456" mapSync={false} interactions={interactions} widgetType={"table"} isDashboardWidget updateProperty={() => {}} />, document.getElementById("container"));
    });
    it('tableWidget with gridTools including zoom icon for dashboard viewer in case of just table is added [No maps added]', (done) => {
        const Sink = tableWidget(createSink( props => {
            expect(props).toExist();
            expect(props.gridTools.length).toEqual(0);
            done();
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget={"true"} id="123456" mapSync={false} widgetType={"table"} isDashboardWidget updateProperty={() => {}} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toExist();

    });
    it('tableWidget with gridTools including zoom icon for dashboard viewer [not enable zoom in config]', (done) => {
        const Sink = tableWidget(createSink( props => {
            expect(props).toExist();
            expect(props.gridTools.length).toEqual(0);
            done();
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget={false} id="123456" mapSync={"true"} widgetType={"table"} isDashboardWidget updateProperty={() => {}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toExist();

    });

    it('tableWidget with gridTools including zoom icon for dashboard viewer in case no connected map', (done) => {
        let widgets = [
            {
                widgetType: "table", id: "123456", mapSync: false
            }, {
                widgetType: 'map', id: "notConnectedMapID"
            }
        ];
        const Sink = tableWidget(createSink( props => {
            expect(props).toExist();
            expect(props.gridTools.length).toEqual(0);
            expect(props.widgets.length).toEqual(2);
            let mapWidgetsConnectedWithTbl = props.widgets.filter(i=>i.widgetType === 'map' && i?.dependenciesMap && i?.dependenciesMap?.mapSync?.includes(props.id) && i.mapSync) || [];
            expect(mapWidgetsConnectedWithTbl.length).toEqual(0);
            done();
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget={"true"} widgets={widgets} id="123456" mapSync={false} widgetType={"table"} isDashboardWidget updateProperty={() => {}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toExist();

    });
    it('tableWidget with gridTools including zoom icon for mapViewer [enable zoom in config]', (done) => {
        const Sink = tableWidget(createSink( props => {
            expect(props).toExist();
            expect(props.gridTools.length).toEqual(1);
            props.gridTools[0].events.onClick(
                {
                    bbox: [-10, 0, 0, -10]
                }, {}, "", { crs: "", maxZoom: null }
            );
            done();
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget={"true"} id="123456" widgetType={"table"} updateProperty={(id, path, value) => {
            expect(path).toBe("dependencies.extentObj");
            expect(id).toBe("123456");
            expect(value).toEqual({
                bbox: [-10, 0, 0, -10]
            }, { crs: "EPSG:4326", maxZoom: null });
        }} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toExist();

    });
    it('tableWidget with gridTools including zoom icon for mapViewer [not enable zoom in config]', (done) => {
        const Sink = tableWidget(createSink( props => {
            expect(props).toExist();
            expect(props.gridTools.length).toEqual(0);
            done();
        }));
        ReactDOM.render(<Sink enableZoomInTblWidget={false} id="123456" widgetType={"table"} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toExist();

    });
});
