/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Layers = require('../../../../utils/openlayers/Layers');
const {getStyle} = require('../VectorStyle');
const olmsStylefunction = require('ol-mapbox-style/stylefunction').default;
const ol = require('openlayers');
const { isEqual, head, castArray, get } = require('lodash');
const uuidv1 = require('uuid/v1');
const url = require('url');
const {
    Reader: sldReader,
    OlStyler: sldOlStyler,
    getGeometryStyles: sldGetGeometryStyles,
    getLayerNames: sldGetLayerNames,
    getLayer: sldGetLayer,
    getRules: sldGetRules
} = require('@nieuwlandgeo/sldreader/src/index');

let ICONS = {};

const getSpriteUrl = (sprite) => {
    const spriteUrl = sprite && url.parse(sprite);
    return spriteUrl && spriteUrl.host && spriteUrl.path && `${spriteUrl.protocol}//${spriteUrl.host}${spriteUrl.path}`
        || spriteUrl && spriteUrl.path && `${window.location.protocol}//${window.location.host}${spriteUrl.path}`;
};

const makeValidMBStyle = (mbsStyle = {}, layer = {}) => {
    const name = layer.name;
    const spriteUrl = mbsStyle.sprite && url.parse(mbsStyle.sprite);
    const sprite = spriteUrl && spriteUrl.host && spriteUrl.path && `${spriteUrl.protocol}//${spriteUrl.host}${spriteUrl.path}`
        || spriteUrl && spriteUrl.path && `${window.location.protocol}//${window.location.host}${spriteUrl.path}`;
    return {
        version: 8,
        name,
        sources: {
            [name]: {
                type: 'vector'
            }
        },
        ...(sprite ? {sprite} : {}),
        layers: (mbsStyle.layers || [])
            .map(style => ({
                ...style,
                id: uuidv1(),
                source: name
            }))
    };
};

const loadImages = (srcs, callback = () => {}) => {
    let srcCount = srcs.length;
    srcs.forEach(src => {
        if (ICONS[src]) {
            srcCount--;
            if (srcCount === 0) callback();
        } else {
            const img = new Image();
            img.onload = () => {
                const maxSide = img.naturalWidth > img.naturalHeight ? img.naturalWidth : img.naturalHeight;
                ICONS[src] = {
                    src,
                    img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    maxSide
                };
                srcCount--;
                if (srcCount === 0) callback();
            };
            img.onerror = () => {
                srcCount--;
                if (srcCount === 0) callback();
            };
            img.src = src;
        }
    });
};

