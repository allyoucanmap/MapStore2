/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import SideMenu from './SideMenu';
import BorderLayout from '../../components/layout/BorderLayout';

function MediumLayout({
    bodyItems = [],
    leftMenuItems = [],
    rightMenuItems = [],
    columnItems = [],
    ...props
}) {
    return (
        <BorderLayout
            className="ms-layout"
            columns={[
                <SideMenu
                    overlay
                    key="left-menu"
                    style={{
                        zIndex: 2,
                        order: -1,
                        pointerEvents: 'none'
                    }}
                    tabsProps={({ tooltipId }) => ({
                        btnProps: {
                            tooltipId,
                            tooltipPosition: 'right'
                        }
                    })}
                    {...props}
                    selected={props.selected}
                    onSelect={(activePlugin) => props.onControl('layoutmenu', 'activePlugin', activePlugin)}
                    items={[ ...leftMenuItems, ...rightMenuItems ]}/>,
                ...columnItems.map(({ Component }, key) => Component && <Component key={key}/>)
            ]}>
            <div
                id="ms-layout-body"
                data-ms-size="md"
                style={{position: 'absolute', width: '100%', height: '100%'}}>
                {bodyItems.map(({ Component }, key) => Component && <Component key={key}/>)}
            </div>
        </BorderLayout>
    );
}

export default MediumLayout;
