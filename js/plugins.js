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
        LoginPlugin: require('@mapstore/plugins/Login'),
        BurgerMenuPlugin: require('@mapstore/plugins/BurgerMenu'),
        NavMenuPlugin: require('@mapstore/product/plugins/NavMenu'),
        AttributionPlugin: require('@mapstore/product/plugins/Attribution'),
        SaveMockPlugin: require('./plugins/SaveMock')
    },
    requires: {}
};
