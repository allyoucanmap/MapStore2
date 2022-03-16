/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import urlUtil from 'url';

import { isArray, castArray, get, filter, isEmpty, includes, uniq, isNil } from 'lodash';
import assign from 'object-assign';
import xml2js from 'xml2js';
import { getResolutionObject } from "../utils/MapUtils";

import axios from '../libs/ajax';
import { getConfigProp, cleanDuplicatedQuestionMarks } from '../utils/ConfigUtils';
import { getWMSBoundingBox } from '../utils/CoordinatesUtils';
import Rx from "rxjs";
import { getLayerTitleTranslations } from '../utils/LayersUtils';
import { getAvailableInfoFormat } from "../utils/MapInfoUtils";
import {
    extractOGCServicesReferences,
    toURLArray,
    removeParameters,
    buildSRSMap,
    getRecordLinks
} from '../utils/CatalogUtils';
const capabilitiesCache = {};


export const parseUrl = (urls) => {
    const url = (isArray(urls) && urls || urls.split(','))[0];
    const parsed = urlUtil.parse(url, true);
    return urlUtil.format(assign({}, parsed, {search: null}, {
        query: assign({
            service: "WMS",
            version: "1.3.0",
            request: "GetCapabilities"
        }, parsed.query)
    }));
};

/**
 * Extract `credits` property from layer's Attribution
 * (Web Map Service Implementation Specification OGC 01-068r3 - 7.1.4.5.9 )
 * @param {object} attribution Attribution object of WMS Capabilities (parsed with xml2js default format)
 * @return {object} an object to place in `credits` attribute of layer with the structure in the example.
 * @example
 * {
 *     title: "content of <Title></Title>",
 *     imageUrl: "url of the image linked as LogoURL",
 *     link: "http://some.site.of.reference",
 *     logo: { // more info about the logo
 *         format: "image/png",
 *         width: "200",
 *         height: "100"
 *     }
 * }
 *
 */
export const extractCredits = attribution => {
    const title = attribution && attribution.Title;
    const logo = attribution.LogoURL && {
        ...(get(attribution, 'LogoURL.$') || {}),
        format: get(attribution, 'LogoURL.Format') // e.g. image/png
    };
    const link = get(attribution, 'OnlineResource.$["xlink:href"]');
    return {
        title,
        logo,
        imageUrl: get(attribution, 'LogoURL.OnlineResource.$["xlink:href"]'),
        link
    };
};


export const flatLayers = (root) => {
    return root.Layer ? (isArray(root.Layer) && root.Layer || [root.Layer]).reduce((previous, current) => {
        return previous.concat(flatLayers(current)).concat(current.Layer && current.Name ? [current] : []);
    }, []) : root.Name && [root] || [];
};
export const getOnlineResource = (c) => {
    return c.Request && c.Request.GetMap && c.Request.GetMap.DCPType && c.Request.GetMap.DCPType.HTTP && c.Request.GetMap.DCPType.HTTP.Get && c.Request.GetMap.DCPType.HTTP.Get.OnlineResource && c.Request.GetMap.DCPType.HTTP.Get.OnlineResource.$ || undefined;
};
export const searchAndPaginate = (json = {}, startPosition, maxRecords, text) => {
    const root = (json.WMS_Capabilities || json.WMT_MS_Capabilities || {}).Capability;
    const service = (json.WMS_Capabilities || json.WMT_MS_Capabilities || {}).Service;
    const onlineResource = getOnlineResource(root);
    const SRSList = root.Layer && (root.Layer.SRS || root.Layer.CRS)?.map((crs) => crs.toUpperCase()) || [];
    const credits = root.Layer && root.Layer.Attribution && extractCredits(root.Layer.Attribution);
    const rootFormats = root.Request && root.Request.GetMap && root.Request.GetMap.Format || [];
    const layersObj = flatLayers(root);
    const layers = isArray(layersObj) ? layersObj : [layersObj];
    const filteredLayers = layers
        .filter((layer) => !text || layer.Name.toLowerCase().indexOf(text.toLowerCase()) !== -1 || layer.Title && layer.Title.toLowerCase().indexOf(text.toLowerCase()) !== -1 || layer.Abstract && layer.Abstract.toLowerCase().indexOf(text.toLowerCase()) !== -1);
    return {
        numberOfRecordsMatched: filteredLayers.length,
        numberOfRecordsReturned: Math.min(maxRecords, filteredLayers.length),
        nextRecord: startPosition + Math.min(maxRecords, filteredLayers.length) + 1,
        service,
        layerOptions: {
            version: (json.WMS_Capabilities || json.WMT_MS_Capabilities)?.$?.version || '1.3.0'
        },
        records: filteredLayers
            .filter((layer, index) => index >= startPosition - 1 && index < startPosition - 1 + maxRecords)
            .map((layer) => assign({}, layer, { formats: rootFormats, onlineResource, SRS: SRSList, credits: layer.Attribution ? extractCredits(layer.Attribution) : credits}))
    };
};

