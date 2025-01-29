
import React, { lazy, Suspense } from 'react';
import { MapLibraries } from '../../../utils/MapTypeUtils';

const drawGeometrySupportSupports = {
    [MapLibraries.OPENLAYERS]: lazy(() => import(/* webpackChunkName: 'supports/olDrawGeometrySupport' */ '../../../components/map/openlayers/DrawGeometrySupport')),
    [MapLibraries.CESIUM]: lazy(() => import(/* webpackChunkName: 'supports/cesiumDrawGeometrySupport' */ '../../../components/map/cesium/DrawGeometrySupport'))
};

const editGeoJSONSupportSupports = {
    [MapLibraries.OPENLAYERS]: lazy(() => import(/* webpackChunkName: 'supports/olEditGeoJSONSupport' */ '../../../components/map/openlayers/EditGeoJSONSupport')),
    [MapLibraries.CESIUM]: lazy(() => import(/* webpackChunkName: 'supports/cesiumEditGeoJSONSupport' */ '../../../components/map/cesium/EditGeoJSONSupport'))
};

function HelloWorldMapSupport({
    map,
    mapType,
    active
}) {
    const DrawGeometrySupportComponent = drawGeometrySupportSupports[mapType];
    if (!DrawGeometrySupportComponent) {
        return null;
    }
    return (
        <Suspense fallback={null}>
            <DrawGeometrySupportComponent
                map={map}
                active={active}
                geometryType="LineString"
                onDrawEnd={(collection) => {
                    console.log(collection);
                }}
            />
        </Suspense>
    );
}

export default HelloWorldMapSupport;
