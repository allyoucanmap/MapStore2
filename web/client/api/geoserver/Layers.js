/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const axios = require('../../libs/ajax');

const Api = {
    getLayer: function(geoserverBaseUrl, layerName, options) {
        let url = geoserverBaseUrl + "layers/" + layerName + ".json";
        return axios.get(url, options).then((response) => {return response.data && response.data.layer; });
    },
    removeStyles: ({baseUrl, workspace, layerName, styles = [], options = {}}) => {
        const url = `${baseUrl}rest/layers/${workspace && workspace + '/' || ''}${layerName}.json`;
        return axios.get(url, options)
            .then(({data}) => {
                const layer = data.layer || {};
                const currentAvailableStyle = layer.styles && layer.styles.style || {};
                const stylesNames = styles.map(({name}) => name);
                const layerObj = {
                    'layer': {
                        ...layer,
                        'styles': {
                            '@class': 'linked-hash-set',
                            'style': currentAvailableStyle.filter(({name}) => stylesNames.indexOf(name) === -1)
                        }
                    }
                };
                return layerObj;
            })
            .then(layerObj => axios.put(url, layerObj)
            .then(() => layerObj));
    },
    updateAvailableStyles: ({baseUrl, workspace, layerName, styles = [], options = {}}) => {
        const url = `${baseUrl}rest/layers/${workspace && workspace + '/' || ''}${layerName}.json`;
        return axios.get(url, options)
            .then(({data}) => {
                const layer = data.layer || {};
                const currentAvailableStyle = layer.styles && layer.styles.style || {};
                const layerObj = {
                    'layer': {
                        ...layer,
                        'styles': {
                            '@class': 'linked-hash-set',
                            'style': [
                                ...currentAvailableStyle,
                                ...styles
                            ]
                        }
                    }
                };
                return layerObj;
            })
            .then(layerObj => axios.put(url, layerObj)
            .then(() => layerObj));
    }
};
module.exports = Api;
