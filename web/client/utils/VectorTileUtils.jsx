/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { head } = require('lodash');
const url = require('url');
const StyleAPI = require('../api/geoserver/Styles');
const { normalizeUrl } = require('./PrintUtils');

const styles = {};
const originalStyles = {};

const VECTOR_FORMAT = [
    {
        formats: [ 'application/vnd.mapbox-vector-tile' ],
        name: 'MVT'
    },
    {
        formats: [ 'application/json;type=geojson' ],
        name: 'GeoJSON'
    }
];
const styleParser = {
    ol: require('./vectortile/olStyleParser')
};

const isVector = ({ format }) => head(VECTOR_FORMAT.filter(vector => vector.formats.indexOf(format) !== -1));
const getStyle = (options, callback = () => {}) => {
    const availableStyles = options.availableStyles || [];
    const currenStyle = !options.style
        ? availableStyles[0]
        : head(availableStyles.filter(style => style.name === options.style));
    if (!currenStyle) return callback('');
    const styleName = currenStyle.name;

    if (!styles[`${options.url}:${styleName}`]) {
        const normalizedUrl = normalizeUrl(options.url);
        const parsedUrl = url.parse(normalizedUrl);

        const getOriginalStyle = (data) => {
            StyleAPI.getStyleCodeByName({
                format: currenStyle.format,
                baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}/geoserver/`,
                styleName
            })
            .then((original) => {
                originalStyles[`${options.url}:${styleName}`] = original;
                callback(data, original);
            })
            .catch(() => callback(data, ''));
        };

        StyleAPI.getStyleCodeByName({
            format: currenStyle.format === 'css' ? 'sld' : currenStyle.format,
            baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}/geoserver/`,
            styleName
        })
        .then((data) => {
            styles[`${options.url}:${styleName}`] = data;
            getOriginalStyle(data);
        })
        .catch(() => getOriginalStyle(''));

    } else {
        callback(styles[`${options.url}:${styleName}`]);
    }

    return null;
};

const getOriginalStyle = (options) => {
    const availableStyles = options.availableStyles || [];
    const currenStyle = !options.style
        ? availableStyles[0]
        : head(availableStyles.filter(style => style.name === options.style));
    const styleName = currenStyle.name;
    return originalStyles[`${options.url}:${styleName}`] || {};
};

const getStyleParser = (type) => styleParser[type] || {};

const isValid = (options, style) => {
    return new Promise((resolve, reject) => {
        try {
            const parser = getStyleParser('ol');
            const styleFunc = style.format === 'css' ? parser.sld : parser[style.format] || parser.mapstore;
            styleFunc({...style, styleBody: style.code}, options);
            resolve();
        } catch(e) {
            reject(e);
        }
    });
};

const updateStyle = (options, code) => {
    const availableStyles = options.availableStyles || [];
    const currenStyle = !options.style
        ? availableStyles[0]
        : head(availableStyles.filter(style => style.name === options.style));
    const styleName = currenStyle.name;
    styles[`${options.url}:${styleName}`] = code;
};

module.exports = {
    VECTOR_FORMAT,
    getStyleParser,
    isVector,
    getStyle,
    updateStyle,
    isValid,
    getOriginalStyle
};
