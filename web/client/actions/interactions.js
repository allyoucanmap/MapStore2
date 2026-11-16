/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


export const APPLY_WIDGET_INTERACTIONS = 'INTERACTIONS:APPLY_WIDGET_INTERACTIONS';
export const ZOOM_TO_FILTER_EXTENT = 'INTERACTIONS:ZOOM_TO_FILTER_EXTENT';
export const EDIT_MAIN_MAP_INTERACTIONS = 'INTERACTIONS:EDIT_MAIN_MAP_INTERACTIONS';

/**
 * Apply the effects of the interactions sent by a widget source (e.g. a filter of a filter widget)
 * @param {string} widgetId the sender widget id
 * @param {string} [target='floating'] the widgets container
 * @param {string} sourceId the id of the sender sub-element that emits the interactions
 * @param {object} [event] `{ targetTypes, data }` applies only the interactions of the target types with the event data (e.g. a table row click)
 */
export const applyWidgetInteractions = (widgetId, target = 'floating', sourceId, event) => ({
    type: APPLY_WIDGET_INTERACTIONS,
    widgetId,
    target,
    sourceId,
    ...(event ? { event } : {})
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
 * Opens the widget builder on the main map interactions, creating the main map entry if missing
 */
export const editMainMapInteractions = () => ({
    type: EDIT_MAIN_MAP_INTERACTIONS
});
