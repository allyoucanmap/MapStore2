/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setControlProperty } from '../../actions/controls';
import { createPlugin }  from '../../utils/PluginsUtils';

class GeneralSettingsPlugin extends React.Component {

    static propTypes = {
        onUpdate: PropTypes.func
    };

    static defaultProps = {
        onUpdate: () => {}
    };

}

export default createPlugin('GeneralSettings', {
    component: connect(() => ({}), {
        onUpdate: setControlProperty.bind(null, 'general-settings', 'settings')
    })(GeneralSettingsPlugin)
});
