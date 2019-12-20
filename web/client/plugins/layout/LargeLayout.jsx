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

function LargeLayout({
    bodyItems = [],
    backgroundItems = [],
    centerItems = [],
    leftMenuItems = [],
    rightMenuItems = [],
    columnItems = [],
    bottomItems = [],
    headerItems = [],
    footerItems = [],
    ...props
}) {
    return (
        <BorderLayout
            className="ms-layout"
            background={
                <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    {backgroundItems.map(({ Component }, key) => Component && <Component key={key}/>)}
                </div>
            }
            header={headerItems.map(({ Component }, key) => Component && <Component key={key}/>)}
            footer={footerItems.map(({ Component }, key) => Component && <Component key={key}/>)}
            columns={[
                <SideMenu
                    overlay
                    menuId="left-menu"
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
                    onSelect={props.onSelect}
                    items={leftMenuItems}/>,
                <SideMenu
                    mirror
                    overlay
                    menuId="right-menu"
                    key="right-menu"
                    style={{
                        zIndex: 2,
                        pointerEvents: 'none'
                    }}
                    tabsProps={({ tooltipId }) => ({
                        btnProps: {
                            tooltipId,
                            tooltipPosition: 'left'
                        }
                    })}
                    {...props}
                    selected={props.selected}
                    onSelect={props.onSelect}
                    items={rightMenuItems}/>,
                ...columnItems.map(({ Component }, key) => Component && <Component key={key}/>)
            ]}>
            <div style={{
                display: 'flex',
                position: 'absolute',
                width: '100%',
                height: '100%',
                flexDirection: 'column'
            }}>
                <div
                    id="ms-layout-body"
                    className="ms-layout-body"
                    data-ms-size="lg"
                    style={{ flex: 1, width: '100%', position: 'relative'}}>
                    { bodyItems.map(({ Component }, key) => Component && <Component key={key}/>) }
                    <div className="ms-layout-center">
                        {centerItems.map(({ Component }, key) => Component && <Component key={key}/>)}
                    </div>
                </div>
                <div
                    className="ms-layout-bottom"
                    style={{ pointerEvents: 'auto' }}>
                    {bottomItems.map(({ Component }, key) => Component && <Component key={key}/>)}
                </div>
            </div>
        </BorderLayout>
    );
}

export default LargeLayout;
