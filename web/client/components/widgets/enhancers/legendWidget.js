/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {compose, withHandlers, withProps} from 'recompose';

import { castArray, get } from 'lodash';
import deleteWidget from './deleteWidget';
import { editableWidget, defaultIcons, withHeaderTools } from './tools';
import { getScales } from '../../../utils/MapUtils';
import { WIDGETS_MAPS_REGEX } from "../../../actions/widgets";

/**
 * map dependencies to layers, scales and current zoom level to show legend items for current zoom.
 * Add also base tools and menu to the widget
 */
export default compose(
    withProps(({ dependencies = {}, dependenciesMap = {} }) => {
        const allLayers = dependencies[dependenciesMap.layers] || dependencies.layers || [];
        // filter backgrounds
        const groups = dependencies[dependenciesMap.groups] || dependencies.groups || null;
        const groupsConnected = groups !== null;
        return {
            allLayers,
            groupsConnected,
            map: {
                groups: castArray(groups || []),
                layers: allLayers
            },
            dependencyMapPath: dependenciesMap.layers || '',
            scales: getScales(
                // TODO: this is a fallback that checks the viewport if projection is not defined. We should use only projection
                dependencies.projection || dependencies.viewport && dependencies.viewport.crs || 'EPSG:3857',
                get( dependencies, "mapOptions.view.DPI")
            ),
            currentZoomLvl: dependencies.zoom
        };
    }),
    withHandlers({
        updateProperty: ({updateProperty, dependencyMapPath, groupsConnected}) => (key, value) => {
            if (dependencyMapPath) {
                const [, widgetId, mapId] = WIDGETS_MAPS_REGEX.exec(dependencyMapPath) || [];
                if (mapId && key === 'map') {
                    updateProperty(widgetId, "maps", { mapId, layers: value?.layers }, 'merge');
                    if (groupsConnected) {
                        updateProperty(widgetId, "maps", { mapId, groups: value?.groups }, 'merge');
                    }
                }
            }
        }
    }),
    deleteWidget,
    editableWidget(),
    defaultIcons(),
    withHeaderTools()
);
