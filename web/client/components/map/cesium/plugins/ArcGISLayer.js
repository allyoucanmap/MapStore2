/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Layers from '../../../../utils/cesium/Layers';

import * as Cesium from 'cesium';

Layers.registerType('arcgis', {
    create: (options) => {
        return new Cesium.ArcGisMapServerImageryProvider({
            url: options.url,
            layers: `${options.name}`,
            usePreCachedTilesIfAvailable: false
            // token,
            // credit
        });
    }
});
