/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import Content from '../../contents/Content';

/**
 * Paragraph Section Type.
 * Paragraph is a page block that expands for all it's height
 */
export default ({ className = '', contents, type, mode }) => (
    <div
        className={className}>
        <div className={`ms-section-contents ms-section-contents-${type}`}>
            {contents.map((props) => (<Content mode={mode} {...props}/>))}
        </div>
    </div>
);
