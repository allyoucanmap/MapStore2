/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import axios from '../../libs/ajax';
import assign from 'object-assign';
import { getVersion } from './About';
import { head, get } from 'lodash';
import { getNameParts, stringifyNameParts } from '../../utils/StyleEditorUtils';

const STYLE_MODULES = [
    { regex: /gt-css/, format: 'css' }
];

const contentTypes = {
    css: 'application/vnd.geoserver.geocss+css',
    sld: 'application/vnd.ogc.sld+xml',
    sldse: 'application/vnd.ogc.se+xml',
    zip: 'application/zip'
};

/**
 * get correct content type based on format and version of style
 * @param {string} format
 * @param {object} languageVersion eg: { version: "1.0.0" }
 */
const getContentType = (format, languageVersion) => {
    if (format === 'sld') {
        return languageVersion && languageVersion.version && languageVersion.version === '1.1.0'
            ? contentTypes.sldse
            : contentTypes.sld;
    }
    // set content type to sld if is missed
    // to avoid 415 error with unknown content types
    return contentTypes[format] || contentTypes.sld;
};

const formatRequestData = ({options = {}, format, baseUrl, name, workspace, languageVersion}, isNameParam) => {
    const paramName = isNameParam ? {name: encodeURIComponent(name)} : {};
    const opts = {
        ...options,
        params: {
            ...options.params,
            ...paramName
        },
        headers: {
            ...(options.headers || {}),
            'Content-Type': getContentType(format, languageVersion)
        }
    };
    const url = `${baseUrl}rest/${workspace && `workspaces/${workspace}/` || ''}styles${!isNameParam ? `/${encodeURIComponent(name)}` : '.json'}`;
    return {
        options: opts,
        url
    };
};

const getStyleBaseUrl = ({geoserverBaseUrl, workspace, name, fileName}) => `${geoserverBaseUrl}rest/${workspace && `workspaces/${workspace}/` || ''}styles/${ fileName ? fileName : `${encodeURIComponent(name)}.json`}`;