export const getDimensions = (layer) => {
    return castArray(layer.Dimension || layer.dimension || []).map((dim, index) => {
        const extent = (layer.Extent && castArray(layer.Extent)[index] || layer.extent && castArray(layer.extent)[index]);
        return {
            name: dim.$.name,
            units: dim.$.units,
            unitSymbol: dim.$.unitSymbol,
            "default": dim.$.default || (extent && extent.$.default),
            values: dim._ && dim.split(',') || extent && extent._ && extent.split(',')
        };
    });
};
export const getCapabilities = (url, raw) => {
    const parsed = urlUtil.parse(url, true);
    const getCapabilitiesUrl = urlUtil.format(assign({}, parsed, {
        query: assign({
            service: "WMS",
            version: "1.1.1",
            request: "GetCapabilities"
        }, parsed.query)
    }));
    return new Promise((resolve) => {
        require.ensure(['../utils/ogc/WMS'], () => {
            const {unmarshaller} = require('../utils/ogc/WMS');
            resolve(axios.get(parseUrl(getCapabilitiesUrl)).then((response) => {
                if (raw) {
                    let json;
                    xml2js.parseString(response.data, {explicitArray: false}, (ignore, result) => {
                        json = result;
                    });
                    return json;
                }
                let json = unmarshaller.unmarshalString(response.data);
                return json && json.value;
            }));
        });
    });
};
export const describeLayer = (url, layers, options = {}) => {
    const parsed = urlUtil.parse(url, true);
    const describeLayerUrl = urlUtil.format(assign({}, parsed, {
        query: assign({
            service: "WMS",
            version: "1.1.1",
            layers: layers,
            request: "DescribeLayer"
        },
        parsed.query,
        options.query || {})
    }));
    return new Promise((resolve) => {
        require.ensure(['../utils/ogc/WMS'], () => {
            const {unmarshaller} = require('../utils/ogc/WMS');
            resolve(axios.get(parseUrl(describeLayerUrl)).then((response) => {
                let json = unmarshaller.unmarshalString(response.data);
                return json && json.value && json.value.layerDescription && json.value.layerDescription[0];

            }));
        });
    });
};
export const getRecords = (url, startPosition, maxRecords, text) => {
    const cached = capabilitiesCache[url];
    if (cached && new Date().getTime() < cached.timestamp + (getConfigProp('cacheExpire') || 60) * 1000) {
        return new Promise((resolve) => {
            resolve(searchAndPaginate(cached.data, startPosition, maxRecords, text));
        });
    }
    return axios.get(parseUrl(url)).then((response) => {
        let json;
        xml2js.parseString(response.data, {explicitArray: false}, (ignore, result) => {
            json = result;
        });
        capabilitiesCache[url] = {
            timestamp: new Date().getTime(),
            data: json
        };
        return searchAndPaginate(json, startPosition, maxRecords, text);
    });
};
export const describeLayers = (url, layers) => {
    const parsed = urlUtil.parse(url, true);
    const describeLayerUrl = urlUtil.format(assign({}, parsed, {
        query: assign({
            service: "WMS",
            version: "1.1.1",
            layers: layers,
            request: "DescribeLayer"
        }, parsed.query)
    }));
    return axios.get(parseUrl(describeLayerUrl)).then((response) => {
        let decriptions;
        xml2js.parseString(response.data, {explicitArray: false}, (ignore, result) => {
            decriptions = result && result.WMS_DescribeLayerResponse && result.WMS_DescribeLayerResponse.LayerDescription;
        });
        decriptions = Array.isArray(decriptions) ? decriptions : [decriptions];
        // make it compatible with json format of describe layer
        return decriptions.map(desc => ({
            ...(desc && desc.$ || {}),
            layerName: desc && desc.$ && desc.$.name,
            query: {
                ...(desc && desc.query && desc.query.$ || {})
            }
        }));
    });
};
export const textSearch = (url, startPosition, maxRecords, text) => {
    return getRecords(url, startPosition, maxRecords, text);
};
export const parseLayerCapabilities = (capabilities, layer, lyrs) => {
    const layers = castArray(lyrs || get(capabilities, "capability.layer.layer"));
    return layers.reduce((previous, capability) => {
        if (previous) {
            return previous;
        }
        if (!capability.name && capability.layer) {
            return parseLayerCapabilities(capabilities, layer, castArray(capability.layer));
        } else if (layer.name.split(":").length === 2 && capability.name && capability.name.split(":").length === 2) {
            return layer.name === capability.name && capability;
        } else if (capability.name && capability.name.split(":").length === 2) {
            return (layer.name === capability.name.split(":")[1]) && capability;
        } else if (layer.name.split(":").length === 2) {
            return layer.name.split(":")[1] === capability.name && capability;
        }
        return layer.name === capability.name && capability;
    }, null);
};
export const getBBox = (record, bounds) => {
    let layer = record;
    let bbox = (layer.EX_GeographicBoundingBox || layer.exGeographicBoundingBox || getWMSBoundingBox(layer.BoundingBox) || (layer.LatLonBoundingBox && layer.LatLonBoundingBox.$) || layer.latLonBoundingBox);
    while (!bbox && layer.Layer && layer.Layer.length) {
        layer = layer.Layer[0];
        bbox = (layer.EX_GeographicBoundingBox || layer.exGeographicBoundingBox || getWMSBoundingBox(layer.BoundingBox) || (layer.LatLonBoundingBox && layer.LatLonBoundingBox.$) || layer.latLonBoundingBox);
    }
    if (!bbox) {
        bbox = {
            westBoundLongitude: -180.0,
            southBoundLatitude: -90.0,
            eastBoundLongitude: 180.0,
            northBoundLatitude: 90.0
        };
    }
    const catalogBounds = {
        extent: [
            bbox.westBoundLongitude || bbox.minx,
            bbox.southBoundLatitude || bbox.miny,
            bbox.eastBoundLongitude || bbox.maxx,
            bbox.northBoundLatitude || bbox.maxy
        ],
        crs: "EPSG:4326"
    };
    if (bounds) {
        return {
            crs: catalogBounds.crs,
            bounds: {
                minx: catalogBounds.extent[0],
                miny: catalogBounds.extent[1],
                maxx: catalogBounds.extent[2],
                maxy: catalogBounds.extent[3]
            }
        };
    }
    return catalogBounds;
};
export const reset = () => {
    Object.keys(capabilitiesCache).forEach(key => {
        delete capabilitiesCache[key];
    });
};

