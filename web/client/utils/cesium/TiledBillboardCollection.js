/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Cesium from 'cesium';
import max from 'lodash/max';
import uuid from 'uuid';
import { createPolylinePrimitive } from './PrimitivesUtils';
import { getStyle } from '../VectorStyleUtils';

function getLevelWithMaximumTexelSpacing(
    tilingScheme,
    texelSpacing,
    latitudeClosestToEquator,
    tileWidth
) {
    const ellipsoid = tilingScheme.ellipsoid;
    const latitudeFactor = !(tilingScheme.projection instanceof Cesium.GeographicProjection)
        ? Math.cos(latitudeClosestToEquator)
        : 1.0;
    const tilingSchemeRectangle = tilingScheme.rectangle;
    const levelZeroMaximumTexelSpacing =
        (ellipsoid.maximumRadius * tilingSchemeRectangle.width * latitudeFactor) /
        (tileWidth * tilingScheme.getNumberOfXTilesAtLevel(0));
    const twoToTheLevelPower = levelZeroMaximumTexelSpacing / texelSpacing;
    const level = Math.log(twoToTheLevelPower) / Math.log(2);
    const rounded = Math.round(level);
    return rounded | 0;
}

const makeTile = (cartographic, imageryLevel, tilingScheme) => {
    const coords = tilingScheme.positionToTileXY(cartographic, imageryLevel);
    const id = `${coords.x}:${coords.y}:${imageryLevel}`;
    const radiansRectangle = tilingScheme.tileXYToRectangle(coords.x, coords.y, imageryLevel);
    return {
        x: coords.x,
        y: coords.y,
        z: imageryLevel,
        id,
        rectangle: Cesium.Rectangle.fromRadians(
            radiansRectangle.west,
            radiansRectangle.south,
            radiansRectangle.east,
            radiansRectangle.north
        )
    };
};

class BillboardsTile {
    constructor(options) {
        this._id = options.id;
        this._billboards = [];
        this._collection = options.collection;
        this._style = options.style;
        this._msId = options.msId;
        this._opacity = options.opacity;
        this._map = options.map;
    }
    addFeatures(features) {
        return getStyle({ style: this._style }, 'cesium')
            .then((styleFunc) => styleFunc({
                map: this._map,
                opacity: this._opacity ?? 1.0,
                features: features.filter(feature => feature?.geometry?.type === 'Point').map((feature) => ({
                    ...feature,
                    positions: [[Cesium.Cartesian3.fromDegrees(feature.geometry.coordinates[0], feature.geometry.coordinates[1], feature.geometry.coordinates[2] || 0)]]
                })),
                getPreviousStyledFeature: () => {
                    return;
                }
            }).then((styledFeatures) => {
                this._billboards = styledFeatures.map(({ primitive, feature }) => {
                    const billboard = this._collection.add({
                        ...primitive?.entity?.billboard,
                        id: feature?.id,
                        position: primitive?.geometry,
                        show: false
                    });
                    billboard._msIsQueryable = () => true;
                    billboard._msGetFeatureById = () => {
                        return {
                            feature,
                            msId: this._msId
                        };
                    };
                    return billboard;
                });
            }));
    }
    show() {
        this._billboards.forEach(billboard => {
            billboard.show = true;
        });
    }
    hide() {
        this._billboards.forEach(billboard => {
            billboard.show = false;
        });
    }
}