/**
* Api for GeoServer styles via rest
* @name api.geoserver
*/
const Api = {
    saveStyle: function(geoserverBaseUrl, styleName, body, options) {
        let url = geoserverBaseUrl + "styles/" + encodeURI(styleName);
        let opts = assign({}, options);
        opts.headers = assign({}, opts.headers, {"Content-Type": "application/vnd.ogc.sld+xml"});
        return axios.put(url, body, opts);
    },
    getStyleService: function({ baseUrl }) {
        return getVersion({ baseUrl })
            .then(({ version, manifest }) => {
                if (!version) return null;
                const formats = (manifest || [])
                    .map(({ name }) =>
                        head(STYLE_MODULES
                            .filter(({ regex }) => name.match(regex))
                            .map(({ format }) => format))
                    ).filter(format => format);
                const geoserver = head(version.filter(({ name = ''}) => name.toLowerCase() === 'geoserver')) || {};
                return {
                    baseUrl,
                    version: geoserver.version,
                    formats: [...formats, 'sld'],
                    availableUrls: []
                };
            });
    },
    /**
    * Get style object
    * @memberof api.geoserver
    * @param {object} params {options, format, baseUrl, styleName}
    * @param {string} params.baseUrl base url of GeoServer eg: /geoserver/
    * @param {string} params.format style format eg: css or sld
    * @param {string} params.styleName style name
    * @return {object} GeoServer style object
    */
    getStyle: ({options, format, baseUrl, styleName}) => {
        const {name, workspace} = getNameParts(styleName);
        const data = formatRequestData({options, format, baseUrl, name, workspace});
        return axios.get(data.url, data.options);
    },
    /**
    * Create a new style
    * @memberof api.geoserver
    * @param {object} params {baseUrl, style, options, format, styleName}
    * @param {string} params.baseUrl base url of GeoServer eg: /geoserver/
    * @param {string} params.format style format eg: css or sld
    * @param {string} params.styleName style name
    * @param {string} params.code style code
    * @return {object} response
    */
    createStyle: ({baseUrl, code, options, format = 'sld', styleName, languageVersion, metadata}) => {
        const {name, workspace} = getNameParts(styleName);
        const data = formatRequestData({options, format, baseUrl, name, workspace, languageVersion}, true);
        return axios.post(data.url, code, data.options)
            .then(() => {
                const { url: putUrl } = formatRequestData({options, format, baseUrl, name, workspace, languageVersion});
                return !metadata
                    ? { styleName }
                    : axios.put(
                        `${putUrl}.json`, {
                            style: {
                                format,
                                languageVersion,
                                metadata
                            }
                        },
                        { headers: { 'Content-Type': 'application/json' } })
                    .then(() => ({ styleName, metadata }))
                    .catch(() => ({ styleName }));
            });
    },
    /**
    * Update a style
    * @memberof api.geoserver
    * @param {object} params {baseUrl, style, options, format, styleName}
    * @param {string} params.baseUrl base url of GeoServer eg: /geoserver/
    * @param {string} params.format style format eg: css or sld
    * @param {string} params.styleName style name
    * @param {string} params.code style code
    * @return {object} response
    */
    updateStyle: ({baseUrl, code, options, format = 'sld', styleName, languageVersion}) => {
        const {name, workspace} = getNameParts(styleName);
        const data = formatRequestData({options, format, baseUrl, name, workspace, languageVersion});
        return axios.put(data.url, code, data.options);
    },
    /**
    * Update a style configuration
    * @memberof api.geoserver
    * @return {object} response
    */
    updateStyleConfig: ({baseUrl, styleName, languageVersion, config = {}}) => {
        const {name, workspace} = getNameParts(styleName);
        const data = formatRequestData({baseUrl, name, workspace, languageVersion});
        return axios.put(data.url, { style: config }, { headers: { 'Content-Type': 'application/json' } });
    },
    /**
    * Delete a style
    * @memberof api.geoserver
    * @param {object} params {baseUrl, options, format, styleName}
    * @param {string} params.baseUrl base url of GeoServer eg: /geoserver/
    * @param {string} params.styleName style name
    * @return {object} response
    */
    deleteStyle: ({baseUrl, options, format = 'sld', styleName}) => {
        const {name, workspace} = getNameParts(styleName);
        const data = formatRequestData({options, format, baseUrl, name, workspace});
        return axios.delete(data.url, data.options);
    },
    /**
    * Retrive style info an merge them to the provided list of styles
    * @memberof api.geoserver
    * @param {object} params {baseUrl, styles}
    * @param {string} params.baseUrl base url of GeoServer eg: /geoserver/
    * @param {string} params.styles list of styles eg: [ { name: 'style.css', title: 'Style', _abstract: '' } ]
    * @return {array} array of style provided with additional info as format, filename and languageVersion
    */
    getStylesInfo: ({baseUrl: geoserverBaseUrl, styles = []}) => {
        let responses = [];
        let count = styles.length;
        return new Promise(function(resolve) {
            if (!styles || styles.length === 0) {
                resolve([]);
            } else {
                styles.forEach(({name}, idx) =>
                axios.get(getStyleBaseUrl({...getNameParts(name), geoserverBaseUrl}))
                    .then(({data}) => {
                        const metadata = get(data, 'style.metadata.entry');
                        const metadataProperty = metadata
                            ? {
                                metadata: metadata.reduce((acc, entry) => {
                                    const key = entry['@key'];
                                    const value = entry.$;
                                    return {
                                        ...acc,
                                        [key]: value
                                    };
                                }, {})
                            }
                            : { };

                        responses[idx] = assign({}, styles[idx], data && data.style && {
                            ...data.style,
                            ...metadataProperty,
                            name: stringifyNameParts(data.style)
                        } || {});
                        count--;
                        if (count === 0) resolve(responses.filter(val => val));
                    })
                    .catch(() => {
                        responses[idx] = assign({}, styles[idx]);
                        count--;
                        if (count === 0) resolve(responses.filter(val => val));
                    })
                );
            }
        });
    },
    /**
    * Get style code
    * @memberof api.geoserver
    * @param {object} params {baseUrl, styleName, workspace}
    * @param {string} params.baseUrl base url of GeoServer eg: /geoserver/
    * @param {string} params.styleName style name
    * @return {object} GeoServer style object with code params eg: {...otherStyleParams, code: '* { stroke: #ff0000; }'}
    */
    getStyleCodeByName: ({baseUrl: geoserverBaseUrl, styleName, options}) => {
        const {name, workspace} = getNameParts(styleName);
        const url = getStyleBaseUrl({name, workspace, geoserverBaseUrl});
        return axios.get(url, options)
            .then(response => {
                return response.data && response.data.style && response.data.style.filename ?
                    axios.get(getStyleBaseUrl({workspace, geoserverBaseUrl, fileName: response.data.style.filename})).then(({data: code}) => ({...response.data.style, code}))
                    : null;
            });
    }
};

module.exports = Api;
