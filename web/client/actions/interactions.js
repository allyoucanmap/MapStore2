/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


export const APPLY_WIDGET_INTERACTIONS = 'INTERACTIONS:APPLY_WIDGET_INTERACTIONS';
export const ZOOM_TO_FILTER_EXTENT = 'INTERACTIONS:ZOOM_TO_FILTER_EXTENT';
export const ZOOM_TO_FEATURE = 'INTERACTIONS:ZOOM_TO_FEATURE';

/**
 * Apply the effects of the interactions sent by a widget source (e.g. a filter of a filter widget)
 * @param {string} widgetId the sender widget id
 * @param {string} [target='floating'] the widgets container
 * @param {string} sourceId the id of the sender sub-element that emits the interactions
 */
export const applyWidgetInteractions = (widgetId, target = 'floating', sourceId) => ({
    type: APPLY_WIDGET_INTERACTIONS,
    widgetId,
    target,
    sourceId
});

/**
 * Manually trigger the zoom-to interactions of a filter widget's filter
 * @param {string} widgetId the filter widget id
 * @param {string} [target='floating'] the widgets container
 * @param {string} sourceId the filter id whose plugged zoom-to interactions should zoom
 */
export const zoomToFilterExtent = (widgetId, target = 'floating', sourceId) => ({
    type: ZOOM_TO_FILTER_EXTENT,
    widgetId,
    target,
    sourceId
});

/**
 * Zoom the maps connected to the zoom to feature interactions of a widget source to a feature
 * @param {string} widgetId the sender widget id
 * @param {string} [target='floating'] the widgets container
 * @param {string} sourceId the id of the sender sub-element that emits the interactions
 * @param {object} feature the GeoJSON feature, with `bbox` or `geometry`
 * @param {object} [options] `{ crs, maxZoom }` projection of the feature and max zoom level
 */
export const zoomToFeature = (widgetId, target = 'floating', sourceId, feature, { crs, maxZoom } = {}) => ({
    type: ZOOM_TO_FEATURE,
    widgetId,
    target,
    sourceId,
    feature,
    crs,
    maxZoom
});
