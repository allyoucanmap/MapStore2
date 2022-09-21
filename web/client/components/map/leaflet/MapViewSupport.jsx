/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect } from 'react';

function MapViewSupport({
    map,
    apiRef = () => {}
}) {

    useEffect(() => {
        apiRef({
            getView: () => {
                const view = map.getView();
                const center = view.getCenter();
                const [x, y] = center;
                const zoom = view.getZoom();
                const projection = view.getProjection();
                const extent = projection.getExtent();
                const [minx, miny, maxx, maxy] = extent;
                const crs = projection.getCode();
                return {
                    zoom,
                    center: { x, y, crs },
                    bbox: {
                        bounds: { minx, miny, maxx, maxy },
                        crs
                    }
                };
            }
        });
    }, []);

    return null;
}

export default MapViewSupport;
