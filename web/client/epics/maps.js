/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const Rx = require('rxjs');
const uuidv1 = require('uuid/v1');
const assign = require('object-assign');
const { basicError, basicSuccess } = require('../utils/NotificationUtils');
const GeoStoreApi = require('../api/GeoStoreDAO');
const { MAP_INFO_LOADED } = require('../actions/config');
const { isNil, find } = require('lodash');
const {
    SAVE_DETAILS, SAVE_RESOURCE_DETAILS, MAPS_GET_MAP_RESOURCES_BY_CATEGORY,
    DELETE_MAP, OPEN_DETAILS_PANEL, MAPS_LOAD_MAP,
    CLOSE_DETAILS_PANEL, NO_DETAILS_AVAILABLE, SAVE_MAP_RESOURCE,
    setDetailsChanged, updateDetails, mapsLoading, mapsLoaded,
    mapDeleting, toggleDetailsEditability, mapDeleted, loadError,
    doNothing, detailsLoaded, detailsSaving, onDisplayMetadataEdit,
    RESET_UPDATING, resetUpdating, toggleDetailsSheet, getMapResourcesByCategory,
    mapUpdating, savingMap, mapCreated, mapError
} = require('../actions/maps');
const {
    resetCurrentMap, EDIT_MAP
} = require('../actions/currentMap');
const { closeFeatureGrid } = require('../actions/featuregrid');
const { toggleControl } = require('../actions/controls');
const {
    mapPermissionsFromIdSelector, mapThumbnailsUriFromIdSelector,
    mapDetailsUriFromIdSelector
} = require('../selectors/maps');

const {
    mapIdSelector, mapInfoDetailsUriFromIdSelector
} = require('../selectors/map');
const {
    currentMapDetailsTextSelector, currentMapIdSelector,
    currentMapDetailsUriSelector, currentMapSelector,
    currentMapDetailsChangedSelector, currentMapOriginalDetailsTextSelector
} = require('../selectors/currentmap');

const { userParamsSelector } = require('../selectors/security');
const { deleteResourceById, createAssociatedResource, deleteAssociatedResource, updateAssociatedResource } = require('../utils/ObservableUtils');

const { getIdFromUri } = require('../utils/MapUtils');

const { getErrorMessage } = require('../utils/LocaleUtils');
const Persistence = require("../api/persistence");

const manageMapResource = ({ map = {}, attribute = "", resource = null, type = "STRING", optionsDel = {}, messages = {} } = {}) => {
    const attrVal = map[attribute];
    const mapId = map.id;
    // create
    if ((isNil(attrVal) || attrVal === "NODATA") && !isNil(resource)) {
        return createAssociatedResource({ ...resource, attribute, mapId, type, messages });
    }
    if (isNil(resource)) {
        // delete
        return deleteAssociatedResource({
            mapId,
            attribute,
            type,
            resourceId: getIdFromUri(attrVal),
            options: optionsDel,
            messages
        });
    }
    // update
    return updateAssociatedResource({
        permissions: resource.permissions,
        resourceId: getIdFromUri(attrVal),
        value: resource.value,
        attribute,
        options: resource.optionsAttr,
        messages
    });

};

/**
    If details are changed from the original ones then set unsavedChanges to true
*/
const setDetailsChangedEpic = (action$, store) =>
    action$.ofType(SAVE_DETAILS)
        .switchMap((a) => {
            let actions = [];
            const state = store.getState();
            const detailsUri = currentMapDetailsUriSelector(state);
            if (a.detailsText.length <= 500000) {
                actions.push(toggleDetailsSheet(true));
            } else {
                actions.push(basicError({ message: "maps.feedback.errorSizeExceeded" }));
            }
            if (!detailsUri) {
                actions.push(setDetailsChanged(a.detailsText !== "<p><br></p>"));
                return Rx.Observable.from(actions);
            }
            const originalDetails = currentMapOriginalDetailsTextSelector(state);
            const currentDetails = currentMapDetailsTextSelector(state);
            actions.push(setDetailsChanged(originalDetails !== currentDetails));
            return Rx.Observable.from(actions);
        });


