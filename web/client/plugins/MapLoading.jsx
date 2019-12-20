/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { layersSelector } from '../selectors/layers';
import { createPlugin } from '../utils/PluginsUtils';

function MapLoading({ loading }) {
    return loading ? <div
        className="square-button"
        style={{
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            overflow: 'hidden',
            position: 'absolute',
            top: -40,
            padding: 4
        }}>
        <div className="mapstore-medium-size-loader" />
    </div> : null;
}

MapLoading.propTypes = {
    loading: PropTypes.bool
};

const selector = createSelector([layersSelector], (layers) => ({
    loading: layers && layers.some((layer) => layer.loading)
}));

const MapLoadingPlugin = connect(selector)(MapLoading);

export default createPlugin('MapLoading', {
    component: MapLoadingPlugin,
    containers: {
        Toolbar: {
            name: 'maploading',
            position: 1,
            tool: true,
            priority: 10,
            alwaysVisible: true
        }
    }
});
