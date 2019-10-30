/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createPlugin}  from '../../utils/PluginsUtils';
import { Button, ButtonGroup, Glyphicon } from 'react-bootstrap';

class NavbarPlugin extends React.Component {
    render() {
        return (
            <div
                className="shadow-soft"
                style={{ display: 'flex', width: '100%', zIndex: 10 }}>
                <div style={{ flex: 1 }}></div>
                <ButtonGroup>
                    <Button
                        bsStyle="primary"
                        className="square-button">
                        <Glyphicon glyph="home"/>
                    </Button>
                    <Button
                        bsStyle="success"
                        active
                        className="square-button">
                        <Glyphicon glyph="user"/>
                    </Button>
                </ButtonGroup>
            </div>
        );
    }
}
export default createPlugin('Navbar', {
    component: connect(() => ({}))(NavbarPlugin)
});
