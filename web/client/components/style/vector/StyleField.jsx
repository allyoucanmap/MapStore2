/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';

function StyleField({ label, children }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', padding: '4px 0' }}>
            <div style={{ flex: 1 }}>
                {label}
            </div>
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

export default StyleField;
