/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Tab from './Tab';

const Menu = ({tabs = [], children, size = 'md', msStyle = 'default', onSelect = () => {}, mirror, width = '100%', compact, overlay}) => (
    <div className={`ms-menu ms-${size} ms-${msStyle}${mirror ? ' ms-mirror' : ''}${!children && ' ms-closed' || ''}`}>
        <div className={`ms-menu-tabs${overlay && ' ms-overlay' || ''}${tabs.length === 0 && ' ms-empty' || ''}`}>
            {(compact && tabs.length > 1 || !compact)
            && tabs.map(({...props}, idx) => (
                <Tab
                    overlay={overlay}
                    size={size}
                    msStyle={msStyle}
                    {...props}
                    key={idx}
                    onClick={onSelect}
                    mirror={mirror}/>
            ))}
        </div>
        <div className={`ms-menu-content${overlay && ' ms-overlay' || ''}`} style={{width}}>
            {children}
        </div>
    </div>
);

export default Menu;
