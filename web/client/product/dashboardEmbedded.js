/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { loadVersion } from '../actions/version';
import appConfigDashboardEmbedded from './appConfigDashboardEmbedded';
import pluginsDashboardEmbedded from './pluginsDashboardEmbedded';
import main from './main';
import { checkForMissingPlugins } from '../utils/DebugUtils';

checkForMissingPlugins(pluginsDashboardEmbedded.plugins);

main(
    appConfigDashboardEmbedded,
    pluginsDashboardEmbedded,
    (cfg) => ({
        ...cfg,
        initialActions: [
            loadVersion
        ]
    })
);
