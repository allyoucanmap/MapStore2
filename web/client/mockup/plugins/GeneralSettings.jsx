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
import { Glyphicon, FormControl, ControlLabel, FormGroup, Checkbox } from 'react-bootstrap';

class GeneralSettingsPlugin extends React.Component {

    static propTypes = {
        onUpdate: PropTypes.func
    };

    static defaultProps = {
        onUpdate: () => {}
    };

    render() {
        return (
            <div style={{ display: 'flex', position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ margin: 'auto' }}>
                    <div className="text-center">
                        <Glyphicon glyph="wrench" style={{ fontSize: 128 }}/>
                    </div>
                    <h1 className="text-center">Create new app context</h1>
                    <FormGroup>
                        <ControlLabel>
                            Name
                        </ControlLabel>
                        <FormControl
                            type="text"
                            placeholder="Enter app context name..." />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>
                            Window title
                        </ControlLabel>
                        <FormControl
                            type="text"
                            placeholder="Enter window title..." />
                    </FormGroup>
                    <Checkbox>Publish on save</Checkbox>
                </div>
            </div>
        );
    }

}

export default createPlugin('GeneralSettings', {
    component: connect(() => ({}), {
        onUpdate: setControlProperty.bind(null, 'general-settings', 'settings')
    })(GeneralSettingsPlugin)
});
