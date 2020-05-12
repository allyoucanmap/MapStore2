/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const {Glyphicon, DropdownButton, MenuItem} = require('react-bootstrap');
const tooltip = require('../enhancers/tooltip');
const React = require('react');
const uuidv1 = require('uuid/v1');

const DropdownButtonT = tooltip(DropdownButton);


/**
 * options for buttonConfig = {
 *        disabled: false,
 *        tooltipId,
 *        className: "square-button-md",
 *        glyph,
 *        noCaret: true,
 *        title: <Glyphicon glyph={glyph}/>,
 *        bsStyle: "primary",
 *        idDropDown: uuidv1()
 *    }
*/

const defaultButtonConfig = {
    disabled: false,
    className: "square-button-md",
    noCaret: true,
    idDropDown: uuidv1()
};

const DropdownFeatureType = ({
    menuOptions = [],
    buttonConfig = {}
} = {}) => {
    const [open, setOpen] = React.useState();
    return (
        <DropdownButtonT
            {...defaultButtonConfig}
            {...buttonConfig}
            open={open}
            onToggle={(isOpen) => setOpen(isOpen)}
        >
            {menuOptions.length ? menuOptions.map(({Component, glyph, text, onClick, active = false}, i) =>
                Component
                    ? <Component active={active} eventKey={i} onClick={onClick} key={i} glyph={glyph} text={text} setOpen={setOpen}/>
                    : (
                        <MenuItem active={active} eventKey={i} onClick={onClick} key={i}>
                            {glyph && <Glyphicon glyph={glyph}/>} {text}
                        </MenuItem>)) : null}
        </DropdownButtonT>
    );
};
module.exports = DropdownFeatureType;
