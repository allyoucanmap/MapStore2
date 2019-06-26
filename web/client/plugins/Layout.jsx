/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get, debounce } from 'lodash';
import { createSelector } from 'reselect';
import { setControlProperty } from '../actions/controls';
import ContainerDimensions from 'react-container-dimensions';
import SideMenu from './menu/SideMenu';
import BorderLayout from '../components/layout/BorderLayout';
import { getConfiguredPlugin } from '../utils/PluginsUtils';
import { mapSelector } from '../selectors/map';
import { updateMapLayout } from '../actions/maplayout';
import maplayout from '../reducers/maplayout';

const layouts = {
    sm: ({ bodyItems, leftMenuItems, rightMenuItems, columnItems, ...props }) => {
        return (
            <BorderLayout
                className="mps-layout"
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
                        contentWidth={props.width < 512 ? props.width - 52 : 0}
                        onSelect={(activePlugin) => props.onControl('layoutmenu', 'activePlugin', activePlugin)}
                        items={[ ...leftMenuItems, ...rightMenuItems ]}/>,
                    ...columnItems.map(({ Component }, key) => Component && <Component key={key}/>)
                ]}>
                <div id="mps-layout-body" style={{position: 'absolute', width: '100%', height: '100%'}}>
                    {!props.selected && bodyItems.map(({ Component }, key) => Component && <Component key={key}/>)}
                </div>
            </BorderLayout>
        );
    },
    md: ({ bodyItems, leftMenuItems, rightMenuItems, columnItems, ...props }) => {

        return (
            <BorderLayout
                className="mps-layout"
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
                <div id="mps-layout-body" style={{position: 'absolute', width: '100%', height: '100%'}}>
                    {bodyItems.map(({ Component }, key) => Component && <Component key={key}/>)}
                </div>
            </BorderLayout>
        );
    },
    lg: ({ bodyItems, leftMenuItems, rightMenuItems, columnItems, footerItems, ...props }) => {
        return (
            <BorderLayout
                className="mps-layout"
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
                        selected={props.leftSelected}
                        onSelect={(activePlugin) => {
                            props.onControl('leftmenu', 'activePlugin', activePlugin);
                            props.onControl('layoutmenu', 'activePlugin', activePlugin);
                        }}
                        items={leftMenuItems}/>,
                    <SideMenu
                        mirror
                        overlay
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
                        selected={props.rightSelected}
                        onSelect={(activePlugin) => {
                            props.onControl('rightmenu', 'activePlugin', activePlugin);
                            props.onControl('layoutmenu', 'activePlugin', activePlugin);
                        }}
                        items={rightMenuItems}/>,
                    ...columnItems.map(({ Component }, key) => Component && <Component key={key}/>)
                ]}
                footer={footerItems.map(({ Component }, key) => Component && <Component key={key}/>)}>
                <div id="mps-layout-body" style={{position: 'absolute', width: '100%', height: '100%'}}>
                    {bodyItems.map(({ Component }, key) => Component && <Component key={key}/>)}
                </div>
            </BorderLayout>
        );
    }
};

class LayoutComponent extends React.Component {
    static propTypes = {
        items: PropTypes.array,
        onControl: PropTypes.func,
        onUpdate: PropTypes.func,
        selected: PropTypes.string,
        leftSelected: PropTypes.string,
        rightSelected: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
        size: PropTypes.string,
        error: PropTypes.bool,
        loading: PropTypes.bool,
         // minimum visible width to apply zoom to extent
        minViewWidth: PropTypes.number
    };

    static contextTypes = {
        loadedPlugins: PropTypes.object
    };

    static defaultProps = {
        items: [],
        onControl: () => { },
        onUpdate: () => { },
        minViewWidth: 200
    };

