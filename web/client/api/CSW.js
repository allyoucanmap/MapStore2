/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import urlUtil from 'url';

import { get, head, last, template, isNil, isString, includes, castArray, sortBy, uniq, isArray } from 'lodash';
import assign from 'object-assign';

import axios from '../libs/ajax';
import {cleanDuplicatedQuestionMarks, getConfigProp} from '../utils/ConfigUtils';
import { extractCrsFromURN, makeBboxFromOWS, makeNumericEPSG } from '../utils/CoordinatesUtils';
import WMS from "../api/WMS";
import { getMessageById } from '../utils/LocaleUtils';
import { extractEsriReferences, extractOGCServicesReferences } from '../utils/CatalogUtils';


const parseUrl = (url) => {
    const parsed = urlUtil.parse(url, true);
    return urlUtil.format(assign({}, parsed, {search: null}, {
        query: assign({
            service: "CSW",
            version: "2.0.2"
        }, parsed.query, {request: undefined})
    }));
};

const getBaseCatalogUrl = (url) => {
    return url && url.replace(/\/csw$/, "/");
};

// Try to find thumb from dc documents works both with geonode pycsw and geosolutions-csw
const getThumb = (dc) => {
    let refs = Array.isArray(dc.references) ? dc.references : [dc.references];
    return head([].filter.call( refs, (ref) => {
        return ref.scheme === "WWW:LINK-1.0-http--image-thumbnail" || ref.scheme === "thumbnail" || (ref.scheme === "WWW:DOWNLOAD-1.0-http--download" && (ref.value || "").indexOf(`${dc.identifier || ""}-thumb`) !== -1) || (ref.scheme === "WWW:DOWNLOAD-REST_MAP" && (ref.value || "").indexOf(`${dc.identifier || ""}-thumb`) !== -1);
    }));
};

// Extract the relevant information from the wms URL for (RNDT / INSPIRE)
const extractWMSParamsFromURL = wms => {
    const params = new URLSearchParams(wms.value);
    const lowerCaseParams = new URLSearchParams();
    for (const [name, value] of params) {
        lowerCaseParams.append(name.toLocaleLowerCase(), value);
    }
    const layerName = lowerCaseParams.get('layers');
    const wmsVersion = lowerCaseParams.get('version');
    if (layerName) {
        return {
            ...wms,
            protocol: 'OGC:WMS',
            name: layerName,
            value: `${wms.value.match( /[^\?]+[\?]+/g)}SERIVCE=WMS${wmsVersion && `&VERSION=${wmsVersion}`}`
        };
    }
    return false;
};

const getMetaDataDownloadFormat = (protocol) => {
    const formatsMap = [
        {
            protocol: 'https://registry.geodati.gov.it/metadata-codelist/ProtocolValue/www-download',
            displayValue: 'Download'
        },
        {
            protocol: 'http://www.opengis.net/def/serviceType/ogc/wms',
            displayValue: 'WMS'
        },
        {
            protocol: 'http://www.opengis.net/def/serviceType/ogc/wfs',
            displayValue: 'WFS'
        }
    ];
    const format = formatsMap.filter(formatItem => (formatItem.protocol === protocol))[0]?.displayValue;
    return format ?? 'Link';
};

const getURILinks = (metadata, locales, uriItem) => {
    let itemName = uriItem.name;
    if (itemName === undefined) {
        itemName = metadata.title ? metadata.title.join(' ') : getMessageById(locales, "catalog.notAvailable");
        const downloadFormat = getMetaDataDownloadFormat(uriItem.protocol, uriItem.value);
        itemName = `${downloadFormat ? `${itemName} - ${downloadFormat}` : itemName}`;
    }
    return (`<li><a target="_blank" href="${uriItem.value}">${itemName}</a></li>`);
};

export const esriToLayer = (record, { layerBaseConfig = {} } = {}) => {
    if (!record || !record.references) {
        // we don't have a valid record so no buttons to add
        return null;
    }
    // let's extract the references we need
    const {esri} = extractEsriReferences(record);
    return {
        type: esri.type,
        url: esri.url,
        visibility: true,
        dimensions: record.dimensions || [],
        name: esri.params && esri.params.name,
        bbox: {
            crs: record.boundingBox.crs,
            bounds: {
                minx: record.boundingBox.extent[0],
                miny: record.boundingBox.extent[1],
                maxx: record.boundingBox.extent[2],
                maxy: record.boundingBox.extent[3]
            }
        },
        ...layerBaseConfig
    };

};

