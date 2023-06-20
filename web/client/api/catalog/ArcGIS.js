/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '../../libs/ajax';
import { Observable } from 'rxjs';
import { isValidURLTemplate } from '../../utils/URLUtils';
import { preprocess as commonPreprocess } from './common';

function validateUrl(serviceUrl) {
    /* if (isValidURLTemplate(serviceUrl)) {
        return true;
    }*/
    return true;
}

const recordToLayer = (record, { map }) => {
    if (!record) {
        return null;
    }
    /*
    if (autoSetVisibilityLimits && !isEmpty(map) && (maxScaleDenominator || minScaleDenominator)) {
        const {resolution: minResolution} = !isNil(minScaleDenominator)
        && getResolutionObject(minScaleDenominator, 'scale', map) || {};
        const {resolution: maxResolution} = !isNil(maxScaleDenominator)
        && getResolutionObject(maxScaleDenominator, 'scale', map) || {};
        layer = {...layer, minResolution, maxResolution};
    }*/
    return {
        type: 'arcgis',
        url: record.url,
        name: record.name,
        title: record.title,
        visibility: true,
        search: {
            type: 'arcgis',
            url: record.url
        }
    };
};

const getRecords = (url, startPosition, maxRecords, text, info) => {
    return axios.get(url, {
        params: {
            f: 'pjson'
        }
    })
        .then(({ data }) => {
            console.log(data);
            const records = (data?.layers || []).map((layer) => {
                return {
                    ...layer,
                    url
                };
            });
            return {
                numberOfRecordsMatched: data?.layers?.length || 0,
                numberOfRecordsReturned: data?.layers?.length,
                records
            };
        });
};

export const preprocess = commonPreprocess;
export const testService = (service) => Observable.of(service);
export const textSearch = (url, startPosition, maxRecords, text, info) => getRecords(url, startPosition, maxRecords, text, info);
export const getCatalogRecords = (response) => {
    return response?.records
        ? response.records.map(record => {
            // const { version, bbox, format, properties } = record;
            const identifier = `${record.id}:${record.name}`;
            return {
                serviceType: 'arcgis',
                isValid: true,
                description: record.description,
                title: record.name,
                identifier,
                url: record.url,
                thumbnail: null,
                // ...(bbox && { bbox }),
                // ...(format && { format }),
                // ...(properties && { properties }),
                references: [],
                name: record.id
            };
        })
        : null;
};
export const getLayerFromRecord = (record, options, asPromise) => {
    const layer = recordToLayer(record, options);
    return asPromise ? Promise.resolve(layer) : layer;
};
export const validate = (service) => {
    if (service.title && validateUrl(service.url)) {
        return Observable.of(service);
    }
    const error = new Error("catalog.config.notValidURLTemplate");
    // insert valid URL;
    throw error;
};
