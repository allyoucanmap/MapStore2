/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { createPlugin}  from '../../utils/PluginsUtils';
import { Button, ButtonGroup, Glyphicon } from 'react-bootstrap';
import mapImage from '../assets/img/map.jpg';

class FakeMap extends React.Component {

    static propTypes = {
        selectedPlugins: PropTypes.array
    };

    render() {
        const plugins = (this.props.selectedPlugins || []).reduce((acc, { name, children }) => {
            return [
                ...acc,
                name,
                ...(children || []).map(child => child.name)
            ];
        }, []);
        return (
            <div
                style={{ position: 'absolute', display: 'flex', width: 'calc(100% - 34px)', height: '100%', zIndex: 1, marginLeft: 34 }}>
                <div style={{ position: 'absolute', width: '100%',  height: '100%' }}>
                    <img src={mapImage} style={{ position: 'relative', width: '100%',  height: '100%', objectFit: 'cover' }}/>
                </div>
                {plugins.find(plugin => plugin === 'TOC') && <Button
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    bsStyle="primary"
                    className="square-button shadow-soft">
                    <Glyphicon glyph="1-layer"/>
                </Button>}
                {plugins.find(plugin => plugin === 'MapToolbar') &&
                    <div
                        className="shadow-soft"
                        style={{ position: 'absolute', bottom: 0, right: 0, display: 'flex', flexDirection: 'column', margin: 8 }}>
                        {plugins.find(plugin => plugin === 'ZoomIn') && <Button
                            bsStyle="primary"
                            className="square-button">
                            <Glyphicon glyph="plus"/>
                        </Button>}
                        {plugins.find(plugin => plugin === 'ZoomOut') && <Button
                            bsStyle="primary"
                            className="square-button">
                            <Glyphicon glyph="minus"/>
                        </Button>}
                    </div>}
            </div>
        );
    }
}
export default createPlugin('FakeMap', {
    component: connect((state) => ({
        selectedPlugins: get(state, 'controls.configure-plugins.selectedPlugins') || []
    }))(FakeMap)
});