const defaultStaticFilter =
    `<ogc:Or>
            <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>dc:type</ogc:PropertyName>
                <ogc:Literal>dataset</ogc:Literal>
            </ogc:PropertyIsEqualTo>
            <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>dc:type</ogc:PropertyName>
                <ogc:Literal>http://purl.org/dc/dcmitype/Dataset</ogc:Literal>
            </ogc:PropertyIsEqualTo>
       </ogc:Or>`;

const defaultDynamicFilter = "<ogc:PropertyIsLike wildCard='%' singleChar='_' escapeChar='\\'>" +
    "<ogc:PropertyName>csw:AnyText</ogc:PropertyName> " +
    "<ogc:Literal>%${searchText}%</ogc:Literal> " +
    "</ogc:PropertyIsLike> ";

export const cswGetRecordsXml = '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" ' +
    'xmlns:ogc="http://www.opengis.net/ogc" ' +
    'xmlns:gml="http://www.opengis.net/gml" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
    'xmlns:dct="http://purl.org/dc/terms/" ' +
    'xmlns:gmd="http://www.isotc211.org/2005/gmd" ' +
    'xmlns:gco="http://www.isotc211.org/2005/gco" ' +
    'xmlns:gmi="http://www.isotc211.org/2005/gmi" ' +
    'xmlns:ows="http://www.opengis.net/ows" service="CSW" version="2.0.2" resultType="results" startPosition="${startPosition}" maxRecords="${maxRecords}"> ' +
    '<csw:Query typeNames="csw:Record"> ' +
    '<csw:ElementSetName>full</csw:ElementSetName> ' +
    '<csw:Constraint version="1.1.0"> ' +
    '<ogc:Filter> ' +
    '${filterXml} ' +
    '</ogc:Filter> ' +
    '</csw:Constraint> ' +
    '</csw:Query> ' +
    '</csw:GetRecords>';

/**
 * Construct XML body to get records from the CSW service
 * @param {object} [options] the options to pass to withIntersectionObserver enhancer.
 * @param {number} startPosition
 * @param {number} maxRecords
 * @param {string} searchText
 * @param {object} filter object holds static and dynamic filter configured for the CSW service
 * @param {object} filter.staticFilter filter to fetch all record applied always i.e even when no search text is present
 * @param {object} filter.dynamicFilter filter when search text is present and is applied in conjunction with static filter
 * @return {string} constructed xml string
 */
export const constructXMLBody = (startPosition, maxRecords, searchText, {filter} = {}) => {
    const staticFilter = filter?.staticFilter || defaultStaticFilter;
    const dynamicFilter = `<ogc:And>
        ${template(filter?.dynamicFilter || defaultDynamicFilter)({searchText})}
        ${staticFilter}
    </ogc:And>`;
    return template(cswGetRecordsXml)({filterXml: !searchText ? staticFilter : dynamicFilter, startPosition, maxRecords});
};

let capabilitiesCache = {};

/**
 * Add capabilities data to CSW records
 * Currently limited to only scale denominators (visibility limits)
 * @param {string} url wms url
 * @param {object} result csw results object
 */
const addCapabilitiesToRecords = (url, result) => {
    const cached = capabilitiesCache[url];
    const isCached = cached && new Date().getTime() < cached.timestamp + (getConfigProp('cacheExpire') || 60) * 1000;
    return Promise.resolve(
        isCached
            ? cached.data
            : WMS.getCapabilities(url + '?version=')
                .then((caps)=> get(caps, 'capability.layer.layer', []))
                .catch(()=> []))
        .then((layers) => {
            if (!isCached) {
                capabilitiesCache[url] = {
                    timestamp: new Date().getTime(),
                    data: layers
                };
            }
            // Add visibility limits scale data of the layer to the record
            return {
                ...result,
                records: result?.records?.map(record=> {
                    const {
                        minScaleDenominator: MinScaleDenominator,
                        maxScaleDenominator: MaxScaleDenominator
                    } = layers.find(l=> l.name === record?.dc?.identifier) || {};
                    return {
                        ...record,
                        ...((!isNil(MinScaleDenominator) || !isNil(MaxScaleDenominator))
                        && {capabilities: {MaxScaleDenominator, MinScaleDenominator}})
                    };
                })
            };
        });
};

