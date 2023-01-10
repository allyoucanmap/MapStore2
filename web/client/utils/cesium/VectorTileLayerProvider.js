/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Cesium from 'cesium';
import axios from '../../libs/ajax';
import uuid from 'uuid';
import { castArray, uniqBy } from 'lodash';

function provideGeoJSONLibsVT(promiseFunc) {
    return Promise.all([
        import('geojson-vt').then(mod => mod.default),
        import('@turf/flatten').then(mod => mod.default)
    ]).then(libs => promiseFunc(libs));
}

function isUniqCoords(coords) {
    const reducedCoords = uniqBy(coords, ([x, y, z]) => `${x}:${y}:${z ?? 0}`);
    return reducedCoords.length === 1;
}

function getLevelWithMaximumTexelSpacing(
    // layer,
    tilingScheme,
    texelSpacing,
    latitudeClosestToEquator,
    tileWidth
) {
    // PERFORMANCE_IDEA: factor out the stuff that doesn't change.
    // const imageryProvider = layer._imageryProvider;
    // const tilingScheme = imageryProvider.tilingScheme;
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

const imageryBoundsScratch = new Cesium.Rectangle();
const tileImageryBoundsScratch = new Cesium.Rectangle();
const clippedRectangleScratch = new Cesium.Rectangle();
const terrainRectangleScratch = new Cesium.Rectangle();


function getPositions({
    geometry,
    minX,
    minY,
    maxX,
    maxY,
    extent
}) {
    const cartographicArray = geometry.map((coords) => {
        return new Cesium.Cartographic(
            maxX + ((coords[0] / extent) * Math.abs(maxX - minX)),
            maxY - ((coords[1] / extent) * Math.abs(maxY - minY)),
            0
        );
    });
    const positions = cartographicArray.map((cartographic) => {
        return Cesium.Cartographic.toCartesian(cartographic);
    });
    return positions;
}

const isOutsideExtent = (point, extent) => {
    const [x, y] = point;
    return !(x >= 0 && x <= extent && y >= 0 && y <= extent);
};

const isClipped = (geometry, extent) => {
    return !!geometry.find((point) => isOutsideExtent(point, extent));
};

function createEntities({
    id,
    extent,
    properties,
    type,
    geometry,
    minX,
    minY,
    maxX,
    maxY
}) {
    if (type === 1) {
        const positions = getPositions({
            geometry: geometry.filter(point => !isOutsideExtent(point, extent)),
            extent,
            minX,
            minY,
            maxX,
            maxY
        });
        return positions.map((position) => ({
            id,
            position,
            point: {
                pixelSize: 2.0,
                color: new Cesium.Color(1, 0, 1, 0.5)
            },
            properties
        }));
    }
    if (type === 2 && !isUniqCoords(geometry[0])) {
        return geometry
            .filter((line) => !isUniqCoords(line))
            .map((line) => ({
                // clipped: isClipped(line, extent),
                id,
                polyline: {
                    positions: getPositions({
                        geometry: line,
                        extent,
                        minX,
                        minY,
                        maxX,
                        maxY
                    }),
                    width: 3.0,
                    material: new Cesium.Color(1, 0, 1, 0.5)
                },
                properties
            }));
    }
    if (type === 3 && !isUniqCoords(geometry[0])) {
        const positions = getPositions({
            geometry: geometry[0],
            extent,
            minX,
            minY,
            maxX,
            maxY
        });
        const holes = geometry
            .filter((ring, idx) => idx > 0 && !isUniqCoords(ring))
            .map((ring) => getPositions({
                geometry: ring,
                extent,
                minX,
                minY,
                maxX,
                maxY
            }));
        if (positions) {
            return [
                {
                    clipped: isClipped(geometry[0], extent),
                    id,
                    polygon: {
                        hierarchy: new Cesium.PolygonHierarchy(positions, holes),
                        material: new Cesium.Color(1, 0, 1, 0.5)
                    },
                    properties
                }
            ];
        }
        return [];
    }
    return [];
}

const requestVectorTiles = ({
    id,
    url,
    rectangle,
    layerNamePropertyKey
}) => {
    return Cesium.Resource.fetchArrayBuffer({
        url,
        headers: {}
    })
        .then((buffer) => {
            return Promise.all([
                import('@mapbox/vector-tile').then(({ VectorTile }) => VectorTile),
                import('pbf').then((mod) => mod.default)
            ]).then(([VectorTile, Protobuf]) => {
                const minX = rectangle.east;
                const minY = rectangle.south;
                const maxX = rectangle.west;
                const maxY = rectangle.north;
                const tile = new VectorTile(new Protobuf(buffer));
                const dataSource = new Cesium.CustomDataSource(id);
                Object.keys(tile?.layers || {}).forEach(layerName => {
                    const layer = tile.layers[layerName];
                    for (let i = 0; i < layer.length; i++) {
                        const feature = layer.feature(i);
                        const properties = {
                            ...feature?.properties,
                            [layerNamePropertyKey]: layerName
                        };
                        const type = feature.type;
                        const geometry = layer.feature(i).loadGeometry();
                        const extent = feature.extent;
                        const entities = createEntities({
                            extent,
                            properties,
                            type,
                            geometry: type === 3
                                ? geometry.map(ring => ring.map((p) => [p.x, p.y]))
                                : geometry.map((p) => [p.x, p.y]),
                            minX,
                            minY,
                            maxX,
                            maxY
                        });
                        if (entities.length > 0) {
                            entities.forEach((entity) => {
                                dataSource.entities.add(entity);
                            });
                        }
                    }
                });
                return dataSource;
            });
        });
};

const requestGeoJSONVectorTiles = ({
    id,
    tileIndex,
    z,
    x,
    y,
    rectangle,
    tileExtent
}) => {
    return new Promise((resolve, reject) => {
        const minX = rectangle.east;
        const minY = rectangle.south;
        const maxX = rectangle.west;
        const maxY = rectangle.north;
        const tile = tileIndex.getTile(z, x, y);
        if (tile?.features?.length > 0) {
            const dataSource = new Cesium.CustomDataSource(id);
            tile.features.forEach((feature) => {
                const entities = createEntities({
                    id: feature.id,
                    extent: tileExtent,
                    properties: feature.tags,
                    type: feature.type,
                    geometry: feature.geometry,
                    minX,
                    minY,
                    maxX,
                    maxY
                });
                if (entities.length > 0) {
                    entities.forEach(({ clipped, ...options }) => {
                        const entity = dataSource.entities.add(options);
                        entity._msClipped = clipped;
                        entity._msFeature = feature;
                    });
                }
            });
            resolve(dataSource);
        } else {
            reject(`No features available for tile ${x} ${y} ${z}`);
        }
    });
};

function createTileSkeletons({
    tile,
    terrainProvider,
    tilingScheme,
    maximumLevel,
    minimumLevel,
    rectangle,
    tileWidth
}) {

    let tiles = [];

    // Use Web Mercator for our texture coordinate computations if this imagery layer uses
    // that projection and the terrain tile falls entirely inside the valid bounds of the
    // projection.
    const useWebMercatorT = tilingScheme.projection instanceof Cesium.WebMercatorProjection &&
        tile.rectangle.north < Cesium.WebMercatorProjection.MaximumLatitude &&
        tile.rectangle.south > -Cesium.WebMercatorProjection.MaximumLatitude;

    // Compute the rectangle of the imagery from this imageryProvider that overlaps
    // the geometry tile.  The ImageryProvider and ImageryLayer both have the
    // opportunity to constrain the rectangle.  The imagery TilingScheme's rectangle
    // always fully contains the ImageryProvider's rectangle.

    const imageryBounds = Cesium.Rectangle.intersection(
        Cesium.Rectangle.MAX_VALUE, // imageryProvider.rectangle,
        rectangle,
        imageryBoundsScratch
    );

    let _rectangle = Cesium.Rectangle.intersection(
        tile.rectangle,
        rectangle,
        tileImageryBoundsScratch
    );

    if (!Cesium.defined(_rectangle)) {

        const baseImageryRectangle = imageryBounds;
        const baseTerrainRectangle = tile.rectangle;
        _rectangle = tileImageryBoundsScratch;

        if (baseTerrainRectangle.south >= baseImageryRectangle.north) {
            _rectangle.north = _rectangle.south = baseImageryRectangle.north;
        } else if (baseTerrainRectangle.north <= baseImageryRectangle.south) {
            _rectangle.north = _rectangle.south = baseImageryRectangle.south;
        } else {
            _rectangle.south = Math.max(
                baseTerrainRectangle.south,
                baseImageryRectangle.south
            );
            _rectangle.north = Math.min(
                baseTerrainRectangle.north,
                baseImageryRectangle.north
            );
        }

        if (baseTerrainRectangle.west >= baseImageryRectangle.east) {
            _rectangle.west = _rectangle.east = baseImageryRectangle.east;
        } else if (baseTerrainRectangle.east <= baseImageryRectangle.west) {
            _rectangle.west = _rectangle.east = baseImageryRectangle.west;
        } else {
            _rectangle.west = Math.max(
                baseTerrainRectangle.west,
                baseImageryRectangle.west
            );
            _rectangle.east = Math.min(
                baseTerrainRectangle.east,
                baseImageryRectangle.east
            );
        }
    }

    let latitudeClosestToEquator = 0.0;
    if (_rectangle.south > 0.0) {
        latitudeClosestToEquator = _rectangle.south;
    } else if (_rectangle.north < 0.0) {
        latitudeClosestToEquator = _rectangle.north;
    }

    // Compute the required level in the imagery tiling scheme.
    // The errorRatio should really be imagerySSE / terrainSSE rather than this hard-coded value.
    // But first we need configurable imagery SSE and we need the rendering to be able to handle more
    // images attached to a terrain tile than there are available texture units.  So that's for the future.
    const errorRatio = 1.0;
    const targetGeometricError = errorRatio * terrainProvider.getLevelMaximumGeometricError(tile.level);
    let imageryLevel = getLevelWithMaximumTexelSpacing(
        tilingScheme,
        targetGeometricError,
        latitudeClosestToEquator,
        tileWidth
    );
    imageryLevel = Math.max(0, imageryLevel);
    const _maximumLevel = maximumLevel;
    if (imageryLevel > _maximumLevel) {
        imageryLevel = _maximumLevel;
    }

    if (Cesium.defined(minimumLevel)) {
        const _minimumLevel = minimumLevel;
        if (imageryLevel < _minimumLevel) {
            imageryLevel = _minimumLevel;
        }
    }

    const imageryTilingScheme = tilingScheme;
    const northwestTileCoordinates = imageryTilingScheme.positionToTileXY(
        Cesium.Rectangle.northwest(_rectangle),
        imageryLevel
    );
    const southeastTileCoordinates = imageryTilingScheme.positionToTileXY(
        Cesium.Rectangle.southeast(_rectangle),
        imageryLevel
    );

    if (!northwestTileCoordinates || !southeastTileCoordinates) {
        return tiles;
    }

    // If the southeast corner of the rectangle lies very close to the north or west side
    // of the southeast tile, we don't actually need the southernmost or easternmost
    // tiles.
    // Similarly, if the northwest corner of the rectangle lies very close to the south or east side
    // of the northwest tile, we don't actually need the northernmost or westernmost tiles.

    // We define "very close" as being within 1/512 of the width of the tile.
    let veryCloseX = tile.rectangle.width / 512.0;
    let veryCloseY = tile.rectangle.height / 512.0;

    const northwestTileRectangle = imageryTilingScheme.tileXYToRectangle(
        northwestTileCoordinates.x,
        northwestTileCoordinates.y,
        imageryLevel
    );
    if (
        Math.abs(northwestTileRectangle.south - tile.rectangle.north) <
        veryCloseY &&
        northwestTileCoordinates.y < southeastTileCoordinates.y
    ) {
        ++northwestTileCoordinates.y;
    }
    if (
        Math.abs(northwestTileRectangle.east - tile.rectangle.west) < veryCloseX &&
        northwestTileCoordinates.x < southeastTileCoordinates.x
    ) {
        ++northwestTileCoordinates.x;
    }

    const southeastTileRectangle = imageryTilingScheme.tileXYToRectangle(
        southeastTileCoordinates.x,
        southeastTileCoordinates.y,
        imageryLevel
    );
    if (
        Math.abs(southeastTileRectangle.north - tile.rectangle.south) <
        veryCloseY &&
        southeastTileCoordinates.y > northwestTileCoordinates.y
    ) {
        --southeastTileCoordinates.y;
    }
    if (
        Math.abs(southeastTileRectangle.west - tile.rectangle.east) < veryCloseX &&
        southeastTileCoordinates.x > northwestTileCoordinates.x
    ) {
        --southeastTileCoordinates.x;
    }

    // Create TileImagery instances for each imagery tile overlapping this terrain tile.
    // We need to do all texture coordinate computations in the imagery tile's tiling scheme.

    const terrainRectangle = Cesium.Rectangle.clone(
        tile.rectangle,
        terrainRectangleScratch
    );
    let imageryRectangle = imageryTilingScheme.tileXYToRectangle(
        northwestTileCoordinates.x,
        northwestTileCoordinates.y,
        imageryLevel
    );
    let clippedImageryRectangle = Cesium.Rectangle.intersection(
        imageryRectangle,
        imageryBounds,
        clippedRectangleScratch
    );

    let imageryTileXYToRectangle;
    if (useWebMercatorT) {
        imageryTilingScheme.rectangleToNativeRectangle(
            terrainRectangle,
            terrainRectangle
        );
        imageryTilingScheme.rectangleToNativeRectangle(
            imageryRectangle,
            imageryRectangle
        );
        imageryTilingScheme.rectangleToNativeRectangle(
            clippedImageryRectangle,
            clippedImageryRectangle
        );
        imageryTilingScheme.rectangleToNativeRectangle(
            imageryBounds,
            imageryBounds
        );
        imageryTileXYToRectangle = imageryTilingScheme.tileXYToNativeRectangle.bind(
            imageryTilingScheme
        );
        veryCloseX = terrainRectangle.width / 512.0;
        veryCloseY = terrainRectangle.height / 512.0;
    } else {
        imageryTileXYToRectangle = imageryTilingScheme.tileXYToRectangle.bind(
            imageryTilingScheme
        );
    }

    for (let i = northwestTileCoordinates.x; i <= southeastTileCoordinates.x; i++) {

        imageryRectangle = imageryTileXYToRectangle(
            i,
            northwestTileCoordinates.y,
            imageryLevel
        );
        clippedImageryRectangle = Cesium.Rectangle.simpleIntersection(
            imageryRectangle,
            imageryBounds,
            clippedRectangleScratch
        );

        if (!Cesium.defined(clippedImageryRectangle)) {
            continue;
        }

        for (let j = northwestTileCoordinates.y; j <= southeastTileCoordinates.y; j++) {
            imageryRectangle = imageryTileXYToRectangle(i, j, imageryLevel);
            clippedImageryRectangle = Cesium.Rectangle.simpleIntersection(
                imageryRectangle,
                imageryBounds,
                clippedRectangleScratch
            );

            if (!Cesium.defined(clippedImageryRectangle)) {
                continue;
            }
            tiles.push({
                x: i,
                y: j,
                z: imageryLevel
            });
        }
    }
    return tiles;
}

function VectorTileLayerProvider(options) {

    if (!Cesium.defined(options)) {
        throw new Cesium.DeveloperError("options is required.");
    }
    if (!Cesium.defined(options.type)) {
        throw new Cesium.DeveloperError("type is required.");
    }

    this._errorEvent = new Cesium.Event();

    // create a tile 1px x 1px of color white to simulate an empty background
    this._canvas = document.createElement('canvas');
    this._canvas.width = 1;
    this._canvas.height = 1;

    this._id = options.id;
    this._url = options.url;
    this._map = options.map;
    this._layerName = options.layerName;
    this._type = Cesium.defaultValue(options.type, 'geojson');
    this._layerNamePropertyKey = Cesium.defaultValue(options.layerNamePropertyKey, '__layer__');
    this._tileWidth = Cesium.defaultValue(options.tileWidth, 256);
    this._maximumLevel = Cesium.defaultValue(options.minimumLevel, 24);
    this._tileTolerance = Cesium.defaultValue(options.tileTolerance, 3);
    this._tileBuffer = Cesium.defaultValue(options.tileBuffer, 0);
    this._stylePromise = Cesium.defaultValue(options.stylePromise, null);
    this._geojson = Cesium.defaultValue(options.geojson, { type: 'FeatureCollection', features: [] });

    this._styleHashId = uuid();
    this._tileIndex = null;
    this._tilingScheme = new Cesium.WebMercatorTilingScheme();
    this._terrainProvider = this._map?.terrainProvider;
    this._globe = this._map?.scene?.globe;
    this._tileHeight = this._tileWidth;

    this._cachedTileDataSources = {};
    this._visibleTileDataSources = [];

    this._requestTypes = {
        wfs: requestGeoJSONVectorTiles,
        geojson: requestGeoJSONVectorTiles,
        mvt: requestVectorTiles,
        wms: requestVectorTiles
    };

    this._tileExtent = 4096;
    this._rectangle = Cesium.Rectangle.MAX_VALUE;

    this._ready = false;

    const readyPromises = {
        'wfs': () => provideGeoJSONLibsVT(([geojsonvt, turfFlatten]) => axios.get(this._url, {
            params: {
                service: 'WFS',
                typeName: this._layerName,
                version: '1.1.0',
                request: 'GetFeature',
                outputFormat: 'application/json',
                srsname: 'EPSG:4326'
            }
        })
            .then(({ data }) => {
                this._tileWidth = 256;
                this._tileHeight = this._tileWidth;
                const flattenData = turfFlatten(data);
                this._tileIndex = geojsonvt(flattenData, {
                    extent: this._tileExtent,
                    tolerance: this._tileTolerance,
                    buffer: this._tileBuffer,
                    maxZoom: this._maximumLevel,
                    generateId: !flattenData?.features?.[0]?.id
                });
                return true;
            })),
        'geojson': () => provideGeoJSONLibsVT(([geojsonvt, turfFlatten]) => new Promise(resolve => {
            this._tileWidth = 256;
            this._tileHeight = this._tileWidth;
            const flattenData = turfFlatten(this._geojson);
            this._tileIndex = geojsonvt(flattenData, {
                extent: this._tileExtent,
                tolerance: this._tileTolerance,
                buffer: this._tileBuffer,
                maxZoom: this._maximumLevel
            });
            resolve(true);
        })),
        'mvt': () => axios.get(this._url)
            .then(({ data }) => {
                if (data?.tilejson) {
                    const tiles = castArray(data?.tiles || this._url);
                    this._url = tiles[0];
                    this._rectangle = data?.bounds
                        ? Cesium.Rectangle.fromDegrees(...data.bounds)
                        : this._rectangle;
                }
                this._ready = true;
            })
            .catch(() => {
                this._ready = true;
            })
    };

    this._readyPromise = (readyPromises[this._type] ? readyPromises[this._type]() : Promise.resolve(true))
        .then(() => {
            this._ready = true;
        });

    this._mergedDataSource = new Cesium.CustomDataSource('merged');

    this._globe.tileLoadProgressEvent.addEventListener((progress) => {
        if (progress === 0) {
            // _tilesToRender is a private property not exposed by the API
            // https://community.cesium.com/t/does-quadtreeprimitive-still-support-in-cesium-1-32/5422/4
            const tilesToRender = [...this._globe?._surface?._tilesToRender];
            const tiles = tilesToRender
                .reduce((acc, qTile) => [
                    ...acc,
                    ...createTileSkeletons({
                        tile: qTile,
                        terrainProvider: this._terrainProvider,
                        tilingScheme: this._tilingScheme,
                        maximumLevel: this._maximumLevel,
                        minimumLevel: undefined,
                        rectangle: this._rectangle,
                        tileWidth: this._tileWidth
                    })
                ], [])
                .map((tile) => {
                    const radiansRectangle = this._tilingScheme.tileXYToRectangle(tile.x, tile.y, tile.z);
                    return {
                        ...tile,
                        rectangle: Cesium.Rectangle.fromRadians(
                            radiansRectangle.west,
                            radiansRectangle.south,
                            radiansRectangle.east,
                            radiansRectangle.north
                        )
                    };
                })
                .sort((a, b) => a.z - b.z);
            this._visibleTileDataSources.forEach((id) => {
                if (this._cachedTileDataSources[id]) {
                    this._cachedTileDataSources[id].dataSource.show = false;
                }
            });
            this._visibleTileDataSources = [];
            tiles.forEach(({ x, y, z }) => {
                const id = `${z}:${x}:${y}`;
                if (this._cachedTileDataSources[id]) {
                    this._cachedTileDataSources[id].dataSource.show = true;
                    if (!this._cachedTileDataSources[id].added) {
                        this._map.dataSources.add(this._cachedTileDataSources[id].dataSource);
                        this._cachedTileDataSources[id].added = true;
                    }
                    if (this._stylePromise && this._cachedTileDataSources[id].styleHashId !== this._styleHashId) {
                        this._stylePromise(this._cachedTileDataSources[id].dataSource)
                            .then(() => {
                                this._cachedTileDataSources[id].styleHashId = this._styleHashId;
                                this._map.scene.requestRender();
                            });
                    }
                    this._visibleTileDataSources.push(id);
                }
            });
        }
    });
}

Object.defineProperties(VectorTileLayerProvider.prototype, {
    proxy: {
        get: function() {
            return undefined;
        }
    },
    tileWidth: {
        get: function() {
            return this._tileWidth;
        }
    },
    tileHeight: {
        get: function() {
            return this._tileHeight;
        }
    },
    maximumLevel: {
        get: function() {
            return undefined;
        }
    },
    minimumLevel: {
        get: function() {
            return undefined;
        }
    },
    tilingScheme: {
        get: function() {
            return this._tilingScheme;
        }
    },
    rectangle: {
        get: function() {
            return this._tilingScheme.rectangle;
        }
    },
    tileDiscardPolicy: {
        get: function() {
            return undefined;
        }
    },
    errorEvent: {
        get: function() {
            return this._errorEvent;
        }
    },
    ready: {
        get: function() {
            return this._ready;
        }
    },
    readyPromise: {
        get: function() {
            return this._readyPromise;
        }
    },
    credit: {
        get: function() {
            return undefined;
        }
    },
    hasAlphaChannel: {
        get: function() {
            return true;
        }
    }
});

VectorTileLayerProvider.prototype.getTileCredits = function() {
    return undefined;
};

VectorTileLayerProvider.prototype.requestImage = function(x, y, z) {
    const id = `${z}:${x}:${y}`;
    if (this._cachedTileDataSources[id]) {
        return Promise.resolve(this._canvas);
    }
    return this._requestTypes[this._type]({
        id: this._id,
        url: this._url && this._url
            .replace(/\{x\}/, x)
            .replace(/\{y\}/, y)
            .replace(/\{z\}/, z),
        rectangle: this._tilingScheme.tileXYToRectangle(x, y, z),
        layerNamePropertyKey: this._layerNamePropertyKey,
        tileIndex: this._tileIndex,
        tileExtent: this._tileExtent,
        x,
        y,
        z,
        map: this._map
    })
        .then((dataSource) => {
            if (dataSource) {
                this._cachedTileDataSources[id] = { dataSource, added: false };
            }
            return this._canvas;
        })
        .catch(() => {
            return this._canvas;
        });
};

VectorTileLayerProvider.prototype.pickFeatures = function() {
    return undefined;
};

VectorTileLayerProvider.prototype.destroy = function() {
    Object.keys(this._cachedTileDataSources).forEach((id) => {
        this._cachedTileDataSources[id].dataSource.entities.removeAll();
        this._map.dataSources.remove(this._cachedTileDataSources[id].dataSource);
    });
};

VectorTileLayerProvider.prototype.setStylePromise = function(stylePromise) {
    this._stylePromise = stylePromise;
    this._styleHashId = uuid();
    this._visibleTileDataSources.forEach((id) => {
        if (this._stylePromise && this._cachedTileDataSources[id].styleHashId !== this._styleHashId) {
            this._stylePromise(this._cachedTileDataSources[id].dataSource)
                .then(() => {
                    this._cachedTileDataSources[id].styleHashId = this._styleHashId;
                    this._map.scene.requestRender();
                });
        }
    });
};

export default VectorTileLayerProvider;
