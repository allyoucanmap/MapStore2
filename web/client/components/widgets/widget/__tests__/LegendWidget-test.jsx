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
import ReactTestUtils from 'react-dom/test-utils';
import {compose, defaultProps} from 'recompose';

import legendWidget from '../../enhancers/legendWidget';
import LegendWidgetComp from '../LegendWidget';

const LegendWidget = compose(
    defaultProps({canEdit: true}),
    legendWidget
)(LegendWidgetComp);

describe('LegendWidget component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('LegendWidget rendering with defaults', () => {
        ReactDOM.render(<LegendWidget />, document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.mapstore-widget-card');
        expect(el).toExist();
        expect(container.querySelector('.glyphicon-pencil')).toExist();
        expect(container.querySelector('.glyphicon-trash')).toExist();
    });
    it('view only mode', () => {
        ReactDOM.render(<LegendWidget canEdit={false} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container.querySelector('.glyphicon-pencil')).toNotExist();
        expect(container.querySelector('.glyphicon-trash')).toNotExist();
    });
    it('Test LegendWidget onEdit callback', () => {
        const actions = {
            onEdit: () => { }
        };
        const spyonEdit = expect.spyOn(actions, 'onEdit');
        ReactDOM.render(<LegendWidget onEdit={actions.onEdit} />, document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.glyphicon-pencil');
        ReactTestUtils.Simulate.click(el); // <-- trigger event callback
        expect(spyonEdit).toHaveBeenCalled();
    });
    it('LegendWidget rendering with the layers of the controlled map', () => {
        const LAYERS = [{
            id: 'layer:00',
            name: 'layer:00',
            title: 'Layer',
            visibility: true,
            type: 'wms'
        },
        {
            id: 'layer:01',
            name: 'layer:01',
            title: 'Layer:01',
            visibility: false,
            type: 'wms',
            opacity: 0.5
        }
        ];
        ReactDOM.render(<LegendWidget legendMap={{ widgetId: 'map-w', mapId: 'm1', map: { layers: LAYERS } }} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container.querySelector('.ms-layers-tree')).toBeTruthy();
        expect(container.querySelector('.empty-state-container')).toBeFalsy();
    });
    it('LegendWidget shows the empty state without controlled map', () => {
        ReactDOM.render(<LegendWidget />, document.getElementById("container"));
        expect(document.getElementById('container').querySelector('.empty-state-container')).toBeTruthy();
    });
    it('shows the empty state when no map is connected', () => {
        ReactDOM.render(<LegendWidgetComp id="legend-1" noMapConnected />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container.querySelector('.empty-state-container')).toBeTruthy();
        expect(container.querySelector('.ms-layers-tree')).toBeFalsy();
    });
    it('LegendWidget tools keep the widget updateProperty while the legend writes to its map', () => {
        const updateProperty = expect.createSpy();
        const legendMap = { widgetId: 'map-w', mapId: 'm1', map: { layers: [{ id: 'layer:00', name: 'layer:00', title: 'Layer', visibility: true, type: 'wms' }] } };
        ReactDOM.render(<LegendWidget id="legend-1" toolsOptions={{ showPin: true }} legendMap={legendMap} updateProperty={updateProperty} />, document.getElementById("container"));
        ReactTestUtils.Simulate.click(document.getElementById('container').querySelector('.glyphicon-pushpin'));
        expect(updateProperty).toHaveBeenCalledWith('legend-1', 'dataGrid.static', true);
    });
});
