/**
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';
import * as Cesium from 'cesium';
import isEqual from 'lodash/isEqual';
import isNumber from 'lodash/isNumber';
import isNaN from 'lodash/isNaN';
import uniqBy from 'lodash/uniqBy';
import { getProxyUrl, needProxy } from "../../../../utils/ProxyUtils";
import { getStyleParser } from '../../../../utils/VectorStyleUtils';

function clockwiseCoordinates(coordinates) {
    return import('@turf/boolean-clockwise')
        .then((mod) => {
            const turfClockwise = mod.default;
            const isClockwise = turfClockwise({ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} });
            if (isClockwise) {
                return coordinates;
            }
            return [...coordinates].reverse();
        });
}

function polygonToClippingPlanes(feature, union, clipOriginalGeometry) {
    return import('@turf/convex')
        .then((mod) => {
            const turfConvex = mod.default;
            const hull = clipOriginalGeometry ? feature : turfConvex(feature);
            const { geometry } = hull;
            return clockwiseCoordinates([...(geometry?.coordinates?.[0] || [])])
                .then((coordinates) => {
                    const outerRingCoordinates = uniqBy(union ? coordinates : coordinates.reverse(), (coords) => `${coords[0]}${coords[1]}`);
                    const points = outerRingCoordinates.map(([lng, lat, height = 0]) => {
                        const point = Cesium.Cartesian3.fromDegrees(lng, lat, height);
                        return point;
                    });

                    const pointsLength = points.length;

                    // Create center points for each clipping plane
                    const clippingPlanes = [];

                    for (let i = 0; i < pointsLength; ++i) {
                        const nextIndex = (i + 1) % pointsLength;
                        let midpoint = Cesium.Cartesian3.add(points[i], points[nextIndex], new Cesium.Cartesian3());
                        midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);
                        const up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());

                        let right = Cesium.Cartesian3.subtract(points[nextIndex], midpoint, new Cesium.Cartesian3());
                        right = Cesium.Cartesian3.normalize(right, right);

                        let normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
                        normal = Cesium.Cartesian3.normalize(normal, normal);
                        // Compute distance by pretending the plane is at the origin
                        const originCenteredPlane = new Cesium.Plane(normal, 0.0);
                        const distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
                        clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
                    }
                    return clippingPlanes;
                });
        });
}

function getStyle({ style }) {
    const { format, body } = style || {};
    if (!format || !body) {
        return Promise.resolve(null);
    }
    if (format === '3dtiles') {
        return Promise.resolve(body);
    }
    if (format === 'geostyler') {
        return getStyleParser('3dtiles')
            .then((parser) => parser.writeStyle(body));
    }
    return Promise.all([
        getStyleParser(format),
        getStyleParser('3dtiles')
    ])
        .then(([parser, threeDTilesParser]) =>
            parser
                .readStyle(body)
                .then(parsedStyle => threeDTilesParser.writeStyle(parsedStyle))
        );
}

function updateModelMatrix(tileSet, { heightOffset }) {
    if (!isNaN(heightOffset) && isNumber(heightOffset)) {
        const boundingSphere = tileSet.boundingSphere;
        const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
        const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileSet.modelMatrix =  Cesium.Matrix4.fromTranslation(translation);
    }
}

function clip3DTiles(tileSet, options) {
    if (options.clippingPolygon) {
        polygonToClippingPlanes(options.clippingPolygon, !!options.clippingPolygonUnion, options.clipOriginalGeometry)
            .then((planes) => {
                tileSet.clippingPlanes = new Cesium.ClippingPlaneCollection({
                    modelMatrix: Cesium.Matrix4.inverse(
                        Cesium.Matrix4.multiply(
                            tileSet.root.computedTransform,
                            tileSet._initialClippingPlanesOriginMatrix,
                            new Cesium.Matrix4()
                        ),
                        new Cesium.Matrix4()),
                    planes,
                    edgeWidth: 1.0,
                    edgeColor: Cesium.Color.WHITE,
                    unionClippingRegions: !!options.clippingPolygonUnion
                });
            });
    } else {
        tileSet.clippingPlanes = new Cesium.ClippingPlaneCollection({ planes: [] });
    }
}

function ensureReady(tileSet, callback) {
    if (tileSet.ready) {
        callback();
    } else {
        tileSet.readyPromise.then(() => {
            callback();
        });
    }
}

Layers.registerType('3dtiles', {
    create: (options, map) => {
        if (options.visibility && options.url) {

            const tileSet = map.scene.primitives.add(new Cesium.Cesium3DTileset({
                url: new Cesium.Resource({
                    url: options.url,
                    proxy: needProxy(options.url) ? new Cesium.DefaultProxy(getProxyUrl()) : undefined
                    // TODO: axios supports also adding access tokens or credentials (e.g. authkey, Authentication header ...).
                    // if we want to use internal cesium functionality to retrieve data
                    // we need to create a utility to set a CesiumResource that applies also this part.
                    // in addition to this proxy.
                })
            }));

            // assign the original mapstore id of the layer
            tileSet.msId = options.id;

            ensureReady(tileSet, () => {
                updateModelMatrix(tileSet, options);
                clip3DTiles(tileSet, options, map);
                getStyle(options)
                    .then((style) => {
                        if (style) {
                            tileSet.style = new Cesium.Cesium3DTileStyle(style);
                        }
                    });
            });

            return {
                detached: true,
                tileSet,
                remove: () => {
                    map.scene.primitives.remove(tileSet);
                },
                setVisible: (visible) => {
                    tileSet.show = !!visible;
                }
            };
        }
        return {
            detached: true,
            remove: () => {},
            setVisible: () => {}
        };
    },
    update: function(layer, newOptions, oldOptions, map) {
        if (newOptions.visibility && !oldOptions.visibility) {
            return this.create(newOptions, map);
        }
        if (!newOptions.visibility && oldOptions.visibility && layer?.remove) {
            layer.remove();
            return null;
        }
        if (
            (!isEqual(newOptions.clippingPolygon, oldOptions.clippingPolygon)
            || newOptions.clippingPolygonUnion !== oldOptions.clippingPolygonUnion
            || newOptions.clipOriginalGeometry !== oldOptions.clipOriginalGeometry)
         && layer?.tileSet) {
            ensureReady(layer.tileSet, () => {
                clip3DTiles(layer.tileSet, newOptions, map);
            });
        }
        if (!isEqual(newOptions.style, oldOptions.style) && layer?.tileSet) {
            ensureReady(layer.tileSet, () => {
                getStyle(newOptions)
                    .then((style) => {
                        if (style && layer?.tileSet) {
                            layer.tileSet.makeStyleDirty();
                            layer.tileSet.style = new Cesium.Cesium3DTileStyle(style);
                        }
                    });
            });
        }
        if (layer?.tileSet && newOptions.heightOffset !== oldOptions.heightOffset) {
            ensureReady(layer.tileSet, () => {
                updateModelMatrix(layer.tileSet, newOptions);
            });
        }
        return null;
    }
});
