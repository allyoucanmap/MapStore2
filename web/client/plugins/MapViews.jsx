/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import { createPlugin } from '../utils/PluginsUtils';
import { createSelector } from 'reselect';
import MapViews from './mapviews/MapViews';

const pluginName = 'MapViews';

const MapViewsPlugin = connect(
    createSelector([], () => ({
        pluginName
    }))
)(MapViews);

export default createPlugin(pluginName, {
    component: () => null,
    containers: {
        Map: {
            name: pluginName,
            Tool: MapViewsPlugin
        }
    }
});
