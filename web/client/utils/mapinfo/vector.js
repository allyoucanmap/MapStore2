/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isObject, isNil } from 'lodash';
import { Observable } from 'rxjs';
import { getCurrentResolution } from '../MapUtils';

export default {
    buildRequest: (layer, { map, buffer, point, currentLocale } = {}, infoFormat, viewer, featureInfo) => {
        const { features = [] } = point?.intersectedFeatures?.find(({ id }) => id === layer.id) || {};
        return {
            request: {
                features: [...features],
                outputFormat: 'application/json'
            },
            metadata: {
                title: isObject(layer.title)
                    ? layer.title[currentLocale] || layer.title.default
                    : layer.title,
                regex: layer.featureInfoRegex,
                viewer: layer.viewer ?? viewer,
                featureInfo,
                fields: layer.features?.[0]?.properties && Object.keys(layer.features[0].properties) || [],
                resolution: isNil(map?.resolution)
                    ? map?.zoom && getCurrentResolution(map.zoom, 0, 21, 96)
                    : map.resolution,
                buffer: buffer || 2,
                units: map?.units,
                rowViewer: layer.rowViewer,
                layerId: layer.id
            },
            url: 'client'
        };
    },
    getIdentifyFlow: (layer, baseURL, defaultParams) => {
        const { features = [] } = defaultParams;
        return Observable.of({
            data: {
                features
            }
        });
    }
};
