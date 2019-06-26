/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const tooltip = require('./enhancers/tooltip');
const {Button: ButtonRB, Glyphicon} = require('react-bootstrap');
const Button = tooltip(ButtonRB);
const Icon = require('./Icon');

module.exports = ({id, active, icon, glyph, size = '', msStyle, btnProps = {}, mirror, onClick = () => {}}) => (
    <div className="ms-menu-tab">
        {mirror && <div className="ms-tab-arrow">
            {active && <div className="ms-arrow-mirror"/>}
        </div>}
        <Button
            {...btnProps}
            active={active}
            bsStyle={msStyle}
            className={`square-button${size ? `-${size}` : ''} ${mirror ? 'ms-menu-btn-mirror' : 'ms-menu-btn'}`}
            onClick={() => onClick(id)}>
            {glyph ? <Glyphicon glyph={glyph}/> : <Icon {...icon}/>}
        </Button>
        {!mirror && <div className="ms-tab-arrow">
            {active && <div className="ms-arrow"/>}
        </div>}
    </div>
);
