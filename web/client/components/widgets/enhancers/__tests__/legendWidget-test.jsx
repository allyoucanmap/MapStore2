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

import { getLegendViewProps, mergeLegendLayerChanges, withLegendMapData } from '../legendWidget';

const MAP = {
    zoom: 4,
    projection: 'EPSG:3857',
    bbox: { crs: 'EPSG:3857' },
    groups: [{ id: 'hidden', visibility: false }],
    layers: [
        { id: 'osm', group: 'background' },
        { id: 'l1', group: 'Default', params: { CQL_FILTER: 'A=1' }, visibility: true },
        { id: 'l2', group: 'hidden' }
    ]
};

describe('legendWidget enhancer', () => {
    let received;
    const Legend = withLegendMapData((props) => {
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
    it('getLegendViewProps shows the layers of visible groups without backgrounds and layer CQL filter', () => {
        const props = getLegendViewProps(MAP);
        expect(props.map.layers.map(l => l.id)).toEqual(['l1']);
        expect(props.map.layers[0].group).toNotExist();
        expect(props.map.layers[0].params.CQL_FILTER).toBe(undefined);
        expect(props.map.projection).toBe('EPSG:3857');
        expect(props.currentZoomLvl).toBe(4);
        expect(props.scales.length > 0).toBe(true);
    });
    it('mergeLegendLayerChanges applies only the legend fields to the changed layers', () => {
        const layerFilter = { filters: [] };
        const merged = mergeLegendLayerChanges(MAP.layers, [{ id: 'l1', visibility: false, opacity: 0.5, expanded: true, layerFilter, title: 'ignored' }]);
        expect(merged[0]).toBe(MAP.layers[0]);
        expect(merged[1]).toEqual({ ...MAP.layers[1], visibility: false, opacity: 0.5, expanded: true, layerFilter });
    });
    it('writes the legend changes to the controlled map', () => {
        const updateProperty = expect.createSpy();
        ReactDOM.render(<Legend legendMap={{ widgetId: 'map-w', mapId: 'm1', map: MAP }} updateProperty={updateProperty} />, document.getElementById('container'));
        expect(received.noMapConnected).toBe(false);
        received.updateProperty('map', { layers: [{ id: 'l1', visibility: false }] });
        expect(updateProperty).toHaveBeenCalled();
        const [widgetId, key, value, mode] = updateProperty.calls[0].arguments;
        expect([widgetId, key, mode]).toEqual(['map-w', 'maps', 'merge']);
        expect(value.mapId).toBe('m1');
        expect(value.layers[1].visibility).toBe(false);
        received.updateProperty('other', {});
        expect(updateProperty.calls.length).toBe(1);
    });
    it('flags the legend without a controlled map', () => {
        ReactDOM.render(<Legend />, document.getElementById('container'));
        expect(received.noMapConnected).toBe(true);
        expect(received.map).toNotExist();
    });
});
