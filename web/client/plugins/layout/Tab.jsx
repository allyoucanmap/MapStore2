/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import tooltip from '../../components/misc/enhancers/tooltip';
import Icon from './Icon';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';

const Button = tooltip(ButtonRB);

function Tab({
    id,
    active,
    icon,
    glyph,
    size = '',
    msStyle,
    btnProps = {},
    mirror,
    onClick = () => {},
    alertIcon
}) {
    const AlertIcon = alertIcon;
    return (
        <div
            id={`ms-menu-tab-${(id || '').toLowerCase()}`}
            className="ms-menu-tab">
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
                {AlertIcon && <AlertIcon />}
            </Button>
            {!mirror && <div className="ms-tab-arrow">
                {active && <div className="ms-arrow"/>}
            </div>}
        </div>
    );
}

export default Tab;
