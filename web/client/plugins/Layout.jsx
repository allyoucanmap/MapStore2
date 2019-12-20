/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import join from 'lodash/join';
import isNil from 'lodash/isNil';
import isFunction from 'lodash/isFunction';
import debounce from 'lodash/debounce';
import { createSelector } from 'reselect';
import { withResizeDetector } from 'react-resize-detector';

import { setControlProperty } from '../actions/controls';
import BorderLayout from '../components/layout/BorderLayout';
import { createPlugin } from '../utils/PluginsUtils';
import { createShallowSelectorCreator } from '../utils/ReselectUtils';
import { mapSelector } from '../selectors/map';
import { updateMapLayout } from '../actions/maplayout';
import maplayout from '../reducers/maplayout';
import Loader from '../components/misc/Loader';
import { userSelector } from '../selectors/security';

import usePlugins from './layout/usePlugins';
import SmallLayout from './layout/SmallLayout';
import MediumLayout from './layout/MediumLayout';
import LargeLayout from './layout/LargeLayout';

const layouts = {
    sm: SmallLayout,
    md: MediumLayout,
    lg: LargeLayout
};

function LoaderPanel() {
    return (
        <BorderLayout
            className="ms-layout">
            <div style={{
                display: 'flex',
                position: 'relative',
                width: '100%',
                height: '100%',
                alignContent: 'center'
            }}>
                <Loader
                    style={{ margin: 'auto' }}
                    size={150}/>
            </div>
        </BorderLayout>
    );
}

function Layout({
    items = [],
    error,
    loading,
    size,
    user,
    minViewWidth = 200,
    ...props
}, context) {

    const loadedPluginsKeys = join(Object.keys(context.loadedPlugins || {}), ',');
    const [ plugins ] = usePlugins({ items, user }, context, [ loadedPluginsKeys ], LoaderPanel);
    const pluginsLoaded = join(plugins.map(({ plugin }) => isFunction(plugin)), ',');
    const [ components, setComponents ] = useState({});
    const update = useRef(null);

    const getSize = (width) => {
        if (width > 1200) { return 'lg'; }
        if (width < 768) { return 'sm'; }
        return 'md';
    };

    useEffect(() => {
        props.onResize(getSize(props.width));
        update.current = debounce(() => {
            const map = document.getElementById('map');
            const bodyLayout = document.getElementById('ms-layout-body');

            if (map && map.getBoundingClientRect
            && bodyLayout && bodyLayout.getBoundingClientRect) {

                const mapBBOX = map.getBoundingClientRect();
                const bodyLayoutBBOX = bodyLayout.getBoundingClientRect();

                const left = bodyLayoutBBOX.left - mapBBOX.left;
                const right = mapBBOX.right - bodyLayoutBBOX.right;
                const top = bodyLayoutBBOX.top - mapBBOX.top;
                const bottom = mapBBOX.bottom - bodyLayoutBBOX.bottom;

                props.onUpdate({
                    boundingMapRect: bodyLayoutBBOX.width >= minViewWidth
                        ? { left, right, top, bottom }
                        : { left: 0, right: 0, top: 0, bottom: 0 }
                });
            }
        }, 500);
    }, []);

    const selectedKeys = props.selected && join(props.selected.map(({ name }) => name), ',');

    useEffect(() => {
        if (update.current) {
            // update map bounds
            update.current.cancel();
            update.current();
        }
    }, [
        selectedKeys,
        props.width,
        props.height
    ]);

    useEffect(() => {
        setComponents([
            {
                key: 'bodyItems',
                containerName: 'body'
            },
            {
                key: 'backgroundItems',
                containerName: 'background'
            },
            {
                key: 'centerItems',
                containerName: 'center'
            },
            {
                key: 'leftMenuItems',
                containerName: 'left-menu'
            },
            {
                key: 'rightMenuItems',
                containerName: 'right-menu'
            },
            {
                key: 'columnItems',
                containerName: 'column'
            },
            {
                key: 'bottomItems',
                containerName: 'bottom'
            },
            {
                key: 'headerItems',
                containerName: 'header'
            },
            {
                key: 'footerItems',
                containerName: 'footer'
            }
        ]
            .reduce((itemsObject, { key, containerName }) => {
                return {
                    ...itemsObject,
                    [key]: plugins.filter(({ container }) => container === containerName)
                };
            }, {}));
    }, [ loadedPluginsKeys, pluginsLoaded ]);

    useEffect(() => {
        props.onResize(getSize(props.width));
    }, [ props.width ]);

    if (size) {
        const Body = layouts[size];
        const {
            bodyItems = [],
            backgroundItems = [],
            centerItems = [],
            leftMenuItems = [],
            rightMenuItems = [],
            columnItems = [],
            bottomItems = [],
            headerItems = [],
            footerItems = []
        } = components;
        return !loading && !error && Body ? <Body
            { ...props }
            bodyItems={bodyItems}
            backgroundItems={backgroundItems}
            centerItems={centerItems}
            leftMenuItems={leftMenuItems}
            rightMenuItems={rightMenuItems}
            columnItems={columnItems}
            bottomItems={bottomItems}
            headerItems={headerItems}
            footerItems={footerItems}/> : <div />;
    }
    return <div />;
}

Layout.contextTypes = {
    loadedPlugins: PropTypes.object
};

const activePluginsSelector = createShallowSelectorCreator(
    (a, b) => {
        return a === b
            || !isNil(a) && !isNil(b) && a.menuId === b.menuId && a.name === b.name;
    }
)(
    state => get(state, 'controls.layout.activePlugins') || [],
    activePlugins => activePlugins
);

const selector = createSelector(
    [
        activePluginsSelector,
        state => get(state, 'controls.layout.size'),
        state => get(state, 'mapInitialConfig.loadingError'),
        mapSelector,
        userSelector
    ], (selected, size, mapLoadingError, map, user) => ({
        selected,
        size,
        error: !!mapLoadingError,
        loading: !map && !mapLoadingError,
        user
    })
);

const LayoutPlugin = connect(
    selector,
    {
        onControl: setControlProperty,
        onResize: setControlProperty.bind(null, 'layout', 'size'),
        onSelect: setControlProperty.bind(null, 'layout', 'activePlugins'),
        onUpdate: updateMapLayout
    })(withResizeDetector(Layout));

export default createPlugin('Layout', {
    component: LayoutPlugin,
    reducers: {
        maplayout
    }
});
