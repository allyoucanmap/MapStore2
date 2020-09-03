/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import { getMonitoredState } from '../../../web/client/utils/PluginsUtils';
import { getConfigProp } from '../../../web/client/utils/ConfigUtils';
import PluginsContainerComponent from '../../../web/client/components/plugins/PluginsContainer';

// this is the MapStore plugin container
// we could use it as main context to create viewer, editors and previews
// for map, dashboard and geostory using the reducers and epics of mapstore plugins
const PluginsContainer = connect(
    (state) => ({
        monitoredState: getMonitoredState(state, getConfigProp('monitorState'))
    })
)(PluginsContainerComponent);

export default PluginsContainer;
