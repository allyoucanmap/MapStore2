/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import { needProxy } from '../utils/ProxyUtils';

let proxyCache = {};

export const setProxyCacheByUrl = (uri, value)=>{
    const urlParts = url.parse(uri); // func make
    const baseUrl = urlParts.protocol + "//" + urlParts.host + urlParts.pathname;
    proxyCache[baseUrl] = value;
    return value;
};

export const getProxyCacheByUrl = (uri)=>{
    const urlParts = url.parse(uri);
    const baseUrl = urlParts.protocol + "//" + urlParts.host + urlParts.pathname;
    return proxyCache[baseUrl];
};

export const testCors = (uri) => {
    const proxy = getProxyCacheByUrl(uri);
    if (needProxy(uri) === false) {
        setProxyCacheByUrl(uri, false);
        return Promise.resolve(false);
    }
    if (proxy !== undefined) {
        return Promise.resolve(proxy);
    }
    return fetch(uri, {
        method: 'GET',
        mode: 'cors'
    })
        .then(() => {
            return setProxyCacheByUrl(uri, false);
        })
        .catch(() => {
            return setProxyCacheByUrl(uri, true); // Assume CORS error or other issue
        });
};
