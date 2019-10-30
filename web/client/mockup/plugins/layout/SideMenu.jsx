/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { head, isEqual } from 'lodash';
import { createSelector } from 'reselect';
import { compose, shouldUpdate } from 'recompose';
import Menu from '../../components/Menu';
import BorderLayout from '../../../components/layout/BorderLayout';
import { userSelector } from '../../../selectors/security';

class SideMenuComponent extends React.Component {

    static propTypes = {
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

    static contextTypes = {
        loadedPlugins: PropTypes.object
    };

    static defaultProps = {
        onSelect: () => {},
        tabsProps: () => ({}),
        className: ''
    };

    render() {
        const items = [...(this.props.items || [])]
            .filter(({hide}) => !hide || hide && !hide(this.props))
            .sort((a, b) => a.position > b.position ? 1 : -1);

        const selected = this.props.selected;

        const plugin = head(items
            .filter(( {name}) => name === selected)) || {};

        const tabs = items
            .map(({glyph, name, tooltipId}) => ({
                id: name,
                name,
                glyph,
                active: selected === name,
                ...this.props.tabsProps({name, tooltipId})
            }));

        return (
            <div
                className={this.props.className}
                style={this.props.style}>
                <BorderLayout className="ms-menu-layout">
                    <Menu
                        size="md"
                        tabs={tabs}
                        overlay={this.props.overlay}
                        onSelect={name => this.props.onSelect(name !== selected && name || '')}
                        width={plugin.size && plugin.size > this.props.contentWidth && this.props.contentWidth || plugin.size || 0}
                        mirror={this.props.mirror}
                        msStyle="default">
                        {plugin.Component && <plugin.Component layout />}
                    </Menu>
                </BorderLayout>
            </div>
        );
    }
}

const SideMenu = compose(
    connect(createSelector(
        [
            userSelector
        ], (user) => ({
            user
        })
    )),
    shouldUpdate((props, nexProps) =>
        props.selected !== nexProps.selected
        || props.contentWidth !== nexProps.contentWidth
        || !isEqual(props.user, nexProps.user)
    )
)(SideMenuComponent);

export default SideMenu;
