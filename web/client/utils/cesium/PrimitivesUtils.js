/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Cesium from 'cesium';
import chroma from 'chroma-js';

export const getCesiumColor = ({ color, opacity }) => {
    const [r, g, b, a] = chroma(color).gl();
    if (opacity !== undefined) {
        return new Cesium.Color(r, g, b, opacity);
    }
    return new Cesium.Color(r, g, b, a);
};

export const createPolylinePrimitive = ({
    coordinates,
    width = 4,
    color = '#ff00ff',
    opacity = 1.0,
    depthFailColor,
    depthFailOpacity,
    dashLength
}) => {
    return new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
                positions: [...coordinates],
                width,
                arcType: Cesium.ArcType.NONE
            })
        }),
        appearance: new Cesium.PolylineMaterialAppearance({
            material: !dashLength
                ? Cesium.Material.fromType('Color', {
                    color: getCesiumColor({
                        color: color,
                        opacity
                    })
                })
                : Cesium.Material.fromType('PolylineDash', {
                    color: getCesiumColor({
                        color: color,
                        opacity
                    }),
                    dashLength
                })
        }),
        ...(depthFailColor && {
            depthFailAppearance: new Cesium.PolylineMaterialAppearance({
                material: !dashLength
                    ? Cesium.Material.fromType('Color', {
                        color: getCesiumColor({
                            color: depthFailColor,
                            opacity: depthFailOpacity
                        })
                    })
                    : Cesium.Material.fromType('PolylineDash', {
                        color: getCesiumColor({
                            color: depthFailColor,
                            opacity: depthFailOpacity
                        }),
                        dashLength
                    })
            })
        }),
        allowPicking: false,
        asynchronous: false
    });
};

export const createPolygonPrimitive = ({
    coordinates,
    color = '#ff00ffAA',
    opacity = 1.0,
    depthFailColor,
    depthFailOpacity
}) => {
    return new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.PolygonGeometry({
                polygonHierarchy: new Cesium.PolygonHierarchy([...coordinates]),
                perPositionHeight: true
            })
        }),
        appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType('Color', {
                color: getCesiumColor({
                    color,
                    opacity
                })
            }),
            faceForward: true
        }),
        ...(depthFailColor && {
            depthFailAppearance: new Cesium.MaterialAppearance({
                material: Cesium.Material.fromType('Color', {
                    color: getCesiumColor({
                        color: depthFailColor,
                        opacity: depthFailOpacity
                    })
                }),
                faceForward: true
            })
        }),
        allowPicking: false,
        asynchronous: false
    });
};

export const clearPrimitivesCollection = (map, primitivesCollection) => {
    if (map?.scene?.primitives && primitivesCollection && !primitivesCollection.isDestroyed()) {
        primitivesCollection.removeAll();
        // remove destroys the primitive collection so we don't need to explicitly use primitivesCollection.destroy()
        map.scene.primitives.remove(primitivesCollection);
    }
};

export const createCircleMarkerImage = (size, { stroke, strokeWidth = 1, fill = '#ffffff' }) => {
    const fullSize = stroke ? size + strokeWidth * 2 : size;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', fullSize);
    canvas.setAttribute('height', fullSize);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    if (fill) { ctx.fillStyle = '#ffffff'; }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
    }
    ctx.arc(fullSize / 2, fullSize / 2, size / 2, 0, 2 * Math.PI);
    if (fill) { ctx.fill(); }
    if (stroke) { ctx.stroke(); }
    return canvas;
};