function TiledBillboardCollection(options) {

    if (!Cesium.defined(options)) {
        throw new Cesium.DeveloperError("options is required.");
    }

    this._map = options.map;
    this._debugTiles = Cesium.defaultValue(options.debugTiles, false);
    this._tileWidth = Cesium.defaultValue(options.tileWidth, 512);
    this._minimumLevel = Cesium.defaultValue(options.minimumLevel, 0);
    this._maximumLevel = Cesium.defaultValue(options.maximumLevel, 18);
    this._loadTile = options.loadTile ? options.loadTile : () => Promise.resolve({ features: [] });

    this._tilingScheme = new Cesium.WebMercatorTilingScheme();
    this._terrainProvider = this._map?.terrainProvider;
    this._globe = this._map?.scene?.globe;

    this._rectangle = Cesium.Rectangle.MAX_VALUE;

    this._staticPrimitivesCollection = new Cesium.PrimitiveCollection({ destroyPrimitives: true });
    this._map.scene.primitives.add(this._staticPrimitivesCollection);
    this._staticBillboardCollection = new Cesium.BillboardCollection({ scene: this._map.scene });
    this._map.scene.primitives.add(this._staticBillboardCollection);

    this._tileCache = {};
    this._prevTiles = [];

    const maxNumberOfTile = 32;
    let timeout;
    this._update = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        timeout = setTimeout(() => {
            this._callId = uuid();
            if (!this._removed) {
                // _tilesToRender is a private property not exposed by the API
                // https://community.cesium.com/t/does-quadtreeprimitive-still-support-in-cesium-1-32/5422/4
                const tilesToRender = [...this._globe?._surface?._tilesToRender];
                const maximumLevel = max(tilesToRender.map(tileToRender => tileToRender.level));

                let target = this._map.scene.globe.pick(new Cesium.Ray(this._map.camera.position, this._map.camera.direction), this._map.scene);
                let tiles = [];
                if (target) {
                    const center = Cesium.Cartographic.fromCartesian(
                        new Cesium.Cartesian3(target.x, target.y, target.z)
                    );
                    const errorRatio = 1.0;
                    const targetGeometricError = errorRatio * this._terrainProvider.getLevelMaximumGeometricError(maximumLevel);
                    let imageryLevel = getLevelWithMaximumTexelSpacing(
                        this._tilingScheme,
                        targetGeometricError,
                        center.latitude,
                        this._tileWidth
                    );
                    if (imageryLevel > this._maximumLevel) {
                        imageryLevel = this._maximumLevel;
                    }

                    if (imageryLevel >= this._minimumLevel) {
                        const viewRectangle = this._map.camera.computeViewRectangle();
                        const topLeft = Cesium.Cartographic.fromRadians(viewRectangle.west, viewRectangle.north, 0);
                        const bottomRight = Cesium.Cartographic.fromRadians(viewRectangle.east, viewRectangle.south, 0);

                        const centerTile = makeTile(center, imageryLevel, this._tilingScheme);
                        const topLeftTile = makeTile(topLeft, imageryLevel, this._tilingScheme);
                        const bottomLeftTile = makeTile(bottomRight, imageryLevel, this._tilingScheme);

                        for (let y = topLeftTile.y; y < bottomLeftTile.y + 1; y++) {
                            for (let x = topLeftTile.x; x < bottomLeftTile.x + 1; x++) {
                                const id = `${x}:${y}:${imageryLevel}`;
                                const radiansRectangle = this._tilingScheme.tileXYToRectangle(x, y, imageryLevel);
                                tiles.push({
                                    callId: this._callId,
                                    distance: Cesium.Cartesian2.distance(new Cesium.Cartesian2(centerTile.x, centerTile.y), new Cesium.Cartesian2(x, y)),
                                    id,
                                    x,
                                    y,
                                    z: imageryLevel,
                                    rectangle: Cesium.Rectangle.fromRadians(
                                        radiansRectangle.west,
                                        radiansRectangle.south,
                                        radiansRectangle.east,
                                        radiansRectangle.north
                                    )
                                });
                            }
                        }
                        tiles = [...tiles].sort((a, b) => a.distance - b.distance).filter((tile, idx) => idx < maxNumberOfTile);
                    }
                }

                this._staticPrimitivesCollection.removeAll();

                this._prevTiles.forEach(prevTile => {
                    if (this._tileCache[prevTile.id]) {
                        const visible = tiles.some(tile => tile.id === prevTile.id);
                        if (!visible ) {
                            this._tileCache[prevTile.id].hide();
                        }
                    }
                });

                this._map.scene.requestRender();

                tiles.forEach(tile => {

                    if (this._debugTiles) {
                        this._staticPrimitivesCollection.add(
                            createPolylinePrimitive({
                                color: '#ff0000',
                                opacity: 0.5,
                                clampToGround: true,
                                coordinates: [
                                    Cesium.Cartographic.toCartesian(new Cesium.Cartographic(tile.rectangle.west, tile.rectangle.south)),
                                    Cesium.Cartographic.toCartesian(new Cesium.Cartographic(tile.rectangle.west, tile.rectangle.north)),
                                    Cesium.Cartographic.toCartesian(new Cesium.Cartographic(tile.rectangle.east, tile.rectangle.north)),
                                    Cesium.Cartographic.toCartesian(new Cesium.Cartographic(tile.rectangle.east, tile.rectangle.south)),
                                    Cesium.Cartographic.toCartesian(new Cesium.Cartographic(tile.rectangle.west, tile.rectangle.south))
                                ]
                            })
                        );
                    }
                    if (!this._tileCache[tile.id]) {
                        this._tileCache[tile.id] = new BillboardsTile({
                            id: tile.id,
                            collection: this._staticBillboardCollection,
                            style: this._style,
                            msId: options.msId,
                            map: this._map,
                            opacity: options.opacity
                        });
                        this._loadTile(tile)
                            .then(({ features }) => {
                                if (!this._removed) {
                                    this._tileCache[tile.id].addFeatures(features)
                                        .then(() => {
                                            if (this._callId === tile.callId) {
                                                this._tileCache[tile.id].show();
                                                this._map.scene.requestRender();
                                            }
                                        });
                                }
                            })
                            .catch(() => {
                                if (!this._removed) {
                                    delete this._tileCache[tile.id];
                                }
                            });
                    } else {
                        this._tileCache[tile.id].show();
                        this._map.scene.requestRender();
                    }
                });
                this._prevTiles = [...tiles];
            }
        }, 300);
    };

    this._map.camera.moveEnd.addEventListener(this._update);
    this._style = options.style;
    this._update();
}

TiledBillboardCollection.prototype.destroy = function() {
    this._removed = true;
    this._tileCache = {};
    this._prevTiles = [];
    this._map.camera.moveEnd.removeEventListener(this._update);
    this._staticPrimitivesCollection.removeAll();
    this._map.scene.primitives.remove(this._staticPrimitivesCollection);
    this._staticBillboardCollection.removeAll();
    this._map.scene.primitives.remove(this._staticBillboardCollection);
};

TiledBillboardCollection.prototype.setStyleFunction = function(styleFunc) {
    this._styledFeatures.setStyleFunction(styleFunc);
};

export default TiledBillboardCollection;
