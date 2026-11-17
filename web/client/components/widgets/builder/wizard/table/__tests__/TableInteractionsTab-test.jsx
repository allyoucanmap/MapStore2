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
import { Provider } from 'react-redux';

import TableInteractionsTab from '../TableInteractionsTab';

const LAYER = { id: 'layer-1', name: 'topp:states', url: '/geoserver/wms' };
const TABLE = { id: 'table-1', widgetType: 'table', title: 'States Table', layer: LAYER };
const COUNTER = { id: 'counter-1', widgetType: 'counter', title: 'Land Counter', layer: LAYER };

const makeStore = (state) => ({
    subscribe: () => {},
    dispatch: () => {},
    getState: () => state
});

const renderTab = (props) => ReactDOM.render(
    <Provider store={makeStore({
        dashboard: { editing: true },
        widgets: {
            builder: { editor: TABLE },
            containers: { floating: { widgets: [TABLE, COUNTER] } }
        }
    })}>
        <TableInteractionsTab data={TABLE} layer={LAYER} {...props} />
    </Provider>,
    document.getElementById('container')
);

describe('TableInteractionsTab component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('renders the column filter, zoom to filtered bounds and zoom to feature sections with the other widgets as targets', () => {
        renderTab();
        const container = document.getElementById('container');
        expect(container.querySelector('.ms-table-wizard-interactions-tab')).toBeTruthy();
        expect(container.querySelectorAll('.ms-interactions-container').length).toBe(3);
        expect(container.textContent).toContain('Land Counter');
    });
    it('does not list the table itself as a target', () => {
        renderTab();
        expect(document.getElementById('container').textContent).toNotContain('States Table');
    });
});
