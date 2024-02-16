/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import tooltip from '../../misc/enhancers/tooltip';
import Message from '../../I18N/Message';
const Button = tooltip(({ children, ...props }) => <button {...props}>{children}</button>);

const VisibilityCheck = ({
    hide,
    value,
    onChange,
    mutuallyExclusive,
    error
}) => {

    const getIcon = () => {
        if (error) {
            return 'exclamation-mark';
        }
        if (mutuallyExclusive) {
            return value ? 'radio-on' : 'radio-off';
        }
        return value ? 'checkbox-on' : 'checkbox-off';
    };

    if (hide) {
        return null;
    }
    return (
        <Button
            tooltip={error
                ? <Message msgId={error.msgId} msgParams={error.msgParams} />
                : null}
            className={value && !error ? 'active' : ''}
            onClick={(event) => {
                event.stopPropagation();
                onChange(!value);
            }}
            onContextMenu={(event) => {
                event.stopPropagation();
            }}
        >
            <Glyphicon glyph={getIcon()} />
        </Button>
    );
};

export default VisibilityCheck;
