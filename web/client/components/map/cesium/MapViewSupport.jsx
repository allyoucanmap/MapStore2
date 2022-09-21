/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { reproject } from '../../../utils/CoordinatesUtils';
import uniqBy from 'lodash/uniqBy';
import {
    getCesiumColor,
    createPolylinePrimitive,
    clearPrimitivesCollection,
    createCircleMarkerImage
} from '../../../utils/cesium/PrimitivesUtils';

function computeCartesianPositionFromCenterAndZoom({ center, zoom }, zoomToHeight) {
    const projectedCenter = center.crs === 'EPSG:4326'
        ? center
        : reproject(center, center.crs, 'EPSG:4326');
    const height = zoomToHeight / Math.pow(2, zoom - 1);
    return Cesium.Cartesian3.fromDegrees(projectedCenter.center.x, projectedCenter.center.y, height);
}

// see https://community.cesium.com/t/how-to-get-heading-pitch-and-roll-from-the-two-points/7243/5
const computeDirectionOrientation = (origin, target) => {
    const direction = Cesium.Cartesian3.subtract(target, origin, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(direction, direction);

    let rotationMatrix = Cesium.Transforms.rotationMatrixFromPositionVelocity(origin, direction);
    /* const rot90 = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(90));
    Cesium.Matrix3.multiply(rotationMatrix, rot90, rotationMatrix);*/
    const quaternion = Cesium.Quaternion.fromRotationMatrix(rotationMatrix);
    const orientation = Cesium.HeadingPitchRoll.fromQuaternion(quaternion);

    return {
        direction: {
            x: direction.x,
            y: direction.y,
            z: direction.z
        },
        orientation: {
            heading: orientation.heading,
            pitch: orientation.pitch,
            roll: orientation.roll
        }
    };
};

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

function MapViewSupport({
    map,
    selectedId,
    views,
    apiRef = () => { },
    zoomToHeight = 80000000,
    showViewsGeometries,
    resources
}) {
    const selected = views?.find(view => view.id === selectedId);

    const staticPrimitivesCollection = useRef();
    const staticBillboardCollection = useRef();
    const staticLabelsCollection = useRef();
    const markerImage = useRef();

    useEffect(() => {
        if (map) {
            staticPrimitivesCollection.current = new Cesium.PrimitiveCollection({ destroyPrimitives: true });
            map.scene.primitives.add(staticPrimitivesCollection.current);

            staticBillboardCollection.current = new Cesium.BillboardCollection();
            map.scene.primitives.add(staticBillboardCollection.current);

            staticLabelsCollection.current = new Cesium.LabelCollection();
            map.scene.primitives.add(staticLabelsCollection.current);

            markerImage.current = createCircleMarkerImage(16, { stroke: '#ffffff', strokeWidth: 2, fill: false});
        }
        return () => {
            if (map?.isDestroyed && !map.isDestroyed()) {
                clearPrimitivesCollection(map, staticPrimitivesCollection.current);
                staticPrimitivesCollection.current = null;
                clearPrimitivesCollection(map, staticBillboardCollection.current);
                staticBillboardCollection.current = null;
                clearPrimitivesCollection(map, staticLabelsCollection.current);
                staticLabelsCollection.current = null;
            }
        };
    }, [map]);

    useEffect(() => {
        if (showViewsGeometries && map?.isDestroyed && !map.isDestroyed() && views?.length > 0) {
            views.forEach((view) => {
                const position = new Cesium.Cartesian3(view.position.x, view.position.y, view.position.z);
                const direction = new Cesium.Cartesian3(view.direction.x, view.direction.y, view.direction.z);
                const target = view.target
                    ? new Cesium.Cartesian3(view.target.x, view.target.y, view.target.z)
                    : Cesium.Cartesian3.add(
                        position,
                        Cesium.Cartesian3.multiplyByScalar(direction, map.scene.globe.ellipsoid.maximumRadius / 4, new Cesium.Cartesian3() ),
                        new Cesium.Cartesian3()
                    );

                const isSelected = view.id === selectedId;
                staticPrimitivesCollection.current.add(createPolylinePrimitive({
                    color: isSelected ? '#ffcc33' : '#ffffff',
                    opacity: 1.0,
                    depthFailColor: '#000000',
                    depthFailOpacity: 0.0,
                    width: 1,
                    dashLength: 10,
                    coordinates: [
                        position,
                        target
                    ]
                }));
                staticBillboardCollection.current.add({
                    position,
                    image: markerImage.current,
                    color: getCesiumColor({
                        color: isSelected ? '#ffcc33' : '#ffffff'
                    }),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    allowPicking: false
                });
                staticLabelsCollection.current.add({
                    position,
                    text: view.title,
                    font: '12px sans-serif',
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    fillColor: getCesiumColor({
                        color: '#ffffff'
                    }),
                    outlineColor: getCesiumColor({
                        color: '#000000'
                    }),
                    outlineWidth: 4,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    showBackground: false,
                    backgroundPadding: new Cesium.Cartesian2(4, 4),
                    pixelOffset: new Cesium.Cartesian2(0, -16),
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BASELINE
                });
            });
            map.scene.requestRender();
        }
        return () => {
            if (map?.isDestroyed && !map.isDestroyed()) {
                staticPrimitivesCollection.current?.removeAll();
                staticBillboardCollection.current?.removeAll();
                staticLabelsCollection.current?.removeAll();
            }
        };
    }, [views, selectedId, map, showViewsGeometries]);

    useEffect(() => {
        apiRef({
            getView: () => {
                const crs = 'EPSG:4326';
                const center = map.camera.positionCartographic;
                const x = Cesium.Math.toDegrees(center.longitude);
                const y = Cesium.Math.toDegrees(center.longitude);
                const zoom = Math.log2(zoomToHeight / center.height) + 1;
                const bounds = map.camera.computeViewRectangle(map.scene.globe.ellipsoid, new Cesium.Rectangle());
                let target = map.scene.globe.pick(new Cesium.Ray(map.camera.position, map.camera.direction), map.scene);
                if (!target) {
                    target = Cesium.Cartesian3.add(
                        Cesium.Cartesian3.clone(map.camera.position),
                        Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.clone(map.camera.direction), 100000, new Cesium.Cartesian3() ),
                        new Cesium.Cartesian3()
                    );
                }
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
                    ...(target && {
                        target: {
                            x: target.x,
                            y: target.y,
                            z: target.z
                        }
                    }),
                    position: {
                        x: map.camera.position.x,
                        y: map.camera.position.y,
                        z: map.camera.position.z
                    },
                    direction: {
                        x: map.camera.direction.x,
                        y: map.camera.direction.y,
                        z: map.camera.direction.z
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
            },
            getViewCoordinates: (view) => {
                const origin = Cesium.Cartographic.fromCartesian(
                    new Cesium.Cartesian3(view.position.x, view.position.y, view.position.z)
                );
                const target = view.target
                    ? Cesium.Cartographic.fromCartesian(
                        new Cesium.Cartesian3(view.target.x, view.target.y, view.target.z)
                    )
                    : null;
                return {
                    origin: {
                        latitude: Cesium.Math.toDegrees(origin.latitude),
                        longitude: Cesium.Math.toDegrees(origin.longitude),
                        height: origin.height
                    },
                    ...(target && {
                        target: {
                            latitude: Cesium.Math.toDegrees(target.latitude),
                            longitude: Cesium.Math.toDegrees(target.longitude),
                            height: target.height
                        }
                    })
                };
            },
            computeViewCoordinates: (view, { origin: originCoords, target: targetCoords }, followChanges) => {
                let tmp = {
                    position: Cesium.Cartesian3.clone(map.camera.position),
                    orientation: {
                        heading: map.camera.heading,
                        pitch: map.camera.pitch,
                        roll: map.camera.roll
                    }
                };
                const origin = Cesium.Cartographic.toCartesian(
                    Cesium.Cartographic.fromDegrees(originCoords.longitude, originCoords.latitude, originCoords.height, new Cesium.Cartographic())
                );
                const originUp = Cesium.Cartographic.toCartesian(
                    Cesium.Cartographic.fromDegrees(originCoords.longitude, originCoords.latitude, originCoords.height + 1, new Cesium.Cartographic())
                );
                const up = Cesium.Cartesian3.subtract(originUp, origin, new Cesium.Cartesian3());
                let target;
                let direction;
                if (targetCoords) {
                    target = Cesium.Cartographic.toCartesian(
                        Cesium.Cartographic.fromDegrees(targetCoords.longitude, targetCoords.latitude, targetCoords.height, new Cesium.Cartographic())
                    );
                    direction = Cesium.Cartesian3.subtract(target, origin, new Cesium.Cartesian3());
                    Cesium.Cartesian3.normalize(direction, direction);
                    map.camera.setView({
                        destination: origin,
                        orientation: {
                            direction,
                            up
                        }
                    });
                } else {
                    direction = new Cesium.Cartesian3(view.direction.x, view.direction.y, view.direction.z);
                }
                map.camera.setView({
                    destination: origin,
                    orientation: {
                        direction,
                        up
                    }
                });
                const properties = {
                    ...(target && {
                        target: {
                            x: target.x,
                            y: target.y,
                            z: target.z
                        }
                    }),
                    position: {
                        x: map.camera.position.x,
                        y: map.camera.position.y,
                        z: map.camera.position.z
                    },
                    direction: {
                        x: map.camera.direction.x,
                        y: map.camera.direction.y,
                        z: map.camera.direction.z
                    },
                    orientation: {
                        heading: map.camera.heading,
                        pitch: map.camera.pitch,
                        roll: map.camera.roll
                    }
                };
                if (!followChanges) {
                    map.camera.setView({
                        destination: tmp.position,
                        orientation: tmp.orientation
                    });
                }

                return properties;
            }
        });
    }, [zoomToHeight]);

    useEffect(() => {
        const scene = map.scene;
        const globe = scene.globe;
        const { globeTranslucency = {} } = selected || {};
        globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
            selected?.globeTranslucency?.nearDistance ?? 400.0,
            0.0,
            selected?.globeTranslucency?.farDistance ?? 800.0,
            1.0
        );
        const opacity = globeTranslucency?.opacity ?? 0.5;
        globe.translucency.enabled = globeTranslucency?.enabled ?? false;
        globe.translucency.frontFaceAlphaByDistance.nearValue = opacity;
        globe.translucency.frontFaceAlphaByDistance.farValue = globeTranslucency?.fadeByDistance
            ? 1.0
            : opacity;
    }, [
        selected?.globeTranslucency?.enabled,
        selected?.globeTranslucency?.fadeByDistance,
        selected?.globeTranslucency?.nearDistance,
        selected?.globeTranslucency?.farDistance,
        selected?.globeTranslucency?.opacity
    ]);

    useEffect(() => {
        const scene = map.scene;
        scene.invertClassification = !!selected?.mask?.enabled;
        scene.invertClassificationColor = new Cesium.Color(0, 0, 0, 0.0);
    }, [
        selected?.mask?.enabled
    ]);

    useEffect(() => {
        const scene = map.scene;
        const globe = scene.globe;
        const terrainClippingLayerSource = resources?.find(resource => resource.id === selected?.terrain?.clippingLayerSource)?.data;
        const clippingPolygon = terrainClippingLayerSource?.collection?.features?.find((feature) => feature.id === selected?.terrain?.clippingPolygon);
        if (clippingPolygon) {
            polygonToClippingPlanes(clippingPolygon, !!selected?.terrain?.clippingPolygonUnion, selected?.terrain?.clipOriginalGeometry)
                .then((planes) => {
                    globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
                        planes,
                        edgeWidth: 1.0,
                        edgeColor: Cesium.Color.WHITE,
                        unionClippingRegions: !!selected?.terrain?.clippingPolygonUnion
                    });
                    globe.backFaceCulling = true;
                    globe.showSkirts = true;
                });
        } else {
            globe.clippingPlanes = new Cesium.ClippingPlaneCollection({ planes: [] });
        }
    }, [
        selected?.terrain?.clippingPolygon,
        selected?.terrain?.clippingPolygonUnion,
        selected?.terrain?.clipOriginalGeometry,
        selected?.terrain?.clippingLayerSource,
        resources
    ]);

    return null;
}

export default MapViewSupport;
