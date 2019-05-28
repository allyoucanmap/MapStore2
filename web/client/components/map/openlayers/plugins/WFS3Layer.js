/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/openlayers/Layers';
import ol from 'openlayers';
import { getStyle } from '../VectorStyle';
import { get } from 'lodash';
/*
const applyStyle = (options, layer) => {
    const { format } = options.style;
    const styleFunc = format === 'css' ? styleParser.sld : styleParser[format] || styleParser.mapstore;
    if (options.name !== options.originalName && format === 'mbstyle') {
        const name = options.originalName && options.originalName.replace(/\//g, '_') || options.name;
        const styles = [ options.style ].map(({ ...sty}) => ({ ...sty, layer: name }));
        if (styleFunc) styleFunc({ ...options.style, styleBody: wrapSplittedStyle(format, styles, name) }, options, layer);
        return null;
    }
    if (styleFunc) styleFunc({ ...options.style, styleBody: wrapSplittedStyle(format, [ options.style ], name) }, options, layer);
    return null;
};*/

Layers.registerType('wfs3', {
    create: (options) => {

        const layerUrl = options.url
            .replace(/\{tilingSchemeId\}/, options.tilingSchemeId || 'GoogleMapsCompatible')
            .replace(/\{level\}/, '{z}')
            .replace(/\{row\}/, '{y}')
            .replace(/\{col\}/, '{x}');

        const tileGrid = options.tilingSchemeId === 'GoogleMapsCompatible' || !options.tilingSchemeId ?
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

        const source = new ol.source.VectorTile({
            format: new ol.format.MVT(),
            tileGrid,
            url: decodeURI(layerUrl)
        });

        const style = getStyle(options);
        const layer = new ol.layer.VectorTile({
            msId: options.id,
            source: source,
            visible: options.visibility !== false,
            zIndex: options.zIndex,
            style
        });

        return layer;
    },
    update: (layer, newOptions, oldOptions) => {
        const oldStyle = get(oldOptions, 'style');
        const newStyle = get(newOptions, 'style');
        if (oldStyle !== newStyle) {
            layer.setVisible(true);
            layer.setStyle(getStyle({style: newStyle}));
            return layer;
        }
        return null;
    },
    render: () => {
        return null;
    }
});
