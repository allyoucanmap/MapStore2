/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const expect = require('expect');

const {ZOOM_TO_POINT} = require('../../actions/map');
const {FEATURE_INFO_CLICK, loadFeatureInfo} = require('../../actions/mapinfo');
const {zoomToVisibleAreaEpic} = require('../identify');
const {testEpic} = require('./epicTestUtils');

describe('identify Epics', () => {

    it('test zoom to visible area', (done) => {

        const state = {
            mapInfo: {
                zoomToMarker: true
            },
            map: {
                present: {
                    size: {
                        width: 1000,
                        height: 500
                    },
                    zoom: 4,
                    projection: 'EPSG:3857'
                }
            },
            maplayout: {
                boundingMapRect: {
                    left: 500,
                    bottom: 250
                }
            }
        };

        const sentActions = [{type: FEATURE_INFO_CLICK, point: {latlng: {lat: 0, lng: 0}}}, loadFeatureInfo()];

        const expectedAction = actions => {
            expect(actions.length).toBe(1);
            actions.map((action) => {
                switch (action.type) {
                case ZOOM_TO_POINT:
                    expect(action.zoom).toBe(4);
                    expect({x: parseFloat(action.pos.x.toFixed(2)), y: parseFloat(action.pos.y.toFixed(2))}).toEqual({x: -21.97, y: -10.92});
                    expect(action.crs).toBe('EPSG:4326');
                    break;
                default:
                    expect(true).toBe(false);
                }
            });
            done();
        };

        testEpic(zoomToVisibleAreaEpic, 1, sentActions, expectedAction, state);
    });

});
