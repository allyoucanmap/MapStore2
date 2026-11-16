/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { compose } from 'recompose';

import { castArray, get } from 'lodash';
import deleteWidget from './deleteWidget';
import { editableWidget, defaultIcons, withHeaderTools } from './tools';
import { getScales } from '../../../utils/MapUtils';
import { getInactiveNode, DEFAULT_GROUP_ID } from '../../../utils/LayersUtils';

/**
 * Returns the legend view props of the controlled map, showing the layers of the visible groups without backgrounds
 * @param {object} map the map controlled by the legend
 * @returns {object} `{ map, scales, currentZoomLvl }`
 */
export const getLegendViewProps = (map = {}) => {
    const groups = castArray(map.groups || []);
    const layers = (map.layers || [])
        .filter((layer = {}) => layer.group !== 'background' && !getInactiveNode(layer?.group || DEFAULT_GROUP_ID, groups))
        // the legend images ignore the layer CQL filter, as the previous legend did
        .map(({ group, ...layer }) => ({ ...layer, params: { ...layer.params, CQL_FILTER: undefined } }));
    return {
        map: {
            layers,
            // empty, so the default group is created and hidden in the layers tree
            groups: [],
            projection: map.projection,
            bbox: map.bbox
        },
        // falls back to the extent projection when the map projection is missing
        scales: getScales(map.projection || map.bbox?.crs || 'EPSG:3857', get(map, 'mapOptions.view.DPI')),
        currentZoomLvl: map.zoom
    };
};

/**
 * Returns the layers of the controlled map with the legend changes (visibility, opacity, expanded, legend filter)
 * @param {object[]} mapLayers the layers of the controlled map
 * @param {object[]} legendLayers the layers changed in the legend
 * @returns {object[]} the updated map layers
 */
export const mergeLegendLayerChanges = (mapLayers = [], legendLayers = []) => mapLayers.map(layer => {
    const legendLayer = legendLayers.find(l => l.id === layer.id);
    return legendLayer
        ? { ...layer, visibility: legendLayer.visibility, opacity: legendLayer.opacity, expanded: legendLayer.expanded, layerFilter: legendLayer.layerFilter }
        : layer;
});

/**
 * Feeds the legend with the map it controls (`legendMap`: `{ widgetId, mapId, map }`) and writes the legend changes back to that map
 */
export const withLegendMapData = (Component) => ({ legendMap, updateProperty = () => {}, ...props }) => {
    if (!legendMap?.map) {
        return <Component {...props} updateProperty={updateProperty} noMapConnected />;
    }
    const { widgetId, mapId, map } = legendMap;
    const updateMap = (key, value) => {
        if (key === 'map') {
            updateProperty(widgetId, 'maps', { mapId, layers: mergeLegendLayerChanges(map.layers, value?.layers) }, 'merge');
        }
    };
    return <Component {...props} {...getLegendViewProps(map)} updateProperty={updateMap} noMapConnected={false} />;
};

/**
 * Legend widget enhancer: controlled map data, base tools and menu
 */
export default compose(
    withLegendMapData,
    deleteWidget,
    editableWidget(),
    defaultIcons(),
    withHeaderTools()
);
