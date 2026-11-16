/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';

import WidgetTypeSelector from '../WidgetTypeSelector';

describe('WidgetTypeSelector component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('shows the main map interactions in their own section, separated from the widget types', () => {
        let selected;
        ReactDOM.render(<WidgetTypeSelector onSelect={type => { selected = type; }} />, document.getElementById('container'));
        const container = document.getElementById('container');
        const mapSection = container.querySelector('.ms-widget-selector-map-section');
        const widgetsSection = container.querySelector('.ms-widget-selector-widgets-section');
        expect(mapSection.querySelectorAll('li').length).toBe(1);
        expect(widgetsSection.querySelectorAll('li').length).toBe(7);
        Simulate.click(mapSection.querySelector('li'));
        expect(selected).toBe('mainMap');
    });
    it('shows a plain list without sections when the main map is not available', () => {
        ReactDOM.render(<WidgetTypeSelector typeFilter={({ type }) => type !== 'mainMap'} />, document.getElementById('container'));
        const container = document.getElementById('container');
        expect(container.querySelector('.ms-widget-selector-section')).toBeFalsy();
        expect(container.querySelectorAll('li').length).toBe(7);
    });
});
