/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPlugin } from '../utils/PluginsUtils';

/**
 * Deprecated: the dashboard connections are the widget interactions, configured from the sender widgets.
 * Kept without UI so the existing configurations including it still load.
 * @memberof plugins
 * @deprecated
 * @name MapConnectionDashboard
 * @class
 */
export default createPlugin('MapConnectionDashboard', {
    component: () => null
});