/**
 * If the details resource does not exist it saves it, and it updates its permission with the one set for the mapPermissionsFromIdSelector
 * and it updates the attribute details in map resource
*/
const saveResourceDetailsEpic = (action$, store) =>
    action$.ofType(SAVE_RESOURCE_DETAILS)
        .switchMap(() => {
            const state = store.getState();
            const mapId = currentMapIdSelector(state);
            const value = currentMapDetailsTextSelector(state, mapId);
            const detailsChanged = currentMapDetailsChangedSelector(state);

            let params = {
                attribute: "details",
                map: currentMapSelector(state),
                resource: null,
                type: "STRING"
            };
            if (!detailsChanged) {
                return Rx.Observable.of(doNothing());
            }
            if (value !== "" && detailsChanged) {
                params.resource = {
                    category: "DETAILS",
                    userParams: userParamsSelector(state),
                    metadata: { name: uuidv1() },
                    value,
                    permissions: mapPermissionsFromIdSelector(state, mapId),
                    optionsAttr: {},
                    optionsRes: {}
                };
            } else {
                params.optionsDel = {};
            }
            return manageMapResource({
                ...params
            }).concat([detailsSaving(false), resetUpdating(mapId)]).startWith(detailsSaving(true));
        });

/**
    Epics used to fetch and/or open the details modal
*/
const fetchDetailsFromResourceEpic = (action$, store) =>
    action$.ofType(EDIT_MAP)
        .switchMap(() => {
            const state = store.getState();
            const mapId = currentMapIdSelector(state);
            const detailsUri = currentMapDetailsUriSelector(state);
            if (!detailsUri || detailsUri === "NODATA") {
                return Rx.Observable.of(
                    updateDetails("", true, "")
                );
            }
            const detailsId = getIdFromUri(detailsUri);
            return Rx.Observable.fromPromise(GeoStoreApi.getData(detailsId)
                .then(data => data))
                .switchMap((details) => {
                    return Rx.Observable.of(
                        updateDetails(details, true, details)
                    );
                }).catch(() => {
                    return Rx.Observable.of(
                        basicError({ message: "maps.feedback.errorFetchingDetailsOfMap" }),
                        updateDetails(NO_DETAILS_AVAILABLE, true, NO_DETAILS_AVAILABLE),
                        toggleDetailsEditability(mapId));
                });
        });

/**
     Epics used to load Maps
 */
const loadMapsEpic = (action$) =>
    action$.ofType(MAPS_LOAD_MAP)
        .switchMap((action) => {
            let { params, searchText, geoStoreUrl } = action;
            let modifiedSearchText = searchText.replace(/[/?:;@=&\\]+/g, '');
            let opts = assign({}, { params }, geoStoreUrl ? { baseURL: geoStoreUrl } : {});
            return Rx.Observable.of(
                mapsLoading(modifiedSearchText, params),
                getMapResourcesByCategory("MAP", modifiedSearchText, opts)
            );

        });

