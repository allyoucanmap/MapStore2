/**
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';
import isEqual from 'lodash/isEqual';
import {
    getStyle,
    layerToGeoStylerStyle,
    applyDefaultStyleToLayer
} from '../../../../utils/VectorStyleUtils';
import VectorTileLayerProvider from '../../../../utils/cesium/VectorTileLayerProvider';

const createStylePromise = (options, map) => (dataSource) => layerToGeoStylerStyle(options)
    .then((style) => {
        getStyle(applyDefaultStyleToLayer({ ...options, style }), 'cesium')
            .then((styleFunc) => {
                if (styleFunc) {
                    styleFunc({
                        entities: dataSource.entities.values,
                        map,
                        opacity: options.opacity ?? 1
                    }).then(() => {
                        map.scene.requestRender();
                    });
                }
            });
    });

const createLayer = (options, map) => {
    return new VectorTileLayerProvider({
        id: options.id,
        map,
        url: options.url,
        type: options.provider || 'mvt',
        stylePromise: createStylePromise(options, map),
        tileWidth: 256
    });
};

Layers.registerType('vector-tile', {
    create: createLayer,
    update: (layer, newOptions, oldOptions, map) => {
        if (layer?.setStylePromise
            && (
                !isEqual(newOptions.style, oldOptions.style)
                || newOptions.opacity !== oldOptions.opacity
            )
        ) {
            const stylePromise = createStylePromise(newOptions, map);
            layer.setStylePromise(stylePromise);
        }
        return null;
    }
});
