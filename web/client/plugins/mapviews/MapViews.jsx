/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { createSelector } from 'reselect';
import uuid from 'uuid';

import useStoreManager from '../../hooks/useStoreManager';
import {
    updateViews,
    selectView,
    setupViews,
    updateResources
} from '../../actions/mapviews';
import mapviews from '../../reducers/mapviews';
import MapViewsSupport from '../../components/mapviews/MapViewsSupport';
import { layersSelector } from '../../selectors/layers';
import { currentLocaleSelector } from '../../selectors/locale';
import epics from '../../epics/mapviews';
import {
    getSelectedMapViewId,
    getMapViews,
    getMapViewsResources,
    isMapViewsActive,
    isMapViewsHidden
} from '../../selectors/mapviews';
const reducers = {
    mapviews
};

function MapViews({
    pluginName,
    mapConfig,
    onSetup = () => {},
    active,
    mapViewsConfigKey,
    ...props
}) {

    useStoreManager(pluginName, { reducers, epics });

    const [reloadKey, setReload] = useState(uuid());
    useEffect(() => {
        onSetup(mapConfig?.[mapViewsConfigKey]);
        setReload(uuid());
        return () => {
            onSetup();
        };
    }, [mapConfig?.[mapViewsConfigKey]]);

    if (!active) {
        return null;
    }

    return (
        <MapViewsSupport
            key={reloadKey}
            {...props}
        />
    );
}

const ConnectedMapViews = connect(
    createSelector([
        getSelectedMapViewId,
        getMapViews,
        layersSelector,
        currentLocaleSelector,
        state => state?.mapConfigRawData,
        getMapViewsResources,
        isMapViewsActive,
        isMapViewsHidden
    ], (selectedId, views, layers, locale, mapConfig, resources, active, hide) => ({
        selectedId,
        views,
        layers: layers.filter(({ group }) => group !== 'background'),
        locale,
        mapConfig,
        resources,
        active,
        hide
    })),
    {
        onSelectView: selectView,
        onUpdateViews: updateViews,
        onSetup: setupViews,
        onUpdateResources: updateResources
    }
)(MapViews);

export default ConnectedMapViews;
