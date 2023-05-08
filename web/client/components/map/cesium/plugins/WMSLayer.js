/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';
import * as Cesium from 'cesium';
import GeoServerBILTerrainProvider from '../../../../utils/cesium/GeoServerBILTerrainProvider';
import assign from 'object-assign';
import { isArray, isEqual } from 'lodash';
import WMSUtils from '../../../../utils/cesium/WMSUtils';
import { getAuthenticationParam, getURLs, getWMSVendorParams } from '../../../../utils/LayersUtils';
import { optionsToVendorParams } from '../../../../utils/VendorParamsUtils';
import { addAuthenticationToSLD, getAuthenticationHeaders } from '../../../../utils/SecurityUtils';

import { isVectorFormat } from '../../../../utils/VectorTileUtils';
import { reproject } from '../../../../utils/CoordinatesUtils';

const createCesiumProjection = (projection) => {
    function ProjProjection(ellipsoid) {
        this._ellipsoid = Cesium.defaultValue(ellipsoid, Cesium.Ellipsoid.WGS84);
    }

    Object.defineProperties(ProjProjection.prototype, {
        ellipsoid: {
            get: function () {
                return this._ellipsoid;
            }
        }
    });
    ProjProjection.prototype.project = function (cartographic, result) {
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        const { x, y } = reproject([lng, lat], 'EPSG:4326', projection);

        const z = cartographic.height;

        if (!Cesium.defined(result)) {
            return new Cesium.Cartesian3(x, y, z);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    ProjProjection.prototype.unproject = function (cartesian, result) {
        const { x: lng, y: lat } = reproject([cartesian.x, cartesian.y], projection, 'EPSG:4326');
        const latitude = Cesium.Math.toRadians(lat);
        const longitude = Cesium.Math.toRadians(lng);
        const height = cartesian.z;

        if (!Cesium.defined(result)) {
            return new Cesium.Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    return ProjProjection;
};


const createTilingScheme = () => {
    function WebMercatorTilingScheme(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        this._ellipsoid = Cesium.defaultValue(options.ellipsoid, Cesium.Ellipsoid.WGS84);
        this._numberOfLevelZeroTilesX = defaultValue(
            options.numberOfLevelZeroTilesX,
            1
        );
        this._numberOfLevelZeroTilesY = defaultValue(
            options.numberOfLevelZeroTilesY,
            1
        );
        const Projection = createCesiumProjection();
        this._projection = new Projection(this._ellipsoid);

        if (
            defined(options.rectangleSouthwestInMeters) &&
            defined(options.rectangleNortheastInMeters)
        ) {
            this._rectangleSouthwestInMeters = options.rectangleSouthwestInMeters;
            this._rectangleNortheastInMeters = options.rectangleNortheastInMeters;
        } else {
            const semimajorAxisTimesPi = this._ellipsoid.maximumRadius * Math.PI;
            this._rectangleSouthwestInMeters = new Cartesian2(
                -semimajorAxisTimesPi,
                -semimajorAxisTimesPi
            );
            this._rectangleNortheastInMeters = new Cartesian2(
                semimajorAxisTimesPi,
                semimajorAxisTimesPi
            );
        }

        const southwest = this._projection.unproject(
            this._rectangleSouthwestInMeters
        );
        const northeast = this._projection.unproject(
            this._rectangleNortheastInMeters
        );
        this._rectangle = new Rectangle(
            southwest.longitude,
            southwest.latitude,
            northeast.longitude,
            northeast.latitude
        );
    }

    Object.defineProperties(WebMercatorTilingScheme.prototype, {
        /**
         * Gets the ellipsoid that is tiled by this tiling scheme.
         * @memberof WebMercatorTilingScheme.prototype
         * @type {Ellipsoid}
         */
        ellipsoid: {
            get: function() {
                return this._ellipsoid;
            }
        },

        /**
         * Gets the rectangle, in radians, covered by this tiling scheme.
         * @memberof WebMercatorTilingScheme.prototype
         * @type {Rectangle}
         */
        rectangle: {
            get: function() {
                return this._rectangle;
            }
        },

        /**
         * Gets the map projection used by this tiling scheme.
         * @memberof WebMercatorTilingScheme.prototype
         * @type {MapProjection}
         */
        projection: {
            get: function() {
                return this._projection;
            }
        }
    });

    /**
     * Gets the total number of tiles in the X direction at a specified level-of-detail.
     *
     * @param {number} level The level-of-detail.
     * @returns {number} The number of tiles in the X direction at the given level.
     */
    WebMercatorTilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {
        return this._numberOfLevelZeroTilesX << level;
    };

    /**
     * Gets the total number of tiles in the Y direction at a specified level-of-detail.
     *
     * @param {number} level The level-of-detail.
     * @returns {number} The number of tiles in the Y direction at the given level.
     */
    WebMercatorTilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {
        return this._numberOfLevelZeroTilesY << level;
    };

    /**
     * Transforms a rectangle specified in geodetic radians to the native coordinate system
     * of this tiling scheme.
     *
     * @param {Rectangle} rectangle The rectangle to transform.
     * @param {Rectangle} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the native rectangle if 'result'
     *          is undefined.
     */
    WebMercatorTilingScheme.prototype.rectangleToNativeRectangle = function (
        rectangle,
        result
    ) {
        const projection = this._projection;
        const southwest = projection.project(Cesium.Rectangle.southwest(rectangle));
        const northeast = projection.project(Cesium.Rectangle.northeast(rectangle));


        if (!Cesium.defined(result)) {
            return new Cesium.Rectangle(southwest.x, southwest.y, northeast.x, northeast.y);
        }

        result.west = southwest.x;
        result.south = southwest.y;
        result.east = northeast.x;
        result.north = northeast.y;
        return result;
    };

    /**
     * Converts tile x, y coordinates and level to a rectangle expressed in the native coordinates
     * of the tiling scheme.
     *
     * @param {number} x The integer x coordinate of the tile.
     * @param {number} y The integer y coordinate of the tile.
     * @param {number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    WebMercatorTilingScheme.prototype.tileXYToNativeRectangle = function(
        x,
        y,
        level,
        result
    ) {
        const xTiles = this.getNumberOfXTilesAtLevel(level);
        const yTiles = this.getNumberOfYTilesAtLevel(level);

        const xTileWidth =
            (this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x) /
            xTiles;
        const west = this._rectangleSouthwestInMeters.x + x * xTileWidth;
        const east = this._rectangleSouthwestInMeters.x + (x + 1) * xTileWidth;

        const yTileHeight =
            (this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y) /
            yTiles;
        const north = this._rectangleNortheastInMeters.y - y * yTileHeight;
        const south = this._rectangleNortheastInMeters.y - (y + 1) * yTileHeight;

        if (!Cesium.defined(result)) {
            return new Cesium.Rectangle(west, south, east, north);
        }

        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Converts tile x, y coordinates and level to a cartographic rectangle in radians.
     *
     * @param {number} x The integer x coordinate of the tile.
     * @param {number} y The integer y coordinate of the tile.
     * @param {number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {object} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Rectangle} The specified 'result', or a new object containing the rectangle
     *          if 'result' is undefined.
     */
    WebMercatorTilingScheme.prototype.tileXYToRectangle = function(
        x,
        y,
        level,
        result
    ) {
        const nativeRectangle = this.tileXYToNativeRectangle(x, y, level, result);

        const projection = this._projection;
        const southwest = projection.unproject(
            new Cesium.Cartesian2(nativeRectangle.west, nativeRectangle.south)
        );
        const northeast = projection.unproject(
            new Cesium.Cartesian2(nativeRectangle.east, nativeRectangle.north)
        );

        nativeRectangle.west = southwest.longitude;
        nativeRectangle.south = southwest.latitude;
        nativeRectangle.east = northeast.longitude;
        nativeRectangle.north = northeast.latitude;
        return nativeRectangle;
    };

    /**
     * Calculates the tile x, y coordinates of the tile containing
     * a given cartographic position.
     *
     * @param {Cartographic} position The position.
     * @param {number} level The tile level-of-detail.  Zero is the least detailed.
     * @param {Cartesian2} [result] The instance to which to copy the result, or undefined if a new instance
     *        should be created.
     * @returns {Cartesian2} The specified 'result', or a new object containing the tile x, y coordinates
     *          if 'result' is undefined.
     */
    WebMercatorTilingScheme.prototype.positionToTileXY = function(
        position,
        level,
        result
    ) {
        const rectangle = this._rectangle;
        if (!Cesium.Rectangle.contains(rectangle, position)) {
            // outside the bounds of the tiling scheme
            return undefined;
        }

        const xTiles = this.getNumberOfXTilesAtLevel(level);
        const yTiles = this.getNumberOfYTilesAtLevel(level);

        const overallWidth =
            this._rectangleNortheastInMeters.x - this._rectangleSouthwestInMeters.x;
        const xTileWidth = overallWidth / xTiles;
        const overallHeight =
            this._rectangleNortheastInMeters.y - this._rectangleSouthwestInMeters.y;
        const yTileHeight = overallHeight / yTiles;

        const projection = this._projection;

        const webMercatorPosition = projection.project(position);
        const distanceFromWest =
            webMercatorPosition.x - this._rectangleSouthwestInMeters.x;
        const distanceFromNorth =
            this._rectangleNortheastInMeters.y - webMercatorPosition.y;

        let xTileCoordinate = (distanceFromWest / xTileWidth) | 0;
        if (xTileCoordinate >= xTiles) {
            xTileCoordinate = xTiles - 1;
        }
        let yTileCoordinate = (distanceFromNorth / yTileHeight) | 0;
        if (yTileCoordinate >= yTiles) {
            yTileCoordinate = yTiles - 1;
        }

        if (!Cesium.defined(result)) {
            return new Cesium.Cartesian2(xTileCoordinate, yTileCoordinate);
        }

        result.x = xTileCoordinate;
        result.y = yTileCoordinate;
        return result;
    };
};

function getQueryString(parameters) {
    return Object.keys(parameters).map((key) => key + '=' + encodeURIComponent(parameters[key])).join('&');
}

function wmsToCesiumOptionsSingleTile(options) {
    const opacity = options.opacity !== undefined ? options.opacity : 1;
    const params = optionsToVendorParams(options);
    const parameters = assign({
        styles: options.style || "",
        format: isVectorFormat(options.format) && 'image/png' || options.format || 'image/png',
        transparent: options.transparent !== undefined ? options.transparent : true,
        opacity: opacity,
        ...getWMSVendorParams(options),
        layers: options.name,
        width: options.size || 2000,
        height: options.size || 2000,
        bbox: "-180.0,-90,180.0,90",
        srs: "EPSG:4326"
    }, params || {}, getAuthenticationParam(options));

    const url = (isArray(options.url) ? options.url[Math.round(Math.random() * (options.url.length - 1))] : options.url) + '?service=WMS&version=1.1.0&request=GetMap&'
        + getQueryString(addAuthenticationToSLD(parameters, options));
    const headers = getAuthenticationHeaders(url, options.securityToken);
    return {
        url: new Cesium.Resource({
            url,
            headers,
            proxy: WMSUtils.getProxy(options)
        })
    };
}

function wmsToCesiumOptions(options) {
    var opacity = options.opacity !== undefined ? options.opacity : 1;
    const params = optionsToVendorParams(options);
    const cr = options.credits;
    const credit = cr ? new Cesium.Credit(cr.text || cr.title, cr.imageUrl, cr.link) : options.attribution;
    // NOTE: can we use opacity to manage visibility?
    const urls = getURLs(isArray(options.url) ? options.url : [options.url]);
    const headers = getAuthenticationHeaders(urls[0], options.securityToken);

    return assign({
        url: new Cesium.Resource({
            url: "{s}",
            headers,
            proxy: WMSUtils.getProxy(options)
        }),
        // #7516 this helps Cesium to use CORS requests in a proper way, even when headers are not
        // present in the Resource
        tileDiscardPolicy: options.tileDiscardPolicy === "none" ?
            undefined :
            (options.tileDiscardPolicy ?? new Cesium.NeverTileDiscardPolicy()),
        credit,
        subdomains: urls,
        layers: options.name,
        enablePickFeatures: false,
        parameters: assign({
            styles: options.style || "",
            format: isVectorFormat(options.format) && 'image/png' || options.format || 'image/png',
            transparent: options.transparent !== undefined ? options.transparent : true,
            opacity: opacity,
            tiled: options.tiled !== undefined ? options.tiled : true,
            width: options.tileSize || 256,
            height: options.tileSize || 256

        }, assign(
            {},
            (options._v_ ? { _v_: options._v_ } : {}),
            (params || {}),
            getAuthenticationParam(options)
        ))
    });
}

const createLayer = (options) => {
    let layer;
    if (options.useForElevation) {
        return new GeoServerBILTerrainProvider(WMSUtils.wmsToCesiumOptionsBIL(options));
    }
    if (options.singleTile) {
        layer = new Cesium.SingleTileImageryProvider(wmsToCesiumOptionsSingleTile(options));
    } else {
        layer = new Cesium.WebMapServiceImageryProvider(wmsToCesiumOptions(options));
    }

    layer.updateParams = (params) => {
        const newOptions = assign({}, options, {
            params: assign({}, options.params || {}, params)
        });
        return createLayer(newOptions);
    };
    return layer;
};
const updateLayer = (layer, newOptions, oldOptions) => {
    const requiresUpdate = (el) => WMSUtils.PARAM_OPTIONS.indexOf(el.toLowerCase()) >= 0;
    const newParams = newOptions && newOptions.params;
    const oldParams = oldOptions && oldOptions.params;
    const allParams = { ...newParams, ...oldParams };
    let newParameters = Object.keys({ ...newOptions, ...oldOptions, ...allParams })
        .filter(requiresUpdate)
        .filter((key) => {
            const oldOption = oldOptions[key] === undefined ? oldParams && oldParams[key] : oldOptions[key];
            const newOption = newOptions[key] === undefined ? newParams && newParams[key] : newOptions[key];
            return !isEqual(oldOption, newOption);
        });
    if (newParameters.length > 0 ||
        newOptions.securityToken !== oldOptions.securityToken ||
        !isEqual(newOptions.layerFilter, oldOptions.layerFilter) ||
        newOptions.tileSize !== oldOptions.tileSize) {
        return createLayer(newOptions);
    }
    return null;
};
Layers.registerType('wms', { create: createLayer, update: updateLayer });