export const recordToLayer = (record, options) => {
    switch (record.layerType) {
    case 'wms':
        return WMS.recordToLayer(record, options);
    case 'esri':
        return esriToLayer(record, options);
    default:
        return null;
    }
};
/**
 * API for local config
 */
var Api = {
    parseUrl,
    getRecordById: function(catalogURL) {
        return new Promise((resolve) => {
            require.ensure(['../utils/ogc/CSW'], () => {
                resolve(axios.get(catalogURL)
                    .then((response) => {
                        if (response) {
                            const {unmarshaller} = require('../utils/ogc/CSW');
                            const json = unmarshaller.unmarshalString(response.data);
                            if (json && json.name && json.name.localPart === "GetRecordByIdResponse" && json.value && json.value.abstractRecord) {
                                let dcElement = json.value.abstractRecord[0].value.dcElement;
                                if (dcElement) {
                                    let dc = {
                                        references: []
                                    };
                                    for (let j = 0; j < dcElement.length; j++) {
                                        let dcel = dcElement[j];
                                        let elName = dcel.name.localPart;
                                        let finalEl = {};
                                        /* Some services (e.g. GeoServer) support http://schemas.opengis.net/csw/2.0.2/record.xsd only
                                        * Usually they publish the WMS URL at dct:"references" with scheme=OGC:WMS
                                        * So we place references as they are.
                                        */
                                        if (elName === "references" && dcel.value) {
                                            let urlString = dcel.value.content && cleanDuplicatedQuestionMarks(dcel.value.content[0]) || dcel.value.content || dcel.value;
                                            finalEl = {
                                                value: urlString,
                                                scheme: dcel.value.scheme
                                            };
                                        } else {
                                            finalEl = dcel.value.content && dcel.value.content[0] || dcel.value.content || dcel.value;
                                        }
                                        if (dc[elName] && Array.isArray(dc[elName])) {
                                            dc[elName].push(finalEl);
                                        } else if (dc[elName]) {
                                            dc[elName] = [dc[elName], finalEl];
                                        } else {
                                            dc[elName] = finalEl;
                                        }
                                    }
                                    return {dc};
                                }
                            } else if (json && json.name && json.name.localPart === "ExceptionReport") {
                                return {
                                    error: json.value.exception && json.value.exception.length && json.value.exception[0].exceptionText || 'GenericError'
                                };
                            }
                            return null;
                        }
                        return null;
                    }));
            });
        });
    },
    getRecords: function(url, startPosition, maxRecords, filter, options) {
        return new Promise((resolve) => {
            require.ensure(['../utils/ogc/CSW', '../utils/ogc/Filter'], () => {
                const {CSW, marshaller, unmarshaller } = require('../utils/ogc/CSW');
                let body = marshaller.marshalString({
                    name: "csw:GetRecords",
                    value: CSW.getRecords(startPosition, maxRecords, typeof filter !== "string" && filter)
                });
                if (!filter || typeof filter === "string") {
                    body = constructXMLBody(startPosition, maxRecords, filter, options);
                }
                resolve(axios.post(parseUrl(url), body, { headers: {
                    'Content-Type': 'application/xml'
                }}).then(
                    (response) => {
                        if (response ) {
                            let json = unmarshaller.unmarshalString(response.data);
                            if (json && json.name && json.name.localPart === "GetRecordsResponse" && json.value && json.value.searchResults) {
                                let rawResult = json.value;
                                let rawRecords = rawResult.searchResults.abstractRecord || rawResult.searchResults.any;
                                let result = {
                                    numberOfRecordsMatched: rawResult.searchResults.numberOfRecordsMatched,
                                    numberOfRecordsReturned: rawResult.searchResults.numberOfRecordsReturned,
                                    nextRecord: rawResult.searchResults.nextRecord
                                    // searchStatus: rawResult.searchStatus
                                };
                                let records = [];
                                let _dcRef;
                                if (rawRecords) {
                                    for (let i = 0; i < rawRecords.length; i++) {
                                        let rawRec = rawRecords[i].value;
                                        let obj = {
                                            dateStamp: rawRec.dateStamp && rawRec.dateStamp.date,
                                            fileIdentifier: rawRec.fileIdentifier && rawRec.fileIdentifier.characterString && rawRec.fileIdentifier.characterString.value,
                                            identificationInfo: rawRec.abstractMDIdentification && rawRec.abstractMDIdentification.value
                                        };
                                        if (rawRec.boundingBox) {
                                            let bbox;
                                            let crs;
                                            let el;
                                            if (Array.isArray(rawRec.boundingBox)) {
                                                el = head(rawRec.boundingBox);
                                            } else {
                                                el = rawRec.boundingBox;
                                            }
                                            if (el && el.value) {
                                                const crsValue = el.value?.crs ?? '';
                                                const urn = crsValue.match(/[\w-]*:[\w-]*:[\w-]*:[\w-]*:[\w-]*:[^:]*:(([\w-]+\s[\w-]+)|[\w-]*)/)?.[0];
                                                const epsg = makeNumericEPSG(crsValue.match(/EPSG:[0-9]+/)?.[0]);

                                                let lc = el.value.lowerCorner;
                                                let uc = el.value.upperCorner;

                                                const extractedCrs = epsg || (extractCrsFromURN(urn) || last(crsValue.split(':')));

                                                if (!extractedCrs) {
                                                    crs = 'EPSG:4326';
                                                } else if (extractedCrs.slice(0, 5) === 'EPSG:') {
                                                    crs = makeNumericEPSG(extractedCrs);
                                                } else {
                                                    crs = makeNumericEPSG(`EPSG:${extractedCrs}`);
                                                }

                                                // Usually switched, GeoServer sometimes doesn't. See https://docs.geoserver.org/latest/en/user/services/wfs/axis_order.html#axis-ordering
                                                if (crs === 'EPSG:4326' && extractedCrs !== 'CRS84' && extractedCrs !== 'OGC:CRS84') {
                                                    lc = [lc[1], lc[0]];
                                                    uc = [uc[1], uc[0]];
                                                }
                                                bbox = makeBboxFromOWS(lc, uc);
                                            }
                                            obj.boundingBox = {
                                                extent: bbox,
                                                crs: 'EPSG:4326'
                                            };
                                        }
                                        let dcElement = rawRec.dcElement;
                                        if (dcElement) {
                                            let dc = {
                                                references: []
                                            };
                                            for (let j = 0; j < dcElement.length; j++) {
                                                let dcel = dcElement[j];
                                                let elName = dcel.name.localPart;
                                                let finalEl = {};
                                                /* Some services (e.g. GeoServer) support http://schemas.opengis.net/csw/2.0.2/record.xsd only
                                                * Usually they publish the WMS URL at dct:"references" with scheme=OGC:WMS
                                                * So we place references as they are.
                                                */
                                                if (elName === "references" && dcel.value) {
                                                    let urlString = dcel.value.content && cleanDuplicatedQuestionMarks(dcel.value.content[0]) || dcel.value.content || dcel.value;
                                                    finalEl = {
                                                        value: urlString,
                                                        scheme: dcel.value.scheme
                                                    };
                                                } else {
                                                    finalEl = dcel.value.content && dcel.value.content[0] || dcel.value.content || dcel.value;
                                                }
                                                if (dc[elName] && Array.isArray(dc[elName])) {
                                                    dc[elName].push(finalEl);
                                                } else if (dc[elName]) {
                                                    dc[elName] = [dc[elName], finalEl];
                                                } else {
                                                    dc[elName] = finalEl;
                                                }
                                            }
                                            if (!_dcRef) {
                                                _dcRef = dc.references;
                                            }
                                            obj.dc = dc;
                                        }
                                        records.push(obj);
                                    }
                                }
                                result.records = records;
                                const {value: _url} = _dcRef?.find(t=> t.scheme === 'OGC:WMS') || {}; // Get WMS URL from references
                                const [parsedUrl] = _url && _url.split('?') || [];
                                return addCapabilitiesToRecords(parsedUrl, result);
                            } else if (json && json.name && json.name.localPart === "ExceptionReport") {
                                return {
                                    error: json.value.exception && json.value.exception.length && json.value.exception[0].exceptionText || 'GenericError'
                                };
                            }
                        }
                        return null;
                    }));
            });
        });
    },
    textSearch: function(url, startPosition, maxRecords, text, options) {
        return new Promise((resolve) => {
            resolve(Api.getRecords(url, startPosition, maxRecords, text, options));
        });
    },
    workspaceSearch: function(url, startPosition, maxRecords, text, workspace) {
        return new Promise((resolve) => {
            require.ensure(['../utils/ogc/CSW', '../utils/ogc/Filter'], () => {
                const {Filter} = require('../utils/ogc/Filter');
                const workspaceTerm = workspace || "%";
                const layerNameTerm = text && "%" + text + "%" || "%";
                const ops = Filter.propertyIsLike("dc:identifier", workspaceTerm + ":" + layerNameTerm);
                const filter = Filter.filter(ops);
                resolve(Api.getRecords(url, startPosition, maxRecords, filter));
            });
        });
    },
    reset: () => {},
    getCatalogRecords: (records, options, locales) => {
        let result = records;
        // let searchOptions = catalog.searchOptions;
        if (result && result.records) {
            return result.records.map((record) => {
                let dc = record.dc;
                let thumbURL;
                let wms;
                let esri;
                // look in URI objects for wms and thumbnail
                if (dc && dc.URI) {
                    const URI = isArray(dc.URI) ? dc.URI : (dc.URI && [dc.URI] || []);
                    let thumb = head([].filter.call(URI, (uri) => {return uri.name === "thumbnail"; }) ) || head([].filter.call(URI, (uri) => !uri.name && uri.protocol?.indexOf('image/') > -1));
                    thumbURL = thumb ? thumb.value : null;
                    wms = head(URI.map( uri => {
                        if (uri.protocol) {
                            if (uri.protocol.match(/^OGC:WMS-(.*)-http-get-map/g) || uri.protocol.match(/^OGC:WMS/g) ) {
                                /** wms protocol params are explicitly defined as attributes (INSPIRE)*/
                                return uri;
                            }
                            if (uri.protocol.match(/serviceType\/ogc\/wms/g)) {
                                /** wms protocol params must be extracted from the element text (RNDT / INSPIRE) */
                                return extractWMSParamsFromURL(uri);
                            }
                        }
                        return false;
                    }).filter(item => item));
                }
                // look in references objects
                if (!wms && dc && dc.references && dc.references.length) {
                    let refs = Array.isArray(dc.references) ? dc.references : [dc.references];
                    wms = head([].filter.call(refs, (ref) => { return ref.scheme && (ref.scheme.match(/^OGC:WMS-(.*)-http-get-map/g) || ref.scheme === "OGC:WMS"); }));
                    if (wms) {
                        let urlObj = urlUtil.parse(wms.value, true);
                        let layerName = urlObj.query && urlObj.query.layers || dc.alternative;
                        wms = assign({}, wms, {name: layerName} );
                    }
                }// checks for esri arcgis in geonode csw
                if (!wms && dc && dc.references && dc.references.length) {
                    let refs = Array.isArray(dc.references) ? dc.references : [dc.references];
                    esri = head([].filter.call(refs, (ref) => { return ref.scheme && ref.scheme === "WWW:DOWNLOAD-REST_MAP"; }));
                    if (esri) {
                        let layerName = dc.alternative;
                        esri = assign({}, esri, {name: layerName} );
                    }
                }
                if (!thumbURL && dc && dc.references) {
                    let thumb = getThumb(dc);
                    if (thumb) {
                        thumbURL = thumb.value;
                    }
                }

                let references = [];

                // extract get capabilities references and add them to the final references
                if (dc && dc.references) {
                    // make sure we have an array of references
                    let rawReferences = Array.isArray(dc.references) ? dc.references : [dc.references];
                    rawReferences.filter((reference) => {
                        // filter all references that correspond to a get capabilities reference
                        return reference.scheme.indexOf("http-get-capabilities") > -1;
                    }).forEach((reference) => {
                        // a get capabilities reference should be absolute and filter by the layer name
                        let referenceUrl = reference.value.indexOf("http") === 0 ? reference.value
                            : (options && options.catalogURL || "") + "/" + reference.value;
                        // add the references to the final list
                        references.push({
                            type: reference.scheme,
                            url: referenceUrl
                        });
                    });
                }

                if (wms && wms.name) {
                    let absolute = (wms.value.indexOf("http") === 0);
                    if (!absolute) {
                        assign({}, wms, {value: (options && options.catalogURL || "") + "/" + wms.value} );
                    }
                    let wmsReference = {
                        type: wms.protocol || wms.scheme,
                        url: wms.value,
                        SRS: [],
                        params: {
                            name: wms.name
                        }
                    };
                    references.push(wmsReference);
                }
                if (esri && esri.name) {
                    let esriReference = {
                        type: 'arcgis',
                        url: esri.value,
                        SRS: [],
                        params: {
                            name: esri.name
                        }
                    };
                    references.push(esriReference);
                }

                if (thumbURL) {
                    let absolute = (thumbURL.indexOf("http") === 0);
                    if (!absolute) {
                        thumbURL = (getBaseCatalogUrl(options && options.url) || "") + thumbURL;
                    }
                }
                // create the references array (now only wms is supported)
                let metadata = {boundingBox: record.boundingBox && record.boundingBox.extent && castArray(record.boundingBox.extent.join(","))};
                if (dc) {
                    // parsing all it comes from the csw service
                    metadata = {...metadata, ...sortBy(Object.keys(dc)).reduce((p, c) => ({...p, [c]: uniq(castArray(dc[c]))}), {})};
                }
                // parsing URI
                if (dc && dc.URI && castArray(dc.URI) && castArray(dc.URI).length) {
                    metadata = {...metadata, uri: ["<ul>" + castArray(dc.URI).map(getURILinks.bind(this, metadata, locales)).join("") + "</ul>"]};
                }
                if (dc && dc.subject && castArray(dc.subject) && castArray(dc.subject).length) {
                    metadata = {...metadata, subject: ["<ul>" + castArray(dc.subject).map(s => `<li>${s}</li>`).join("") + "</ul>"]};
                }
                if (references && castArray(references).length ) {
                    metadata = {...metadata, references: ["<ul>" + castArray(references).map(ref => `<li><a target="_blank" href="${ref.url}">${ref.params && ref.params.name || ref.url}</a></li>`).join("") + "</ul>"]
                    };
                } else {
                    // in order to use a default value
                    // we need to not push undefined/empty matadata
                    delete metadata.references;
                }

                if (dc && dc.temporal) {
                    let elements = isString(dc.temporal) ? dc.temporal.split("; ") : [];
                    if (elements.length) {
                        // finding scheme or using default
                        let scheme = elements.filter(e => e.indexOf("scheme=") !== -1).map(e => {
                            const equalIndex = e.indexOf("=");
                            const value = e.substr(equalIndex + 1, e.length - 1);
                            return value;
                        });
                        scheme = scheme.length ? scheme[0] : "W3C-DTF";
                        let temporal = elements
                            .filter(e => e.indexOf("start=") !== -1 || e.indexOf("end=") !== -1)
                            .map(e => {
                                const equalIndex = e.indexOf("=");
                                const prop = e.substr(0, equalIndex);
                                const value = e.substr(equalIndex + 1, e.length - 1);
                                const isOnlyDateFormat = e.length - equalIndex - 1 <= 10;
                                if (includes(["start", "end"], prop) && scheme === "W3C-DTF" && !isOnlyDateFormat) {
                                    return getMessageById(locales, `catalog.${prop}`) + new Date(value).toLocaleString();
                                }
                                if (includes(["start", "end"], prop)) {
                                    return getMessageById(locales, `catalog.${prop}`) + value;
                                }
                                return "";
                            });
                        metadata = {...metadata, temporal: ["<ul>" + temporal.map(date => `<li>${date}</li>`).join("") + "</ul>"]};
                    }
                }

                const parsedReferences = {
                    ...extractOGCServicesReferences({ references }),
                    ...extractEsriReferences({ references })
                };

                const layerType = Object.keys(parsedReferences).find(key => parsedReferences[key]);
                const ogcReferences = layerType && layerType !== 'esri'
                    ? parsedReferences[layerType]
                    : undefined;
                return {
                    serviceType: 'csw',
                    layerType,
                    isValid: !!layerType,
                    boundingBox: record.boundingBox,
                    description: dc && isString(dc.abstract) && dc.abstract || '',
                    layerOptions: options && options.layerOptions || {},
                    identifier: dc && isString(dc.identifier) && dc.identifier || '',
                    references: references,
                    thumbnail: thumbURL,
                    title: dc && isString(dc.title) && dc.title || '',
                    tags: dc && dc.tags || '',
                    metadata,
                    capabilities: record.capabilities,
                    ogcReferences
                };
            });
        }
        return null;
    },
    getLayerFromRecord: (record, options) => {
        return Promise.resolve(recordToLayer(record, options));
    }
};

export default Api;
