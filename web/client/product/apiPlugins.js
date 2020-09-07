/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    plugins: {
        // framework plugins
        BackgroundSwitcherPlugin: require('../../../framework/plugins/BackgroundSwitcher'),
        DrawerMenuPlugin: require('../../../framework/plugins/DrawerMenu'),
        FeedbackMaskPlugin: require('../../../framework/plugins/FeedbackMask'),
        GoFullPlugin: require('../../../framework/plugins/GoFull'),
        IdentifyPlugin: require('../../../framework/plugins/Identify'),
        LocatePlugin: require('../../../framework/plugins/Locate'),
        MapFooterPlugin: require('../../../framework/plugins/MapFooter'),
        MapLoadingPlugin: require('../../../framework/plugins/MapLoading'),
        MapPlugin: require('../../../framework/plugins/Map'),
        OmniBarPlugin: require('../../../framework/plugins/OmniBar'),
        SearchPlugin: require('../../../framework/plugins/Search'),
        TOCPlugin: require('../../../framework/plugins/TOC'),
        ToolbarPlugin: require('../../../framework/plugins/Toolbar'),
        ZoomAllPlugin: require('../../../framework/plugins/ZoomAll')
    },
    requires: {
        ReactSwipe: require('react-swipeable-views').default,

        SwipeHeader: require('../../../framework/components/data/identify/SwipeHeader')
    }
};
