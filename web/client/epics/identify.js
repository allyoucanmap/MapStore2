/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const Rx = require('rxjs');

const {LOAD_FEATURE_INFO, GET_VECTOR_INFO, FEATURE_INFO_CLICK} = require('../actions/mapInfo');
const {closeFeatureGrid} = require('../actions/featuregrid');
const {CHANGE_MOUSE_POINTER, CLICK_ON_MAP, zoomToPoint} = require('../actions/map');
const {MAP_CONFIG_LOADED} = require('../actions/config');
const {stopGetFeatureInfoSelector, zoomToMarkerSelector} = require('../selectors/mapinfo');
const {mapSelector} = require('../selectors/map');
const {boundingMapRectSelector} = require('../selectors/maplayout');
const {centerToVisibleArea} = require('../utils/CoordinatesUtils');
const {getCurrentResolution} = require('../utils/MapUtils');

module.exports = {
    closeFeatureGridFromIdentifyEpic: (action$) =>
        action$.ofType(LOAD_FEATURE_INFO, GET_VECTOR_INFO)
        .switchMap(() => {
            return Rx.Observable.of(closeFeatureGrid());
        }),
    changeMapPointer: (action$, store) =>
        action$.ofType(CHANGE_MOUSE_POINTER)
        .filter(() => !(store.getState()).map)
        .switchMap((a) => action$.ofType(MAP_CONFIG_LOADED).mapTo(a)),
    onMapClick: (action$, store) =>
        action$.ofType(CLICK_ON_MAP).filter(() => {
            const {disableAlwaysOn = false} = (store.getState()).mapInfo;
            return disableAlwaysOn || !stopGetFeatureInfoSelector(store.getState() || {});
        })
        .map(({point, layer}) => ({type: FEATURE_INFO_CLICK, point, layer})),
    zoomToVisibleAreaEpic: (action$, store) =>
        action$.ofType(FEATURE_INFO_CLICK)
        .filter(() => zoomToMarkerSelector(store.getState()))
        .switchMap((action) =>
            action$.ofType(LOAD_FEATURE_INFO)
            .switchMap(() => {
                const state = store.getState();
                const map = mapSelector(state);
                const boundingMapRect = boundingMapRectSelector(state);
                const coords = action.point && action.point && action.point.latlng;
                if (!map || !boundingMapRect || !coords) {
                    return Rx.Observable.empty();
                }
                const resolution = getCurrentResolution(Math.round(map.zoom), 0, 21, 96);
                const center = centerToVisibleArea(coords, map, boundingMapRect, resolution);
                return Rx.Observable.of(zoomToPoint(center.pos, center.zoom, center.crs));
            })
        )
};
