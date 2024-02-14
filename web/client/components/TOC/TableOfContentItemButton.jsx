/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import Message from '../I18N/Message';
import tooltip from '../misc/enhancers/tooltip';
import ButtonMS from '../misc/Button';
const Button = tooltip(ButtonMS);

function TableOfContentItemButton({
    contextMenu,
    onClick,
    label,
    labelId,
    glyph,
    buttonProps,
    tooltipId,
    tooltip: tooltipProp,
    active,
    style,
    className,
    disabled
}) {
    if (contextMenu) {
        return (
            <button disabled={disabled} onClick={onClick}>
                {glyph ? <><Glyphicon glyph={glyph} /></> : null}
                {labelId ?  <Message msgId={labelId}/> : label}
            </button>
        );
    }
    return (
        <Button
            {...buttonProps}
            style={{
                ...buttonProps?.style,
                ...style
            }}
            className={[
                buttonProps?.className,
                className
            ].join(' ')}
            disabled={disabled}
            active={active}
            tooltipId={tooltipId}
            tooltip={tooltipProp}
            onClick={onClick}>
            <Glyphicon glyph={glyph} />
        </Button>
    );
}

export default TableOfContentItemButton;