export const preprocess = (service) => {
    let { domainAliases } = service;
    service.domainAliases = filter(domainAliases);
    return Rx.Observable.of(service);
};

export const getCatalogRecords = (records, options) => {
    if (records && records.records) {
        return records.records.map((record) => {
            const references = [{
                type: "OGC:WMS",
                url: options && options.url,
                SRS: (record.SRS && (isArray(record.SRS) ? record.SRS : [record.SRS])) || [],
                params: {
                    name: record.Name
                }
            }];
            const { wms: ogcReferences } = extractOGCServicesReferences({ references });
            return {
                serviceType: 'wms',
                isValid: !!ogcReferences,
                capabilities: record,
                credits: record.credits,
                boundingBox: getBBox(record),
                description: record.Abstract || record.Title || record.Name,
                identifier: record.Name,
                service: records.service,
                tags: "",
                layerOptions: {
                    ...(options?.layerOptions || {}),
                    ...(records?.layerOptions || {})
                },
                title: getLayerTitleTranslations(record) || record.Name,
                formats: castArray(record.formats || []),
                dimensions: (record.Dimension && castArray(record.Dimension) || []).map((dim) => assign({}, {
                    values: dim._ && dim._.split(',') || []
                }, dim.$ || {}))
                // TODO: re-enable when support to inline values is full (now timeline miss snap, auto-select and forward-backward buttons enabled/disabled for this kind of values)
                // TODO: replace with capabilities URL service. something like this:
                    /*
                    .map(dim => dim && dim.name !== "time" ? dim : {
                        ...dim,
                        values: undefined, <-- remove values (they can be removed from dimension's epic instead, using them as initial value)
                        source: { <-- add the source
                            type: "wms-capabilities",
                            url: options.url
                        }
                    })
                    */
                    // excludes time from dimensions. TODO: remove when time from WMS capabilities is supported
                    .filter(dim => dim && dim.name !== "time"),

                references,
                ogcReferences
            };
        });
    }
    return null;
};


