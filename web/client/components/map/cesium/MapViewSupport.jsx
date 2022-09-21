/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { reproject } from '../../../utils/CoordinatesUtils';

function computeCartesianPositionFromCenterAndZoom({ center, zoom }, zoomToHeight) {
    const projectedCenter = center.crs === 'EPSG:4326'
        ? center
        : reproject(center, center.crs, 'EPSG:4326');
    const height = zoomToHeight / Math.pow(2, zoom - 1);
    return Cesium.Cartesian3.fromDegrees(projectedCenter.center.x, projectedCenter.center.y, height);
}

function MapViewSupport({
    map,
    apiRef = () => {},
    zoomToHeight = 80000000
}) {

    useEffect(() => {
        apiRef({
            getView: () => {
                const crs = 'EPSG:4326';
                const center = map.camera.positionCartographic;
                const x = Cesium.Math.toDegrees(center.longitude);
                const y = Cesium.Math.toDegrees(center.longitude);
                const zoom = Math.log2(zoomToHeight / center.height) + 1;
                const bounds = map.camera.computeViewRectangle(map.scene.globe.ellipsoid, new Cesium.Rectangle());
                return {
                    zoom,
                    center: { x, y, crs },
                    bbox: {
                        bounds: {
                            minx: Cesium.Math.toDegrees(bounds.west),
                            miny: Cesium.Math.toDegrees(bounds.south),
                            maxx: Cesium.Math.toDegrees(bounds.east),
                            maxy: Cesium.Math.toDegrees(bounds.north)
                        },
                        crs
                    },
                    position: {
                        x: map.camera.position.x,
                        y: map.camera.position.y,
                        z: map.camera.position.z
                    },
                    orientation: {
                        heading: map.camera.heading,
                        pitch: map.camera.pitch,
                        roll: map.camera.roll
                    }
                };
            },
            setView: (view) => {
                const destination = view.position
                    ? new Cesium.Cartesian3(view.position.x, view.position.y, view.position.z)
                    : computeCartesianPositionFromCenterAndZoom(view, zoomToHeight);
                map.camera.cancelFlight();
                map.camera[view.flyTo ? 'flyTo' : 'setView']({
                    destination,
                    orientation: view.orientation
                });
            }
        });
    }, [zoomToHeight]);

    return null;
}

export default MapViewSupport;
