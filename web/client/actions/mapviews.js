/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const SETUP_VIEWS = 'MAP_VIEWS:SETUP_VIEWS';
export const ACTIVATE_VIEWS = 'MAP_VIEWS:ACTIVATE_VIEWS';
export const SELECT_VIEW = 'MAP_VIEWS:SELECT_VIEW';
export const UPDATE_VIEWS = 'MAP_VIEWS:UPDATE_VIEWS';
export const UPDATE_RESOURCES = 'MAP_VIEWS:UPDATE_RESOURCES';

export const setupViews = (config) => ({
    type: SETUP_VIEWS,
    config
});

export const activateViews = (active) => ({
    type: ACTIVATE_VIEWS,
    active
});

export const selectView = (id) => ({
    type: SELECT_VIEW,
    id
});

export const updateViews = (views) => ({
    type: UPDATE_VIEWS,
    views
});

export const updateResources = (resources) => ({
    type: UPDATE_RESOURCES,
    resources
});
