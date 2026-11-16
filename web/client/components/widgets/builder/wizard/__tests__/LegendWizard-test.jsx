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

import LegendWizard from '../LegendWizard';

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
}];
const LEGEND_MAP = { widgetId: 'map-w', mapId: 'm1', map: { layers: LAYERS } };

describe('LegendWizard component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('LegendWizard rendering with defaults shows the empty state', () => {
        ReactDOM.render(<LegendWizard />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container.querySelector('.ms-wizard')).toBeTruthy();
        expect(container.querySelector('.empty-state-container')).toBeTruthy();
    });

    it('LegendWizard shows the layers of the controlled map in the preview', () => {
        ReactDOM.render(<LegendWizard legendMap={LEGEND_MAP} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container.querySelector('.legend-preview-container')).toBeTruthy();
        expect(container.querySelector('.ms-layers-tree')).toBeTruthy();
        expect(container.querySelector('.empty-state-container')).toBeFalsy();
    });

    it('LegendWizard shows options and interactions tabs, options by default', () => {
        ReactDOM.render(<LegendWizard legendMap={LEGEND_MAP} />, document.getElementById("container"));
        const container = document.getElementById('container');
        const tabs = container.querySelectorAll('.nav-tabs li');
        expect(tabs.length).toBe(2);
        expect(tabs[0].className).toContain('active');
        expect(container.querySelector('.ms-legend-wizard-interactions-tab')).toBeFalsy();
    });

    it('LegendWizard rendering WidgetOptions', () => {
        ReactDOM.render(<LegendWizard step={1} />, document.getElementById("container"));
        expect(document.getElementById('container').querySelector('.widget-options-form')).toBeTruthy();
    });
});
