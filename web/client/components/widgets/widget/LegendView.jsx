/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import TOC from "../../TOC/TOC";

export default ({
    updateProperty = () => {},
    legendProps = {},
    currentZoomLvl,
    disableOpacitySlider = false,
    disableVisibility = false,
    legendExpanded = false,
    scales,
    language,
    currentLocale,
    map
}) => {
    return (
        <TOC
            map={map}
            className="legend-tree"
            config={{
                sortable: false,
                hideOpacitySlider: disableOpacitySlider,
                hideVisibilityButton: disableVisibility,
                expanded: legendExpanded === true ? true : undefined,
                language,
                currentLocale,
                scales,
                zoom: currentZoomLvl,
                layerOptions: {
                    legendOptions: legendProps
                }
            }}
            onChangeMap={(newMap) => {
                updateProperty('map', newMap);
            }}
        />
    );
};
