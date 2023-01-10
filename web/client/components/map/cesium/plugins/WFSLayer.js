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
import axios from '../../../../libs/ajax';
import { getFeature } from '../../../../api/WFS';
import { needsReload } from '../../../../utils/WFSLayerUtils';
import { optionsToVendorParams } from '../../../../utils/VendorParamsUtils';
import {
    getStyle,
    layerToGeoStylerStyle,
    applyDefaultStyleToLayer
} from '../../../../utils/VectorStyleUtils';
import VectorTileLayerProvider from '../../../../utils/cesium/VectorTileLayerProvider';

const requestFeatures = (options, params, cancelToken) => {
    return getFeature(options.url, options.name, {
        // ...(!params?.CQL_FILTER && { bbox: [minx, miny, maxx, maxy, projection].join(',') }),
        outputFormat: 'application/json',
        srsname: 'EPSG:4326',
        ...params
    }, {
        cancelToken
    });
};

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
    const params = optionsToVendorParams(options);
    if (options.tiled !== false) {
        return new VectorTileLayerProvider({
            id: options.id,
            map,
            url: options.url,
            layerName: options.name,
            params,
            type: 'wfs',
            stylePromise: createStylePromise(options, map)
        });
    }
    let dataSource = new Cesium.GeoJsonDataSource(options?.id);

    const cancelToken = axios.CancelToken;
    const source = cancelToken.source();

    if (options.visibility) {
        requestFeatures(options, params, source.token)
            .then(({ data: collection }) => {
                dataSource.load(collection, {
                    // ensure default style is not applied
                    stroke: new Cesium.Color(0, 0, 0, 0),
                    fill: new Cesium.Color(0, 0, 0, 0),
                    markerColor: new Cesium.Color(0, 0, 0, 0),
                    strokeWidth: 0,
                    markerSize: 0
                }).then(() => {
                    map.dataSources.add(dataSource);
                    createStylePromise(options, map)(dataSource);
                });
            });
    }

    dataSource.show = !!options.visibility;
    dataSource.queryable = options.queryable === undefined || options.queryable;

    return {
        detached: true,
        dataSource,
        remove: () => {
            if (source?.cancel) {
                source.cancel();
            }
            if (dataSource && map) {
                map.dataSources.remove(dataSource);
                dataSource = undefined;
            }
        },
        setVisible: () => {}
    };
};

Layers.registerType('wfs', {
    create: createLayer,
    update: (layer, newOptions, oldOptions, map) => {
        if (needsReload(oldOptions, newOptions)
        || newOptions.visibility !== oldOptions.visibility
        || newOptions.tiled !== oldOptions.tiled) {
            return createLayer(newOptions, map);
        }
        if ((layer?.dataSource?.entities?.values || layer?.setStylePromise)
            && (
                !isEqual(newOptions.style, oldOptions.style)
                || newOptions.opacity !== oldOptions.opacity
            )
        ) {
            const stylePromise = createStylePromise(newOptions, map);
            if (newOptions.tiled !== false) {
                layer.setStylePromise(stylePromise);
            } else {
                stylePromise(layer.dataSource);
            }
        }
        return null;
    }
});
