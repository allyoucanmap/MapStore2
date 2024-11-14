/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import FaIcon from './FaIcon';

function Icon({
    glyph,
    type = 'font-awesome',
    ...props
}) {
    if (type === 'font-awesome') {
        return <FaIcon {...props} name={glyph} />;
    }
    if (type === 'glyphicon') {
        return <Glyphicon {...props} glyph={glyph} />;
    }
    return null;
}

Icon.defaultProps = {};

export default Icon;