const styleParser = {
    mbs: ({styleBody, spriteData, sprite}, options, olLayer) => {
        const styleFunction = olmsStylefunction(olLayer, makeValidMBStyle(styleBody, options), options.name, undefined, spriteData, getSpriteUrl(sprite));
        olLayer.setStyle(styleFunction);
    },
    sld: ({styleBody}, options, olLayer) => {
        if (!styleBody) return null;
        const styledLayerDescriptor = sldReader(styleBody);
        const layerNames = sldGetLayerNames(styledLayerDescriptor);
        const defaultLayerName = head(layerNames.filter(name => name.toLowerCase().indexOf('default') !== -1));
        const Z_INDEX_STEP_LAYER = 5000;
        const zIndexLayers = layerNames.reduce((indexes, name, idx) => ({...indexes, [name]: idx * Z_INDEX_STEP_LAYER}), {});

        const iconsSRCs = (styledLayerDescriptor && styledLayerDescriptor.layers || [])
            .reduce((layers, layer) =>
                [...layers, ...(layer.styles || [])
                    .reduce((styles, style) =>
                        [...styles, ...(style.featuretypestyles || [])
                        .reduce((featuretypestyles, featuretype) =>
                            [...featuretypestyles, ...(featuretype.rules || [])
                                .filter(rule => get(rule, 'pointsymbolizer.graphic.externalgraphic.onlineresource'))
                                .map(rule => get(rule, 'pointsymbolizer.graphic.externalgraphic.onlineresource'))],
                        [])],
                    [])],
                []);

        loadImages(iconsSRCs, () => {

            const styleFunction = (olFeature, resolution) => {

                const geometry = olFeature.getGeometry();
                const geometryType = geometry.getType();
                const properties = olFeature.getProperties();
                const layerName = properties.layer && (layerNames || []).indexOf(properties.layer) !== -1 ? properties.layer : defaultLayerName;
                const layer = sldGetLayer(styledLayerDescriptor, layerName);

                if (!layer) return null;

                const olFeaturedTypeStyles = (layer.styles || [])
                    .reduce((newStyles, style) => ([...newStyles, ...(style.featuretypestyles || [])]), [])
                    .map(featuretypestyle => {
                        const filteredRules = sldGetRules(featuretypestyle, {geometry, properties}, resolution);
                        const geomStyle = sldGetGeometryStyles(filteredRules);
                        const polygon = geomStyle.polygon.map(pol => ({stroke: {css: {stroke: 'rgba(0, 0, 0, 0)'}}, ...pol}));
                        return {
                            olStyles: sldOlStyler(
                                {...geomStyle, polygon},
                                geometryType,
                                properties,
                                ICONS
                            ),
                            zIndexes: filteredRules
                                .map(filteredRule => head(featuretypestyle.rules.map((rule, idx) => isEqual(rule, filteredRule) ? idx : null)
                                .filter(val => val !== null)))
                        };
                    });

                const Z_INDEX_STEP_FTS = Z_INDEX_STEP_LAYER / olFeaturedTypeStyles.length;

                return olFeaturedTypeStyles.reduce((plainOlStyles, {olStyles, zIndexes}, idx) => {
                    return [
                        ...plainOlStyles,
                        ...olStyles.map((olStyle /*, jdx*/) => {
                            const zIndex = (zIndexLayers[layerName] || 0) + Z_INDEX_STEP_FTS * idx; /*- zIndexes[jdx];*/
                            olStyle.setZIndex(zIndex);
                            return olStyle;
                        })
                    ];
                }, []);
            };

            olLayer.setStyle(styleFunction);
        });
        return (olFeature, resolution) => {

            const geometry = olFeature.getGeometry();
            const geometryType = geometry.getType();
            const properties = olFeature.getProperties();
            const layerName = properties.layer && (layerNames || []).indexOf(properties.layer) !== -1 ? properties.layer : defaultLayerName;
            const layer = sldGetLayer(styledLayerDescriptor, layerName);

            if (!layer) return null;

            const olFeaturedTypeStyles = (layer.styles || [])
                .reduce((newStyles, style) => ([...newStyles, ...(style.featuretypestyles || [])]), [])
                .map(featuretypestyle => {
                    const filteredRules = sldGetRules(featuretypestyle, {geometry, properties}, resolution);
                    const geomStyle = sldGetGeometryStyles(filteredRules);
                    const polygon = geomStyle.polygon.map(pol => ({stroke: {css: {stroke: 'rgba(0, 0, 0, 0)'}}, ...pol}));
                    return {
                        olStyles: sldOlStyler(
                            {...geomStyle, polygon},
                            geometryType
                        ),
                        zIndexes: filteredRules
                            .map(filteredRule => head(featuretypestyle.rules.map((rule, idx) => isEqual(rule, filteredRule) ? idx : null)
                            .filter(val => val !== null)))
                    };
                });

            const Z_INDEX_STEP_FTS = Z_INDEX_STEP_LAYER / olFeaturedTypeStyles.length;

            return olFeaturedTypeStyles.reduce((plainOlStyles, {olStyles, zIndexes}, idx) => {
                return [
                    ...plainOlStyles,
                    ...olStyles.map((olStyle, jdx) => {
                        const zIndex = (zIndexLayers[layerName] || 0) + Z_INDEX_STEP_FTS * idx - zIndexes[jdx];
                        olStyle.setZIndex(zIndex);
                        return olStyle;
                    })
                ];
            }, []);
        };
    }
};

