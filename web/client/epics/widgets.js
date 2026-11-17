/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/


import Rx from 'rxjs';
import { has, castArray } from 'lodash';

import {
    EXPORT_CSV,
    onEditorChange,
    updateWidgetLayer,
    clearWidgets,
    EDITOR_CHANGE,
    OPEN_FILTER_EDITOR,
    updateWidgetProperty
} from '../actions/widgets';

import { changeMapEditor } from '../actions/queryform';
import { MAP_CONFIG_LOADED } from '../actions/config';
import { TOGGLE_CONTROL } from '../actions/controls';
import { queryPanelSelector } from '../selectors/controls';

import {
    getWidgetLayer
} from '../selectors/widgets';
import { CHANGE_LAYER_PROPERTIES, LAYER_LOAD, LAYER_ERROR, UPDATE_NODE } from '../actions/layers';

import { getLayerFromId } from '../selectors/layers';
import { pathnameSelector } from '../selectors/router';
import { isDashboardEditing } from '../selectors/dashboard';
import { LOCATION_CHANGE } from 'connected-react-router';
import { saveAs } from 'file-saver';
import {reprojectBbox} from '../utils/CoordinatesUtils';
import {json2csv} from 'json-2-csv';
import { defaultGetZoomForExtent } from '../utils/MapUtils';
import { DEFAULT_MAP_SETTINGS } from "../utils/WidgetsUtils";
import { hide, SAVE } from '../actions/mapEditor';

export const exportWidgetData = action$ =>
    action$.ofType(EXPORT_CSV)
        .do( ({data = [], title = "data"}) =>
            saveAs(new Blob([
                json2csv(data)
            ], {type: "text/csv"}), title + ".csv"))
        .filter( () => false);
export const clearWidgetsOnLocationChange = (action$, {getState = () => {}} = {}) =>
    action$.ofType(MAP_CONFIG_LOADED).switchMap( () => {
        const location = pathnameSelector(getState()).split('/');
        const locationDifference = location[location.length - 1];
        return action$.ofType(LOCATION_CHANGE)
            .filter( ({ payload }) => {
                const newLocation = pathnameSelector(getState()).split('/');
                const newLocationDifference = newLocation[newLocation.length - 1];
                return payload.action !== 'REPLACE' && newLocationDifference !== locationDifference;
            }).switchMap( ({payload = {}} = {}) => {
                if (payload && payload.location && payload.location.pathname) {
                    return Rx.Observable.of(clearWidgets());
                }
                return Rx.Observable.empty();
            });
    });

/**
 * Triggers updates of the layer property of widgets on layerFilter change
 * @memberof epics.widgets
 * @param {external:Observable} action$ manages `CHANGE_LAYER_PROPERTIES`
 * @return {external:Observable}
 */
export const updateLayerOnLayerPropertiesChange = (action$, store) =>
    action$.ofType(CHANGE_LAYER_PROPERTIES, UPDATE_NODE)
        .filter(({layer, newProperties, nodeType, options}) => {
            return (layer && newProperties) || (nodeType === "layers" && has(options, "layerFilter"));
        })
        .switchMap(({layer, newProperties, node, options}) => {
            const state = store.getState();
            const flatLayer = getLayerFromId(state, layer ?? node);
            const shouldUpdate = flatLayer && (has(newProperties ?? options, "layerFilter") || has(newProperties, "fields"));
            if (shouldUpdate) {
                return Rx.Observable.of(updateWidgetLayer(flatLayer));
            }
            return Rx.Observable.empty();
        });

/**
 * Triggers updates of the layer property of widgets on loading error state change
 * @memberof epics.widgets
 * @param {external:Observable} action$ manages `LAYER_LOAD, LAYER_ERROR`
 * @return {external:Observable}
 */
export const updateLayerOnLoadingErrorChange = (action$, store) =>
    action$.ofType(LAYER_LOAD, LAYER_ERROR)
        .flatMap(action => castArray(action.layerId).map(layerId => ({ ...action, layerId })))
        .groupBy(({layerId}) => layerId)
        .map(layerStream$ => layerStream$
            .map(({layerId}) => getLayerFromId(store.getState(), layerId))
            .filter(flatLayer => !!flatLayer)
            .distinctUntilChanged((a, b) => (a.loadingError || false) === (b.loadingError || false))
            .filter(flatLayer => flatLayer.previousLoadingError !== flatLayer.loadingError)
            .map(flatLayer => updateWidgetLayer(flatLayer))
        ).mergeAll();

export const onWidgetCreationFromMap = (action$, store) =>
    action$.ofType(EDITOR_CHANGE)
        .filter(({key, value}) => key === 'widgetType' && value === 'chart' && !isDashboardEditing(store.getState()))
        .switchMap(() => {
            let observable$ = Rx.Observable.empty();
            const state = store.getState();
            const layer = getWidgetLayer(state);
            if (layer) {
                observable$ = Rx.Observable.of(
                    onEditorChange('chart-layers', [layer])
                );
            }
            return observable$;
        });


export const onOpenFilterEditorEpic = (action$, store) =>
    action$.ofType(OPEN_FILTER_EDITOR)
        .switchMap(() => {
            const state = store.getState();
            const layer = getWidgetLayer(state);
            const bbox = layer?.bbox;
            const extent = bbox?.bounds
                ? reprojectBbox(bbox.bounds, bbox?.crs || "EPSG:4326", "EPSG:3857")
                : null;
            if (!extent) {
                return Rx.Observable.of(changeMapEditor(null));
            }
            const zoom = defaultGetZoomForExtent(extent, DEFAULT_MAP_SETTINGS.size, 0, 21, 96, DEFAULT_MAP_SETTINGS.resolutions);
            const map = {
                ...DEFAULT_MAP_SETTINGS,
                zoom,
                center: {
                    crs: bbox?.crs || "EPSG:4326",
                    x: (bbox.bounds.maxx + bbox.bounds.minx) / 2,
                    y: (bbox.bounds.maxy + bbox.bounds.miny) / 2
                }
            };
            return Rx.Observable.of(changeMapEditor(map));
        });


export const onResetMapEpic = (action$, store) =>
    action$.ofType(TOGGLE_CONTROL)
        .filter((type, control) => !queryPanelSelector(store.getState()) && control === "queryPanel" && isDashboardEditing(store.getState()))
        .switchMap(() => {
            return Rx.Observable.of(
                changeMapEditor(null)
            );
        });

export const onMapEditorOpenEpic = (action$) =>
    action$.ofType(SAVE)
        .filter(({map} = {}) => map?.widgetId)
        .switchMap(({map}) => {
            return Rx.Observable.of(
                updateWidgetProperty(map.widgetId, "maps", map, "merge"),
                hide("widgetInlineEditor")
            );
        });

export default {
    exportWidgetData,
    clearWidgetsOnLocationChange,
    updateLayerOnLayerPropertiesChange,
    updateLayerOnLoadingErrorChange,
    onWidgetCreationFromMap,
    onOpenFilterEditorEpic,
    onResetMapEpic,
    onMapEditorOpenEpic
};
