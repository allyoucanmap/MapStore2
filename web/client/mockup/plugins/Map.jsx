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
import { compose } from 'recompose';
import { createSelector } from 'reselect';
import { get } from 'lodash';
// import loadingState from '../../components/misc/enhancers/loadingState';
import emptyState from '../../components/misc/enhancers/emptyState';
import { MapPlugin as MSMapPlugin, reducers as mapReducers, epics } from '../../plugins/Map';
import { mapSelector } from '../../selectors/map';
import { resizeMap } from '../../actions/map';
import { layersSelector } from '../../selectors/layers';
import { createPlugin}  from '../../utils/PluginsUtils';

const selector = createSelector(
    [
        mapSelector,
        state => get(state, 'mapInitialConfig.loadingError'),
        layersSelector,
        state => get(state, 'controls.visualStyleEditor.loading')
    ], (map, loadingError, layers = []) => ({
        map,
        loadingError,
        layersCount: layers.length
    })
);

class MapContainer extends React.Component {
    static propTypes = {
        size: PropTypes.bool,
        onResize: PropTypes.func,
        backgroundColor: PropTypes.string
    };
    static defaultProps = {
        onResize: () => {}
    };

    componentDidMount() {
        setTimeout(() => {
            this.props.onResize();
        }, 500);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.size !== this.props.size) {
            this.props.onResize();
        }
    }

    render() {
        return (
            <MSMapPlugin
                fonts={null}
                {...this.props}
                style={{
                    backgroundColor: this.props.backgroundColor
                }}/>
        );
    }
}

const MapPlugin = compose(
    connect(selector, {
        onResize: resizeMap
    }),
    // loadingState(({ map, loadingError }) => (!map && !loadingError)),
    emptyState(
        ({ loadingError }) => loadingError,
        () => ({
            title: 'Missing Map',
            description: 'Error loading map configuration',
            glyph: '1-map'
        })
    )
)(MapContainer);

const { map, ...reducers } = mapReducers;

export default createPlugin('Map', {
    component: MapPlugin,
    reducers,
    epics
});