export const recordToLayer = (record, {
    removeParams = [],
    format,
    catalogURL,
    url,
    formats = {},
    map = {},
    layerBaseConfig,
    localizedLayerStyles
} = {}) => {
    if (!record || !record.references) {
        // we don't have a valid record so no buttons to add
        return null;
    }
    // let's extract the references we need
    const { wms: ogcServiceReference } = extractOGCServicesReferences(record);

    // typically you should remove authkey parameters
    const cleanURL = URL => removeParameters(cleanDuplicatedQuestionMarks(URL), ["request", "layer", "layers", "service", "version"].concat(removeParams));
    let originalUrl;
    let params;
    const urls = toURLArray(ogcServiceReference.url);

    // extract additional parameters and alternative URLs.
    if (urls && isArray(urls)) {
        originalUrl = urls.map( u => cleanURL(u)).map( ({url: u}) => u);
        params = urls.map(u => cleanURL(u)).map(({params: p}) => p).reduce( (prev, cur) => ({...prev, ...cur}), {});
    } else {
        const { url: uu, params: pp } = cleanURL(urls || catalogURL);
        originalUrl = uu;
        params = pp;
    }

    // calculate and normalize URL
    // if array of 1 element, take simply the string
    const toLayerURL = u => isArray(u) && u.length === 1 ? u[0] : u;
    const layerURL = toLayerURL(url || originalUrl);

    const allowedSRS = buildSRSMap(ogcServiceReference.SRS);
    const {
        MaxScaleDenominator: maxScaleDenominator,
        MinScaleDenominator: minScaleDenominator
    } = record?.capabilities ?? {};

    let layer = {
        type: 'wms',
        requestEncoding: record.requestEncoding, // WMTS KVP vs REST, KVP by default
        style: record.style,
        format,
        url: layerURL,
        capabilitiesURL: record.capabilitiesURL,
        queryable: record.queryable,
        visibility: true,
        dimensions: record.dimensions || [],
        name: ogcServiceReference.params && ogcServiceReference.params.name,
        title: record.title || ogcServiceReference.params && ogcServiceReference.params.name,
        description: record.description || "",
        credits: !getConfigProp("noCreditsFromCatalog") && record.credits,
        bbox: {
            crs: record.boundingBox.crs,
            bounds: {
                minx: record.boundingBox.extent[0],
                miny: record.boundingBox.extent[1],
                maxx: record.boundingBox.extent[2],
                maxy: record.boundingBox.extent[3]
            }
        },
        links: getRecordLinks(record),
        params: params,
        allowedSRS: allowedSRS,
        catalogURL,
        ...layerBaseConfig,
        ...record.layerOptions,
        localizedLayerStyles: !isNil(localizedLayerStyles) ? localizedLayerStyles : undefined
    };

    if (!isEmpty(formats)) {
        layer = {...layer, imageFormats: formats.imageFormats, infoFormats: formats.infoFormats};
    }
    if (!isEmpty(map) && (maxScaleDenominator || minScaleDenominator)) {
        const {resolution: minResolution} = !isNil(minScaleDenominator)
        && getResolutionObject(minScaleDenominator, 'scale', map) || {};
        const {resolution: maxResolution} = !isNil(maxScaleDenominator)
        && getResolutionObject(maxScaleDenominator, 'scale', map) || {};
        layer = {...layer, minResolution, maxResolution};
    }

    return layer;
};

