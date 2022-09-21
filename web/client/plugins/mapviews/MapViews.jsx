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
    setupViews
} from '../../actions/mapviews';
import mapviews from '../../reducers/mapviews';
import MapViewsSupport from './MapViewsSupport';
import { layersSelector } from '../../selectors/layers';
import { currentLocaleSelector } from '../../selectors/locale';
import epics from '../../epics/mapviews';
import {
    getSelectedMapViewId,
    getMapViews
} from '../../selectors/mapviews';
import { registerCustomSaveHandler } from '../../selectors/mapsave';

const MAP_VIEWS_ID = 'mapViews';

registerCustomSaveHandler(MAP_VIEWS_ID, (state) => ({
    selectedId: getSelectedMapViewId(state),
    views: getMapViews(state)
}));

const reducers = {
    mapviews
};

function MapViews({
    pluginName,
    mapConfig,
    onSetup = () => {},
    ...props
}) {

    useStoreManager(pluginName, { reducers, epics });

    const [reloadKey, setReload] = useState(uuid());
    useEffect(() => {
        onSetup(mapConfig?.[MAP_VIEWS_ID]);
        setReload(uuid());
        return () => {
            onSetup();
        };
    }, [mapConfig?.[MAP_VIEWS_ID]]);

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
        state => state?.mapConfigRawData
    ], (selectedId, views, layers, locale, mapConfig) => ({
        selectedId,
        views,
        layers: layers.filter(({ group }) => group !== 'background'),
        locale,
        mapConfig
    })),
    {
        onSelectView: selectView,
        onUpdateViews: updateViews,
        onSetup: setupViews
    }
)(MapViews);

export default ConnectedMapViews;
