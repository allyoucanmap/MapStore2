/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {isArray} = require('lodash');
const SecurityUtils = require('../SecurityUtils');

const getWMSURLs = urls => {
    return urls.map((url) => url.split("\?")[0]);
};

const WMSUtils = {
    PARAM_OPTIONS: ["layers", "styles", "style", "format", "transparent", "version", "tiled", "opacity", "zindex", "srs", "singletile", "_v_", "filterobj" ],
    getAuthenticationParam: options => {
        const urls = getWMSURLs(isArray(options.url) ? options.url : [options.url]);
        let authenticationParam = {};
        urls.forEach(url => {
            SecurityUtils.addAuthenticationParameter(url, authenticationParam, options.securityToken);
        });
        return authenticationParam;
    },
    getWMSURLs
};

module.exports = WMSUtils;