const getMapsResourcesByCategoryEpic = (action$) =>
    action$.ofType(MAPS_GET_MAP_RESOURCES_BY_CATEGORY)
        .switchMap((action) => {
            let { map, searchText, opts } = action;
            return Rx.Observable.fromPromise(GeoStoreApi.getResourcesByCategory(map, searchText, opts)
                .then(data => data))
                .switchMap((response) => Rx.Observable.of(
                    mapsLoaded({ "success": true, "totalCount": 18, "results": [{ "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-07-18 12:47:04.212", "lastUpdate": "2018-07-19 10:55:30.119", "description": "", "id": 6238, "name": "QA-12345621", "thumbnail": "NODATA", "details": "rest%2Fgeostore%2Fdata%2F6805%2Fraw%3Fdecode%3Ddatauri", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-06-13 10:44:27.393", "lastUpdate": "2018-06-13 15:15:05.486", "description": "Map Sample for the Training. Please do not delete. ", "id": 6200, "name": "Map Sample", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2013-05-16 23:14:04.051", "lastUpdate": "2018-02-22 15:48:02.171", "description": "", "id": 356, "name": "Unesco Italian Items", "thumbnail": "https://demo.geo-solutions.it/share/MapStore2-previews/unesco_thumb.png", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2014-03-08 13:09:44.239", "lastUpdate": "2017-05-03 14:32:24.842", "description": "Current Temperature Southern Europe from meteo stations.Credits to LaMMa.", "id": 451, "name": "LaMMa Current Temperature Southern Europe", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3201%2Fraw%3Fdecode%3Ddatauri", "featured": "false", "owner": "geosolutions" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-08-29 16:13:14.646", "description": "Map that contains data from Daraa for OWS14", "id": 7234, "name": "OWS14 Daraa Map", "thumbnail": "rest%2Fgeostore%2Fdata%2F7237%2Fraw%3Fdecode%3Ddatauri", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-08-29 16:31:20.169", "lastUpdate": "2018-08-30 12:17:58.779", "description": "OSM from Maps @ GeoSolutions", "id": 7242, "name": "OSM from Maps @ GeoSolutions", "thumbnail": "rest%2Fgeostore%2Fdata%2F7245%2Fraw%3Fdecode%3Ddatauri", "featured": "true", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2014-04-04 12:14:21.17", "lastUpdate": "2017-05-17 10:18:11.455", "description": "", "id": 464, "name": "Historical Maps of Florence", "thumbnail": "https://demo.geo-solutions.it/share/MapStore2-previews/histo-flowrence.png", "details": "NODATA", "featured": "true", "owner": "geosolutions" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-02-01 12:07:12.871", "lastUpdate": "2018-06-18 16:27:30.784", "description": "Map of US Population with statistics about inhabitants and workers percentage per region", "id": 4093, "name": "US Population Statistics", "thumbnail": "rest%2Fgeostore%2Fdata%2F4096%2Fraw%3Fdecode%3Ddatauri", "featured": "true", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2017-07-12 10:32:04.96", "lastUpdate": "2017-11-22 12:37:25.102", "description": "This data is derived from OSM, and used in OGC Testbed 13 for experimental purposes only", "id": 2698, "name": "OGC Testbed 13 - Daraa", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F2841%2Fraw%3Fdecode%3Ddatauri", "owner": "Gnafu" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2017-11-21 12:22:16.063", "lastUpdate": "2018-02-02 08:55:44.075", "description": "Institutii de invatamant din sectorul agroalimentar din R. Moldova", "id": 3267, "name": "Agricultura (invatamant)", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3321%2Fraw%3Fdecode%3Ddatauri", "owner": "evgenii" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2012-10-29 16:15:01.964", "lastUpdate": "2018-01-29 14:48:39.418", "description": "Tessuto Urbanizzato del comune di Bolzano ", "id": 191, "name": "Tessuto Urbanizzato Bolzano", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3194%2Fraw%3Fdecode%3Ddatauri", "details": "NODATA", "owner": "geosolutions" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2017-11-27 10:18:58.122", "lastUpdate": "2017-11-29 11:34:36.721", "description": "Owner: Gnafu", "id": 3353, "name": "NaturalEarth EOWS", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3357%2Fraw%3Fdecode%3Ddatauri", "owner": "Gnafu" }] }, opts.params, searchText)
                ))
                .catch((e) => mapsLoaded({ "success": true, "totalCount": 18, "results": [{ "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-07-18 12:47:04.212", "lastUpdate": "2018-07-19 10:55:30.119", "description": "", "id": 6238, "name": "QA-12345621", "thumbnail": "NODATA", "details": "rest%2Fgeostore%2Fdata%2F6805%2Fraw%3Fdecode%3Ddatauri", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-06-13 10:44:27.393", "lastUpdate": "2018-06-13 15:15:05.486", "description": "Map Sample for the Training. Please do not delete. ", "id": 6200, "name": "Map Sample", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2013-05-16 23:14:04.051", "lastUpdate": "2018-02-22 15:48:02.171", "description": "", "id": 356, "name": "Unesco Italian Items", "thumbnail": "https://demo.geo-solutions.it/share/MapStore2-previews/unesco_thumb.png", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2014-03-08 13:09:44.239", "lastUpdate": "2017-05-03 14:32:24.842", "description": "Current Temperature Southern Europe from meteo stations.Credits to LaMMa.", "id": 451, "name": "LaMMa Current Temperature Southern Europe", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3201%2Fraw%3Fdecode%3Ddatauri", "featured": "false", "owner": "geosolutions" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-08-29 16:13:14.646", "description": "Map that contains data from Daraa for OWS14", "id": 7234, "name": "OWS14 Daraa Map", "thumbnail": "rest%2Fgeostore%2Fdata%2F7237%2Fraw%3Fdecode%3Ddatauri", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-08-29 16:31:20.169", "lastUpdate": "2018-08-30 12:17:58.779", "description": "OSM from Maps @ GeoSolutions", "id": 7242, "name": "OSM from Maps @ GeoSolutions", "thumbnail": "rest%2Fgeostore%2Fdata%2F7245%2Fraw%3Fdecode%3Ddatauri", "featured": "true", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2014-04-04 12:14:21.17", "lastUpdate": "2017-05-17 10:18:11.455", "description": "", "id": 464, "name": "Historical Maps of Florence", "thumbnail": "https://demo.geo-solutions.it/share/MapStore2-previews/histo-flowrence.png", "details": "NODATA", "featured": "true", "owner": "geosolutions" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2018-02-01 12:07:12.871", "lastUpdate": "2018-06-18 16:27:30.784", "description": "Map of US Population with statistics about inhabitants and workers percentage per region", "id": 4093, "name": "US Population Statistics", "thumbnail": "rest%2Fgeostore%2Fdata%2F4096%2Fraw%3Fdecode%3Ddatauri", "featured": "true", "owner": "admin" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2017-07-12 10:32:04.96", "lastUpdate": "2017-11-22 12:37:25.102", "description": "This data is derived from OSM, and used in OGC Testbed 13 for experimental purposes only", "id": 2698, "name": "OGC Testbed 13 - Daraa", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F2841%2Fraw%3Fdecode%3Ddatauri", "owner": "Gnafu" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2017-11-21 12:22:16.063", "lastUpdate": "2018-02-02 08:55:44.075", "description": "Institutii de invatamant din sectorul agroalimentar din R. Moldova", "id": 3267, "name": "Agricultura (invatamant)", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3321%2Fraw%3Fdecode%3Ddatauri", "owner": "evgenii" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2012-10-29 16:15:01.964", "lastUpdate": "2018-01-29 14:48:39.418", "description": "Tessuto Urbanizzato del comune di Bolzano ", "id": 191, "name": "Tessuto Urbanizzato Bolzano", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3194%2Fraw%3Fdecode%3Ddatauri", "details": "NODATA", "owner": "geosolutions" }, { "canDelete": false, "canEdit": false, "canCopy": true, "creation": "2017-11-27 10:18:58.122", "lastUpdate": "2017-11-29 11:34:36.721", "description": "Owner: Gnafu", "id": 3353, "name": "NaturalEarth EOWS", "thumbnail": "%2Fmapstore%2Frest%2Fgeostore%2Fdata%2F3357%2Fraw%3Fdecode%3Ddatauri", "owner": "Gnafu" }] }, opts.params, searchText)
            );
        });
const deleteMapAndAssociatedResourcesEpic = (action$, store) =>
    action$.ofType(DELETE_MAP)
        .switchMap((action) => {
            const state = store.getState();
            const mapId = action.resourceId;
            const options = action.options;
            const detailsUri = mapDetailsUriFromIdSelector(state, mapId);
            const thumbnailUri = mapThumbnailsUriFromIdSelector(state, mapId);
            const detailsId = getIdFromUri(detailsUri);
            const thumbnailsId = getIdFromUri(thumbnailUri);

            return Rx.Observable.forkJoin(
                // delete details
                deleteResourceById(thumbnailsId, options),
                // delete thumbnail
                deleteResourceById(detailsId, options),
                // delete map
                deleteResourceById(mapId, options)
            ).concatMap(([details, thumbnail, map]) => {
                let actions = [];
                if (details.resType === "error") {
                    actions.push(basicError({ message: "maps.feedback.errorDeletingDetailsOfMap" }));
                }
                if (thumbnail.resType === "error") {
                    actions.push(basicError({ message: "maps.feedback.errorDeletingThumbnailOfMap" }));
                }
                if (map.resType === "error") {
                    actions.push(basicError({ message: "maps.feedback.errorDeletingMap" }));
                    actions.push(mapDeleted(mapId, "failure", map.error));
                }
                if (map.resType === "success") {
                    actions.push(mapDeleted(mapId, "success"));
                    // TODO: if after delete the page is empty, you should re-do the query for the previous page (if it exists)
                    // something like :
                    // if ( condition ) {
                    //    actions.push(loadMaps(false, state.maps.searchText || ConfigUtils.getDefaults().initialMapFilter || "*")); // first page
                    // }
                }
                if (map.resType === "success" && details.resType === "success" && thumbnail.resType === "success") {
                    actions.push(basicSuccess({ message: "maps.feedback.allResDeleted" }));

                }
                return Rx.Observable.from(actions);
            }).startWith(mapDeleting(mapId));
        });

const fetchDataForDetailsPanel = (action$, store) =>
    action$.ofType(OPEN_DETAILS_PANEL)
        .switchMap(() => {
            const state = store.getState();
            const detailsUri = mapInfoDetailsUriFromIdSelector(state);
            const detailsId = getIdFromUri(detailsUri);
            return Rx.Observable.fromPromise(GeoStoreApi.getData(detailsId)
                .then(data => data))
                .switchMap((details) => {
                    return Rx.Observable.from([
                        closeFeatureGrid(),
                        updateDetails(details, true, details
                        )]
                    );
                }).startWith(toggleControl("details", "enabled"))
                .catch(() => {
                    return Rx.Observable.of(
                        basicError({ message: "maps.feedback.errorFetchingDetailsOfMap" }),
                        updateDetails(NO_DETAILS_AVAILABLE, true, NO_DETAILS_AVAILABLE)
                    );
                });
        });

const closeDetailsPanelEpic = (action$) =>
    action$.ofType(CLOSE_DETAILS_PANEL)
        .switchMap(() => Rx.Observable.from([
            toggleControl("details", "enabled"),
            resetCurrentMap()
        ])
        );
const resetCurrentMapEpic = (action$) =>
    action$.ofType(RESET_UPDATING)
        .switchMap(() => Rx.Observable.from([
            onDisplayMetadataEdit(false),
            resetCurrentMap()
        ])
        );
const storeDetailsInfoEpic = (action$, store) =>
    action$.ofType(MAP_INFO_LOADED)
        .switchMap(() => {
            const mapId = mapIdSelector(store.getState());
            return !mapId ?
                Rx.Observable.empty() :
                Rx.Observable.fromPromise(
                    GeoStoreApi.getResourceAttributes(mapId)
                )
                    .switchMap((attributes) => {
                        let details = find(attributes, { name: 'details' });
                        if (!details) {
                            return Rx.Observable.empty();
                        }
                        return Rx.Observable.of(
                            detailsLoaded(mapId, details.value)
                        );
                    });
        });
// UPDATE MAP_RESOURCE FLOW
const updateMapResource = (resource) => Persistence.updateResource(resource)
    .switchMap(() =>
        Rx.Observable.of(basicSuccess({
            title: 'map.savedMapTitle',
            message: 'map.savedMapMessage',
            autoDismiss: 6,
            position: 'tc'
        })
        )
    )
    .catch((e) => Rx.Observable.of(loadError(e), basicError({
        ...getErrorMessage(e, 'geostore', 'mapsError'),
        autoDismiss: 6,
        position: 'tc'
    })
    ))
    .startWith(mapUpdating(resource.metadata));
// CREATE MAP_RESOURCE FLOW
const createMapResource = (resource) => Persistence.createResource(resource)
    .switchMap((rid) =>
        Rx.Observable.of(
            mapCreated(rid, assign({ id: rid, canDelete: true, canEdit: true, canCopy: true }, resource.metadata), resource.data),
            onDisplayMetadataEdit(false),
            basicSuccess({
                title: 'map.savedMapTitle',
                message: 'map.savedMapMessage',
                autoDismiss: 6,
                position: 'tc'
            })
        )
    )
    .catch((e) => Rx.Observable.of(mapError(e), basicError({
        ...getErrorMessage(e, 'geostore', 'mapsError'),
        autoDismiss: 6,
        position: 'tc'
    })
    ))
    .startWith(savingMap(resource.metadata));
/**
 * Create or update map reosurce with persistence api
 */
const mapSaveMapResourceEpic = (action$) =>
    action$.ofType(SAVE_MAP_RESOURCE)
        .exhaustMap(({ resource }) => (!resource.id ? createMapResource(resource) : updateMapResource(resource))
        );
module.exports = {
    loadMapsEpic,
    resetCurrentMapEpic,
    storeDetailsInfoEpic,
    closeDetailsPanelEpic,
    fetchDataForDetailsPanel,
    deleteMapAndAssociatedResourcesEpic,
    getMapsResourcesByCategoryEpic,
    setDetailsChangedEpic,
    fetchDetailsFromResourceEpic,
    saveResourceDetailsEpic,
    mapSaveMapResourceEpic
};