Layers.registerType('vectortile', {
    create: (options) => {
        const layerUrl = head(castArray(options.url));
        const tileGrid = !options.srs || options.srs === 'EPSG:3857' || options.srs === 'EPSG:900913' ?
            ol.tilegrid.createXYZ()
            : new ol.tilegrid.TileGrid({
                extent: [-180, -90, 180, 90],
                minZoom: 0,
                maxZoom: 21,
                origin: [-180, 90],
                resolutions: [
                    0.703125,
                    0.3515625,
                    0.17578125,
                    0.087890625,
                    0.0439453125,
                    0.02197265625,
                    0.010986328125,
                    0.0054931640625,
                    0.00274658203125,
                    0.001373291015625,
                    0.0006866455078125,
                    0.0003433227539062,
                    0.0001716613769531,
                    0.0000858306884766,
                    0.0000429153442383,
                    0.0000214576721191,
                    0.0000107288360596,
                    0.0000053644180298,
                    0.0000026822090149,
                    0.0000013411045074,
                    0.0000006705522537,
                    0.0000003352761269
                ]
            });

        const tilematrixset = options.srs === 'EPSG:3857' && 'EPSG:900913' || options.srs;

        const query = {
            layer: options.name,
            tilematrixset,
            Service: 'WMTS',
            Request: 'GetTile',
            Version: '1.0.0',
            Format: options.format,
            style: '',
            TileMatrix: `${tilematrixset}:{z}`,
            TileCol: '{x}',
            TileRow: '{y}'
        };

        const parsedUrl = url.parse(layerUrl);
        const requestUrl = url.format({...parsedUrl, query});

        const source = new ol.source.VectorTile({
            format: new ol.format.MVT(),
            tileGrid,
            url: decodeURI(requestUrl)
        });

        const layer = new ol.layer.VectorTile({
            msId: options.id,
            source: source,
            visible: options.visibility !== false,
            zIndex: options.zIndex
        });

        const currentStyle = options.style && head((options.availableStyles || []).filter(({name}) => name === (options.style || options.availableStyles && options.availableStyles[0] && options.availableStyles[0].name)));

        if (currentStyle && currentStyle.format && currentStyle.styleBody && styleParser[currentStyle.format]) {
            styleParser[currentStyle.format](currentStyle, options, layer);
        } else {
            layer.setStyle(getStyle(options));
        }
        return layer;
    },
    update: (layer, newOptions, oldOptions) => {

        const oldCrs = oldOptions.crs || oldOptions.srs || 'EPSG:3857';
        const newCrs = newOptions.crs || newOptions.srs || 'EPSG:3857';
        if (newCrs !== oldCrs) {
            layer.getSource().forEachFeature((f) => {
                f.getGeometry().transform(oldCrs, newCrs);
            });
        }
        const oldStyle = oldOptions.availableStyles && head((oldOptions.availableStyles || []).filter(({name}) => name === (oldOptions.style || oldOptions.availableStyles && oldOptions.availableStyles[0] && oldOptions.availableStyles[0].name)));
        const newStyle = newOptions.availableStyles && head((newOptions.availableStyles || []).filter(({name}) => name === (newOptions.style || newOptions.availableStyles && newOptions.availableStyles[0] && newOptions.availableStyles[0].name)));

        if (!isEqual(oldStyle, newStyle)) {
            if (newStyle && newStyle.format && newStyle.styleBody && styleParser[newStyle.format]) {
                styleParser[newStyle.format](newStyle, newOptions, layer);
            } else {
                layer.setStyle(getStyle(newOptions));
            }
        }
    },
    render: () => {
        return null;
    }
});
