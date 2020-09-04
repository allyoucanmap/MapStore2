/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import BaseMap from '../../../web/client/components/map/BaseMap';
import mapType from '../../../web/client/components/map/enhancers/mapType';

const MapComponent = mapType(BaseMap);
/**
 * Base map component that renders a map.
 * It is implementation independent.
 * The implementation of the layer is provided by the `plugins` property
 */
const Map = (props) => {
    return <MapComponent {...props}/>;
};

Map.propTypes = {
    id: PropTypes.string,
    mapType: PropTypes.string,
    options: PropTypes.object,
    map: PropTypes.object,
    mapStateSource: PropTypes.string,
    eventHandlers: PropTypes.object,
    styleMap: PropTypes.object,
    layers: PropTypes.array,
    hookRegister: PropTypes.object,
    projectionDefs: PropTypes.array,
    plugins: PropTypes.any,
    tools: PropTypes.array,
    getLayerProps: PropTypes.func,
    env: PropTypes.array
};

Map.defaultProps = {
    id: '__base_map__',
    mapType: 'leaflet',
    options: {},
    map: {},
    styleMap: {},
    layers: [],
    tools: [],
    projectionDefs: [],
    eventHandlers: {
        onMapViewChanges: () => {},
        onClick: () => {},
        onMouseMove: () => {},
        onLayerLoading: () => {},
        onLayerError: () => {}
    },
    env: []
};

export default Map;