export const getLayerFromRecord = (record, options) => {
    return Promise.resolve(recordToLayer(record, options));
};


export const DEFAULT_FORMAT_WMS = [{
    label: 'image/png',
    value: 'image/png'
}, {
    label: 'image/png8',
    value: 'image/png8'
}, {
    label: 'image/jpeg',
    value: 'image/jpeg'
}, {
    label: 'image/vnd.jpeg-png',
    value: 'image/vnd.jpeg-png'
}, {
    label: 'image/vnd.jpeg-png8',
    value: 'image/vnd.jpeg-png8'
}, {
    label: 'image/gif',
    value: 'image/gif'
}];

/**
 * Get unique array of supported info formats
 * @return {array} info formats
 */
export const getUniqueInfoFormats = () => {
    return uniq(Object.values(getAvailableInfoFormat()));
};

/**
 * Fetch the supported formats of the WMS service
 * @param url
 * @param includeGFIFormats
 * @return {object|string} formats
 */
export const getSupportedFormat = (url, includeGFIFormats = false) => {
    return getCapabilities(url).then((caps) => {
        let getMapFormats = get(caps, 'capability.request.getMap.format', []);
        let imageFormats;
        if (!isEmpty(getMapFormats)) {
            const defaultFormats = DEFAULT_FORMAT_WMS.map(({value}) => value);
            getMapFormats = getMapFormats.map(({value})=> ({label: value, value}));
            imageFormats = getMapFormats.filter(({value})=> includes(defaultFormats, value)) || [];
        } else {
            imageFormats = DEFAULT_FORMAT_WMS;
        }

        let infoFormats;
        if (includeGFIFormats) {
            let getFeatureInfoFormats = get(caps, 'capability.request.getFeatureInfo.format', []);
            const defaultFormats = getUniqueInfoFormats();
            if (!isEmpty(getFeatureInfoFormats)) {
                getFeatureInfoFormats = getFeatureInfoFormats.map(({value})=> value);
                infoFormats = uniq(getFeatureInfoFormats.filter((value)=> includes(defaultFormats, value))) || [];
            } else {
                infoFormats = defaultFormats;
            }
        }
        return includeGFIFormats ? {imageFormats, infoFormats} : imageFormats;
    }).catch(()=>
        // Fallback to default formats on exception
        includeGFIFormats ? {imageFormats: DEFAULT_FORMAT_WMS, infoFormats: getUniqueInfoFormats()} : DEFAULT_FORMAT_WMS);
};

const Api = {
    flatLayers,
    parseUrl,
    getDimensions,
    getCapabilities,
    describeLayer,
    getRecords,
    describeLayers,
    textSearch,
    parseLayerCapabilities,
    getBBox,
    reset,
    preprocess,
    getCatalogRecords,
    getSupportedFormat,
    recordToLayer,
    getLayerFromRecord
};

export default Api;
