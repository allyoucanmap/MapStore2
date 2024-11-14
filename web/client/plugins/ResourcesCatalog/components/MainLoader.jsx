/*
* Copyright 2020, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';

function MainLoader({
    text,
    className = '',
    style
}) {
    return (
        <div className={`ms-main-event-container${className ? ` ${className}` : ''}`} style={style}>
            <div className="ms-main-event-content">
                <div className="ms-main-loader"></div>
                <div className="ms-main-event-text">{text}</div>
            </div>
        </div>
    );
}

MainLoader.defaultProps = {
    text: ''
};

export default MainLoader;
