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
import { TARGET_TYPES } from '../../../utils/InteractionUtils';
import { getLegendLayerChanges } from '../../../utils/InteractionEffectsUtils';

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
 * Feeds the legend with the map it controls (`legendMap`: `{ widgetId, mapId, map }`) and sends the legend changes
 * as `APPLY_LEGEND` interaction events, applied to that map by the interactions epic
 */
export const withLegendMapData = (Component) => ({ legendMap, onApplyWidgetInteractions = () => {}, ...props }) => {
    if (!legendMap?.map) {
        return <Component {...props} noMapConnected />;
    }
    // the legend also reports its own state (e.g. empty legend images), only the changes of the map layers are sent
    const sendLegendChange = (key, value) => {
        const layers = key === 'map' ? getLegendLayerChanges(legendMap.map.layers, value?.layers) : [];
        if (layers.length > 0) {
            onApplyWidgetInteractions(props.id, undefined, props.id, {
                targetTypes: [TARGET_TYPES.APPLY_LEGEND],
                data: { layers }
            });
        }
    };
    return <Component {...props} {...getLegendViewProps(legendMap.map)} updateProperty={sendLegendChange} noMapConnected={false} />;
};

/**
 * Legend widget enhancer: base tools and menu, controlled map data
 */
export default compose(
    deleteWidget,
    editableWidget(),
    defaultIcons(),
    withHeaderTools(),
    // innermost: only the legend view sends the legend changes, the tools keep the widget updateProperty
    withLegendMapData
);
