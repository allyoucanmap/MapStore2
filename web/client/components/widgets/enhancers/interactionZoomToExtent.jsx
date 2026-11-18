/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useMemo, useState, memo } from 'react';
import { createRegisterHooks, ZOOM_TO_EXTENT_HOOK } from '../../../utils/MapUtils';

/**
 * Triggers the map zoom when a zoom-to interaction writes a `zoomToRequest` on the displayed map (filtered bounds, feature extent)
 * Provides the `hookRegister` of the widget map, where the map registers its zoom hook.
 * A request waits until the map registers its zoom hook (e.g. on dashboard load) or until its map is displayed
 */
export default (Component) => memo((props) => {
    const { id, maps = [], selectedMapId, updateProperty = () => {} } = props;
    const [zoomHookRegistered, setZoomHookRegistered] = useState(false);
    const hookRegister = useMemo(() => {
        const register = props.hookRegister?.id === id ? props.hookRegister : createRegisterHooks(id);
        return {
            ...register,
            registerHook: (name, hook) => {
                register.registerHook(name, hook);
                if (name === ZOOM_TO_EXTENT_HOOK) {
                    setZoomHookRegistered(true);
                }
            }
        };
    }, [id, props.hookRegister]);
    const displayedMap = maps.find(m => m?.mapId === selectedMapId) ?? (maps.length === 1 ? maps[0] : undefined);
    const mapId = displayedMap?.mapId;
    const zoomToRequest = displayedMap?.zoomToRequest;

    useEffect(() => {
        const hook = hookRegister.getHook(ZOOM_TO_EXTENT_HOOK);
        if (!zoomToRequest || !hook) {
            return;
        }
        const { extent, crs, maxZoom, padding } = zoomToRequest;
        hook(extent, { crs, maxZoom, ...(padding ? { padding } : {}) });
        updateProperty(id, 'maps', { mapId, zoomToRequest: undefined }, 'merge');
    }, [zoomToRequest, zoomHookRegistered]);

    return <Component {...props} hookRegister={hookRegister} />;
});
