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

import interactionFiltersToFilter, { getDatasetFilter } from '../interactionFiltersToFilter';

const layerFilter = {
    groupFields: [{ id: 1, logic: 'OR', index: 0 }],
    filterFields: [{ rowId: 1, groupId: 1, attribute: 'STATE_NAME', operator: '=', value: 'Arizona', type: 'string' }]
};
const ownFilter = {
    groupFields: [{ id: 1, logic: 'OR', index: 0 }],
    filterFields: [{ rowId: 1, groupId: 1, attribute: 'PERSONS', operator: '>', value: 1000, type: 'number' }]
};
const interactionFilters = [{ id: 'i1', format: 'logic', version: '1.0.0', logic: 'OR', filters: [{ format: 'cql', version: '1.0.0', body: "SUB_REGION = 'Mtn'" }], appliedFromWidget: 'table-1' }];

describe('interactionFiltersToFilter enhancer', () => {
    let received;
    const Sink = interactionFiltersToFilter((props) => {
        received = props;
        return <div />;
    });
    beforeEach((done) => {
        received = undefined;
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('getDatasetFilter combines layer, own and interaction filters', () => {
        const filter = getDatasetFilter({ layer: { layerFilter }, filter: ownFilter, interactionFilters });
        expect(filter).toContain('STATE_NAME');
        expect(filter).toContain('PERSONS');
        expect(filter).toContain('SUB_REGION');
    });
    it('getDatasetFilter ignores a disabled layer filter and returns undefined without filters', () => {
        expect(getDatasetFilter({ layer: { layerFilter: { ...layerFilter, disabled: true } } })).toBe(undefined);
        expect(getDatasetFilter({})).toBe(undefined);
    });
    it('sets the filter of the widget', () => {
        ReactDOM.render(<Sink layer={{ layerFilter }} interactionFilters={interactionFilters} />, document.getElementById('container'));
        expect(received.filter).toContain('STATE_NAME');
        expect(received.filter).toContain('SUB_REGION');
    });
    it('sets the filter of each chart trace, with the trace own interaction filters', () => {
        ReactDOM.render(<Sink traces={[{ id: 't1', filter: ownFilter }, { id: 't2', interactionFilters }]} />, document.getElementById('container'));
        expect(received.traces[0].filter).toContain('PERSONS');
        expect(received.traces[0].filter).toNotContain('SUB_REGION');
        expect(received.traces[1].filter).toContain('SUB_REGION');
    });
});
