/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, memo } from 'react';
import { ZOOM_TO_EXTENT_HOOK } from '../../../utils/MapUtils';

/**
 * Triggers the map zoom when a zoom-to interaction writes a `zoomToRequest` on the map (filtered bounds, feature extent)
 */
export default (Component) => memo((props) => {
    const { id, maps = [], updateProperty = () => {}, hookRegister } = props;
    const targetMap = maps.find(m => m?.zoomToRequest);
    const mapId = targetMap?.mapId;
    const zoomToRequest = targetMap?.zoomToRequest;

    useEffect(() => {
        if (!zoomToRequest) {
            return;
        }
        const hook = hookRegister?.getHook(ZOOM_TO_EXTENT_HOOK);
        if (hook) {
            const { extent, crs, maxZoom, padding } = zoomToRequest;
            hook(extent, { crs, maxZoom, ...(padding ? { padding } : {}) });
        }
        updateProperty(id, 'maps', { mapId, zoomToRequest: undefined }, 'merge');
    }, [zoomToRequest]);

    return <Component {...props} />;
});
