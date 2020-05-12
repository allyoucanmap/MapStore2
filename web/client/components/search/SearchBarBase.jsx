/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';

export default ({
    className,
    style,
    children
}) => <div id="ms-search-bar" style={style} className={"ms-search-bar" + (className ? " " + className : "")}>
    {children}
</div>;
