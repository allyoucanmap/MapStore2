/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const axios = require('../../libs/ajax');
const assign = require('object-assign');

const contentTypes = {
    css: 'application/vnd.geoserver.geocss+css',
    sld: 'application/vnd.ogc.sld+xml',
    // sldse: 'application/vnd.ogc.se+xml',
    zip: 'application/zip'
};

const formatRequestData = ({options = {}, format, baseUrl, styleName, name, workspace}) => {
    const paramName = name ? {name: encodeURIComponent(name)} : {};
    const opts = {
        ...options,
        params: {
            ...options.params,
            ...paramName
        },
        headers: {
            ...(options.headers || {}),
            'Content-Type': contentTypes[format]
        }
    };
    const url = `${baseUrl}rest/styles${workspace && workspace + '/' || ''}${styleName ? '/' + encodeURIComponent(styleName) : ''}`;
    return {
        options: opts,
        url
    };
};

const Api = {
    saveStyle: function(geoserverBaseUrl, styleName, body, options) {
        let url = geoserverBaseUrl + "styles/" + encodeURI(styleName);
        let opts = assign({}, options);
        opts.headers = assign({}, opts.headers, {"Content-Type": "application/vnd.ogc.sld+xml"});
        return axios.put(url, body, opts);
    },
    getStyle: ({options, format, baseUrl, name: styleName, workspace}) => {
        const data = formatRequestData({options, format, baseUrl, styleName, workspace});
        return axios.get(data.url, data.options);
    },
    createStyle: ({baseUrl, style, options, format = 'sld', styleName, workspace}) => {
        const data = formatRequestData({options, format, baseUrl, name: styleName, workspace});
        return axios.post(data.url, style, data.options);
    },
    updateStyle: ({baseUrl, style, options, format = 'sld', styleName, workspace}) => {
        const data = formatRequestData({options, format, baseUrl, styleName, workspace});
        return axios.put(data.url, style, data.options);
    },
    deleteStyle: ({baseUrl, options, format = 'sld', styleName, workspace}) => {
        const data = formatRequestData({options, format, baseUrl, styleName, workspace});
        return axios.delete(data.url, data.options);
    },
    getStylesInfo: ({baseUrl: geoserverBaseUrl, styles = [], workspace}) => {
        const baseUrl = `${geoserverBaseUrl}rest/styles/${workspace && workspace + '/' || ''}`;
        let responses = [];
        let count = styles.length;
        return new Promise((resolve) => {
            styles.forEach(({name}, idx) =>
                axios.get(`${baseUrl}${encodeURIComponent(name)}.json`)
                    .then(({data}) => {
                        responses[idx] = assign({}, styles[idx], data && data.style || {});
                        count--;
                        if (count === 0) resolve(responses.filter(val => val));
                    })
                    .catch(() => {
                        count--;
                        if (count === 0) resolve(responses.filter(val => val));
                    })
            );
        });
    },
    getStyleCodeByName: ({baseUrl: geoserverBaseUrl, styleName, options}) => {
        const baseUrl = `${geoserverBaseUrl}rest/styles/`;
        const url = `${baseUrl}${encodeURIComponent(styleName)}.json`;
        return axios.get(url, options)
            .then(response => {
                return response.data && response.data.style && response.data.style.filename ?
                    axios.get(`${baseUrl}${encodeURIComponent(response.data.style.filename)}`).then(({data: code}) => ({...response.data.style, code}))
                    : null;
            });
    }
};

module.exports = Api;
