/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Layers from '../../../../utils/openlayers/Layers';

const createLayer = function(options, map, mapId) {
    const layer = Layers.createLayer(options.type, {...options, visibility: false}, map, mapId);
    return layer;
};

const updateLayer = function(layer, newOptions, oldOptions, map, mapId) {
    const style = newOptions.style && (newOptions.style.body || [])
            .filter(({ sourceLayer }) => sourceLayer === newOptions.name)[0];
    const newLayer = Layers.updateLayer(newOptions.type, layer, {...newOptions, visibility: !!style, style}, oldOptions, map, mapId);
    return newLayer;
};

Layers.registerType('collection', { create: createLayer, update: updateLayer });
