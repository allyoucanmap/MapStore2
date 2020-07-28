/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '../utils/PluginsUtils';

function Mockup() {
    return (
        <div>
            Mockup
        </div>
    );
}

export default createPlugin('Mockup', {
    component: Mockup
});
