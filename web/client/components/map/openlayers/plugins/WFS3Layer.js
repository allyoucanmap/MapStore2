/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/openlayers/Layers';
import ol from 'openlayers';
import { head } from 'lodash';
import urlParser from 'url';
import { readStyle, writeStyle } from '../../../../utils/StyleParser';
import CoordinatesUtils from '../../../../utils/CoordinatesUtils';
import MapUtils from '../../../../utils/MapUtils';
import SecurityUtils from '../../../../utils/SecurityUtils';

const getStyleBody = ({ style, availableStyles }) => {
    if (!availableStyles) return null;
    const styleObj = style && head(availableStyles.filter(({ name }) => name === style))
        || head(availableStyles.filter(({ link }) => link && link.type.indexOf('sld') !== -1 ));
    return styleObj && styleObj.styleBody;
};

const applyStyle = ({ style, availableStyles }, layer) => {

    if (!availableStyles) return null;

    const styleObj = style && head(availableStyles.filter(({ name }) => name === style))
        || head(availableStyles.filter(({ link }) => link && link.type.indexOf('sld') !== -1 ));

    readStyle(styleObj.styleBody, 'sld')
        .then((styles) => {
            writeStyle(styles, 'ol')
                .then((olStyle) => {
                    layer.setStyle(olStyle);
                });
        });
};
const createLayer = (options) => {

    const srs = CoordinatesUtils.normalizeSRS(options.srs || 'EPSG:3857', options.allowedSRS);
    const projection = ol.proj.get(srs);
    const metersPerUnit = projection.getMetersPerUnit();

    const tilingScheme = head(options.tilingSchemes
        && options.tilingSchemes.schemes
        && options.tilingSchemes.schemes.filter(({ supportedCRS }) => supportedCRS === srs));

    const { identifier: tilingSchemeId, tileMatrix, boundingBox } = tilingScheme || {};
    const scales = tileMatrix && tileMatrix.map(({ scaleDenominator }) => scaleDenominator);
    const mapResolutions = MapUtils.getResolutions();

    const scaleToResolution = s => s * 0.28E-3 / metersPerUnit;
    const matrixResolutions = options.resolutions || scales && scales.map(scaleToResolution);
    const resolutions = matrixResolutions || mapResolutions;

    const switchOriginXY = projection.getAxisOrientation().substr(0, 2) === 'ne';
    const origins = tileMatrix && tileMatrix
        .map(({ topLeftCorner } = {}) => topLeftCorner)
        .map(([ x, y ] = []) => switchOriginXY ? [y, x] : [x, y]);

    const tileSizes = tileMatrix && tileMatrix
        .map(({tileWidth, tileHeight}) => [tileWidth, tileHeight]);

    const bbox = options.bbox;

    const extent = bbox
        ? ol.extent.applyTransform([
                parseFloat(bbox.bounds.minx),
                parseFloat(bbox.bounds.miny),
                parseFloat(bbox.bounds.maxx),
                parseFloat(bbox.bounds.maxy)
            ], ol.proj.getTransform(bbox.crs, options.srs))
        : null;

    const tileGridExtent = boundingBox && boundingBox.lowerCorner && boundingBox.upperCorner
        ? [
            ...boundingBox.lowerCorner,
            ...boundingBox.upperCorner
        ]
        : null;

    const tileGrid = new ol.tilegrid.TileGrid({
        extent: tileGridExtent,
        minZoom: 0,
        origins,
        origin: !origins ? [20037508.3428, -20037508.3428] : undefined,
        resolutions,
        tileSizes,
        tileSize: !tileSizes ? [256, 256] : undefined
    });

    let url = (options.url || '')
        .replace(/\{tilingSchemeId\}/, tilingSchemeId)
        .replace(/\{level\}/, '{z}')
        .replace(/\{row\}/, '{y}')
        .replace(/\{col\}/, '{x}');

    let queryParameters = { };
    SecurityUtils.addAuthenticationParameter(url, queryParameters, options.securityToken);

    const layerUrl = decodeURI(url);
    const queryParametersString = urlParser.format({ query: { ...queryParameters } });

    const source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileGrid,
        url: layerUrl + queryParametersString
    });

    const layer = new ol.layer.VectorTile({
        extent,
        msId: options.id,
        source: source,
        visible: options.visibility !== false,
        zIndex: options.zIndex
    });

    applyStyle(options, layer);

    return layer;
};
Layers.registerType('wfs3', {
    create: createLayer,
    update: (layer, newOptions, oldOptions) => {
        const oldStyle = getStyleBody(oldOptions);
        const newStyle = getStyleBody(newOptions);
        if (oldStyle !== newStyle) {
            applyStyle(newOptions, layer);
        }

        if (oldOptions.securityToken !== newOptions.securityToken
        || oldOptions.srs !== newOptions.srs) {
            return createLayer(newOptions);
        }
        return null;
    },
    render: () => {
        return null;
    }
});