    componentWillMount() {

        const items = [
            {
                key: 'bodyItems',
                conatinerName: 'body'
            },
            {
                key: 'leftMenuItems',
                conatinerName: 'left-menu'
            },
            {
                key: 'rightMenuItems',
                conatinerName: 'right-menu'
            },
            {
                key: 'columnItems',
                conatinerName: 'column'
            },
            {
                key: 'footerItems',
                conatinerName: 'footer'
            }
        ].reduce((itemsObject, { key, conatinerName }) => {
            return {
                ...itemsObject,
                [key]: this.props.items
                    .filter(({ container }) => container === conatinerName)
                    .map((impl) => {
                        // console.log(impl);
                        const { cfg, ...plg } = impl;
                        return {
                            ...impl,
                            Component: getConfiguredPlugin({ ...plg, cfg: { ...cfg, layout: true } }, this.context.loadedPlugins, <div />)
                        };
                    })
            };
        }, {});

        this.setState({ ...items });
    }

    componentDidMount() {
        this.props.onControl('layout', 'size', this.getSize(this.props.width));
        this.update = debounce(() => {
            const map = document.getElementById('map');
            const bodyLayout = document.getElementById('mps-layout-body');
            if (map && map.getBoundingClientRect
            && bodyLayout && bodyLayout.getBoundingClientRect) {
                const mapBBOX = map.getBoundingClientRect();
                const bodyLayoutBBOX = bodyLayout.getBoundingClientRect();

                const left = bodyLayoutBBOX.left - mapBBOX.left;
                const right = mapBBOX.right - bodyLayoutBBOX.right;
                const top = bodyLayoutBBOX.top - mapBBOX.top;
                const bottom = mapBBOX.bottom - bodyLayoutBBOX.bottom;

                const minViewWidth = this.props.minViewWidth;

                this.props.onUpdate({
                    boundingMapRect: bodyLayoutBBOX.width >= minViewWidth
                    ? { left, right, top, bottom }
                    : { left: 0, right: 0, top: 0, bottom: 0 }
                });
            }
        }, 500);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.width !== this.props.width && this.props.onControl) {
            this.props.onControl('layout', 'size', this.getSize(newProps.width));
        }
        if (newProps.selected !== this.props.selected
        || newProps.leftSelected !== this.props.leftSelected
        || newProps.rightSelected !== this.props.rightSelected
        || newProps.width !== this.props.width
        || newProps.height !== this.props.height) {
            // update map bounds
            this.update.cancel();
            this.update();
        }
    }

    getSize = (width) => {
        if (width > 1200) return 'lg';
        if (width < 768) return 'sm';
        return 'md';
    }

    render() {
        if (!this.props.size) return null;
        const Body = layouts[this.props.size];
        const { bodyItems, leftMenuItems, rightMenuItems, columnItems, footerItems } = this.state;
        const { items, error, loading, ...props } = this.props;
        return !loading && !error && Body ? <Body
            {...props}
            bodyItems={bodyItems}
            leftMenuItems={leftMenuItems}
            rightMenuItems={rightMenuItems}
            columnItems={columnItems}
            footerItems={footerItems}/> : null;
    }
}

class Layout extends React.Component {
    render() {
        return (
            <ContainerDimensions>
            {({width, height}) =>
                <LayoutComponent
                    width={width}
                    height={height}
                    {...this.props}/>}
            </ContainerDimensions>
        );
    }
}

const selector = createSelector(
    [
        state => get(state, 'controls.leftmenu.activePlugin'),
        state => get(state, 'controls.rightmenu.activePlugin'),
        state => get(state, 'controls.layoutmenu.activePlugin'),
        state => get(state, 'controls.layout.size'),
        state => get(state, 'mapInitialConfig.loadingError'),
        mapSelector
    ], (leftSelected, rightSelected, selected, size, mapLoadingError, map) => ({
        leftSelected,
        rightSelected,
        selected,
        size,
        error: !!mapLoadingError,
        loading: !map && !mapLoadingError
    })
);

const LayoutPlugin = connect(selector, { onControl: setControlProperty, onUpdate: updateMapLayout })(Layout);
const reducers = {
    maplayout
};

export {
    LayoutPlugin,
    reducers
};
