/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import head from 'lodash/head';
import Menu from './Menu';
import BorderLayout from '../../components/layout/BorderLayout';

function SideMenu({
    items = [],
    selected = [],
    tabsProps = () => ({}),
    className = '',
    style = {},
    overlay = false,
    onSelect = () => {},
    menuId = '',
    contentWidth = 0,
    mirror = false
}) {
    const sortedItems = [...(items || [])]
        .sort((a, b) => a.position > b.position ? 1 : -1);

    const { name: selectedName } = selected && selected.find((activePlugin) => activePlugin.menuId === menuId) || {};

    const plugin = head(sortedItems
        .filter(( {name}) => name === selectedName)) || {};

    const tabs = sortedItems
        .map(({glyph, name, tooltipId, alertIconComponent }) => ({
            id: name,
            name,
            glyph,
            active: selectedName === name,
            alertIcon: alertIconComponent,
            ...tabsProps({name, tooltipId})
        }));

    return (
        <div
            className={className}
            style={style}>
            <BorderLayout className="ms-menu-layout">
                <Menu
                    tabs={tabs}
                    overlay={overlay}
                    onSelect={name => {
                        const filteredSelected = selected.filter((activePlugin) => activePlugin.menuId !== menuId);
                        const newSelected = [
                            ...(name !== selectedName
                                ? [{ menuId, name }]
                                : []),
                            ...filteredSelected
                        ];
                        onSelect(newSelected);
                    }}
                    width={plugin.size && plugin.size > contentWidth && contentWidth || plugin.size || 0}
                    mirror={mirror}>
                    {sortedItems
                        .filter(({ alwaysRendered, name }) => alwaysRendered || name === selectedName)
                        .map(({ name, Component }) => (
                            <div
                                key={name}
                                style={name !== selectedName ? { display: 'none' } : { position: 'relative', width: '100%', height: '100%' }}>
                                {Component && <Component active={name === selectedName}/>}
                            </div>
                        ))}
                </Menu>
            </BorderLayout>
        </div>
    );
}

SideMenu.propTypes = {
    items: PropTypes.array,
    selected: PropTypes.string,
    onSelect: PropTypes.func,
    tabsProps: PropTypes.func,
    style: PropTypes.object,
    className: PropTypes.string,
    mirror: PropTypes.bool,
    overlay: PropTypes.bool,
    contentWidth: PropTypes.number
};

SideMenu.defaultProps = {
    onSelect: () => {},
    tabsProps: () => ({}),
    className: ''
};

export default SideMenu;
