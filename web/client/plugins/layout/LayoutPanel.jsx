
/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { Resizable } from 'react-resizable';
import { Glyphicon } from 'react-bootstrap';

function LayoutPanel({
    className = '',
    defaultWidth = 200,
    defaultHeight = 200,
    axis = 'both',
    resizeHandle = 'e',
    minConstraints = [300, 300],
    maxConstraints = [Infinity, Infinity],
    onResize = () => {},
    children
}) {

    const [width, setWidth] = useState(defaultWidth);
    const [height, setHeight] = useState(defaultHeight);

    const [left, setLeft] = useState(0);
    const [top, setTop] = useState(0);

    const [handlePlaceholder, setHandlePlaceholder] = useState(false);
    return (
        <div
            className={`ms-layout-panel${resizeHandle ? ` axis-${resizeHandle}` : ''}${className && ` ${className}` || ''}`}>
            <Resizable
                axis={axis}
                width={width}
                height={height}
                minConstraints={minConstraints}
                maxConstraints={maxConstraints}
                resizeHandles={[resizeHandle]}
                handle={<div className="ms-layout-panel-handle">
                    {handlePlaceholder && <div
                        className="ms-layout-panel-handle-placeholder"
                        style={(resizeHandle === 'n' || resizeHandle === 's')
                            ? { left: 0, top }
                            : { left, top: 0 }}>
                    </div>}
                    <Glyphicon
                        glyph={
                            resizeHandle === 'n' && 'chevron-up'
                            || resizeHandle === 's' && 'chevron-down'
                            || resizeHandle === 'w' && 'chevron-left'
                            || resizeHandle === 'e' && 'chevron-right'}/>
                </div>}
                onResizeStart={(event) => {
                    setLeft(event.clientX);
                    setTop(event.clientY);
                    setHandlePlaceholder(true);
                }}
                onResize={(event) => {
                    setLeft(event.clientX);
                    setTop(event.clientY);
                }}
                onResizeStop={(event, data) => {
                    if (!isNaN(data.size.width)) {
                        setWidth(data.size.width);
                    }
                    if (!isNaN(data.size.height)) {
                        setHeight(data.size.height);
                    }
                    setHandlePlaceholder(false);
                    onResize({ ...(data.size || {}) });
                }}>
                <div
                    className="ms-layout-panel-body"
                    style={{
                        width,
                        height
                    }}>
                    {children}
                </div>
            </Resizable>
        </div>
    );
}

export default LayoutPanel;
