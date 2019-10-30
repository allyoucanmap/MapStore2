/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    pages: [
        {
            name: "general-settings",
            path: "/app-context/general-settings",
            component: require('./pages/GeneralSettings')
        },
        {
            name: "configure-plugins",
            path: "/app-context/configure-plugins",
            component: require('./pages/ConfigurePlugins')
        },
        /* {
            name: "configure-templates",
            path: "/app-context/configure-templates",
            component: require('./pages/ConfigureTemplates')
        },*/
        {
            name: "configure-map",
            path: "/app-context/configure-map",
            component: require('./pages/ConfigureMap')
        }
    ],
    pluginsDef: require('./plugins.js'),
    initialState: {
        defaultState: {},
        mobile: {}
    }
};
