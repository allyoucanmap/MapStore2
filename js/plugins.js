/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    plugins: {
        GeoStoryPlugin: require('./plugins/GeoStory'),
        OmniBarPlugin: require('@mapstore/plugins/OmniBar'),
        LoginPlugin: require('@mapstore/plugins/Login')
    },
    requires: {}
};
