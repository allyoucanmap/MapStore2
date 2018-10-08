/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
// const PropTypes = require('prop-types');
const assign = require('object-assign');
const {Glyphicon, MenuItem, DropdownButton: DropdownButtonRB, FormGroup, ControlLabel, FormControl} = require('react-bootstrap');
const tooltip = require('../components/misc/enhancers/tooltip');
const DropdownButton = tooltip(DropdownButtonRB);
// const {connect} = require('react-redux');

// const {mapTypeSelector} = require('../selectors/maptype');


class CRSSelector extends React.Component {
    static propTypes = {

    };

    static defaultProps = {

    };

    render() {
        return <div></div>;
    }
}

module.exports = {
    CRSSelectorPlugin: assign(CRSSelector, {
        BurgerMenu: {
            name: 'crs',
            position: 2,
            tool: () => (
            <DropdownButton noCaret title={<MenuItem><Glyphicon glyph="crs" /> PROJECTION</MenuItem>}>
                <MenuItem active eventKey="2">
                    EPSG:3857</MenuItem>
                <MenuItem eventKey="3"
                    >EPSG:4326</MenuItem>
            </DropdownButton>),
            doNotHide: true
        },
        Settings: {
            position: 0,
            tool: (
                <FormGroup bsSize="small">
                <ControlLabel>Projection</ControlLabel>
                <FormControl
                    value={'3857'}
                    componentClass="select">
                    <option value={'3857'} key={'3857'}>{'EPSG:3857'}</option>
                    <option value={'4326'} key={'4326'}>{'EPSG:4326'}</option>
                </FormControl>
            </FormGroup>)
        },
        MapFooter: {
            position: 1,
            tool: () => (
                <DropdownButton
                    dropup
                    noCaret
                    pullRight
                    tooltip="Projection"
                    tooltipPosition="left"
                    bsStyle="primary"
                    className="map-footer-btn"
                    title={<Glyphicon glyph="crs" />}>
                    <MenuItem active eventKey="2">
                        EPSG:3857</MenuItem>
                    <MenuItem eventKey="3"
                        >EPSG:4326</MenuItem>
                </DropdownButton>)
        }
    }),
    reducers: {},
    epics: {}
};

