/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Rx = require('rxjs');
const axios = require('../libs/ajax');
const {changeSpatialAttribute} = require('../actions/queryform');
const {FEATURE_TYPE_SELECTED, QUERY, featureTypeLoaded, featureTypeError, createQuery, querySearchResponse, queryError, featureClose} = require('../actions/wfsquery');
const FilterUtils = require('../utils/FilterUtils');
const assign = require('object-assign');
const {isString} = require('lodash');
const {TOGGLE_CONTROL, setControlProperty} = require('../actions/controls');

const types = {
    'xsd:string': 'string',
    'xsd:dateTime': 'date',
    'xsd:number': 'number',
    'xsd:int': 'number'
};

const fieldConfig = {};

const extractInfo = (data) => {
    return {
        geometry: data.featureTypes[0].properties
            .filter((attribute) => attribute.type.indexOf('gml:') === 0)
            .map((attribute) => {
                let conf = {
                    label: attribute.name,
                    attribute: attribute.name,
                    type: 'geometry',
                    valueId: "id",
                    valueLabel: "name",
                    values: []
                };
                conf = fieldConfig[attribute.name] ? {...conf, ...fieldConfig[attribute.name]} : conf;
                return conf;
            }),
        attributes: data.featureTypes[0].properties
            .filter((attribute) => attribute.type.indexOf('gml:') !== 0)
            .map((attribute) => {
                let conf = {
                    label: attribute.name,
                    attribute: attribute.name,
                    type: types[attribute.type],
                    valueId: "id",
                    valueLabel: "name",
                    values: []
                };
                conf = fieldConfig[attribute.name] ? {...conf, ...fieldConfig[attribute.name]} : conf;
                return conf;
            })
    };
};

const getWFSFilterData = (filterObj) => {
    let data;
    if (typeof filterObj === 'string') {
        data = filterObj;
    } else {
        data = filterObj.filterType === "OGC" ?
            FilterUtils.toOGCFilter(filterObj.featureTypeName, filterObj, filterObj.ogcVersion, filterObj.sortOptions, filterObj.hits) :
            FilterUtils.toCQLFilter(filterObj);
    }
    return data;
};

const getWFSFeature = (searchUrl, filterObj) => {
    const data = getWFSFilterData(filterObj);
    return Rx.Observable.defer( () =>
        axios.post(searchUrl + '?service=WFS&outputFormat=json', data, {
          timeout: 60000,
          headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}
     }));
};

const getWFSResponseException = (response, code) => {
    const {unmarshaller} = require('../utils/ogc/WFS');
    const json = isString(response.data) ? unmarshaller.unmarshalString(response.data) : null;
    return json && json.value && json.value.exception && json.value.exception[0] && json.value.exception[0].TYPE_NAME === 'OWS_1_0_0.ExceptionType' && json.value.exception[0].exceptionCode === code;
};

const getFirstAttribute = (state)=> {
    return state.query && state.query.featureTypes && state.query.featureTypes[state.query.typeName] && state.query.featureTypes[state.query.typeName].attributes && state.query.featureTypes[state.query.typeName].attributes[0] && state.query.featureTypes[state.query.typeName].attributes[0].attribute || null;
};

const getDefaultSortOptions = (attribute) => {
    return attribute ? { sortBy: attribute, sortOrder: 'A'} : {};
};

const retryWithForcedSortOptions = (action, store) => {
    const sortOptions = getDefaultSortOptions(getFirstAttribute(store.getState()));
    return getWFSFeature(action.searchUrl, assign(action.filterObj, {
            sortOptions
        }))
        .map((newResponse) => {
            const newError = getWFSResponseException(newResponse, 'NoApplicableCode');
            return !newError ? querySearchResponse(newResponse.data, action.searchUrl, action.filterObj) : queryError('No sortable request');
        })
        .catch((e) => {
            return Rx.Observable.of(queryError(e));
        });
};

const featureTypeSelectedEpic = action$ =>
    action$.ofType(FEATURE_TYPE_SELECTED).switchMap(action => {
        return Rx.Observable.defer( () =>
            axios.get(action.url + '?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=' + action.typeName + '&outputFormat=application/json'))
        .map((response) => {
            if (typeof response.data === 'object' && response.data.featureTypes && response.data.featureTypes[0]) {
                const info = extractInfo(response.data);
                const geometry = info.geometry[0] && info.geometry[0].attribute ? info.geometry[0].attribute : 'the_geom';
                return Rx.Observable.from([featureTypeLoaded(action.typeName, info), changeSpatialAttribute(geometry)]);
            }
            try {
                JSON.parse(response.data);
            } catch(e) {
                return Rx.Observable.from([featureTypeError(action.typeName, 'Error from WFS: ' + e.message)]);
            }
            return Rx.Observable.from([featureTypeError(action.typeName, 'Error: feature types are empty')]);
        })
        .mergeAll()
        .catch(e => Rx.Observable.of(featureTypeError(action.typeName, e.message)));
    });

/**
 * Gets every `QUERY` event.
 * @param {external:Observable} action$ manages `QUERY`.
 * @memberof epics.wfsquery
 * @return {external:Observable} emitting {@link #actions.wfsquery.querySearchResponse} events
 */

const wfsQueryEpic = (action$, store) =>
    action$.ofType(QUERY).switchMap(action => {

        return Rx.Observable.merge(
            Rx.Observable.of(createQuery(action.searchUrl, action.filterObj)),
            Rx.Observable.of(setControlProperty('drawer', 'enabled', false)),
            getWFSFeature(action.searchUrl, action.filterObj)
            .switchMap((response) => {
                // try to guess if it was a missing id error and try to search again with forced sortOptions
                const error = getWFSResponseException(response, 'NoApplicableCode');
                if (error) {
                    return retryWithForcedSortOptions(action, store);
                }
                return Rx.Observable.of(querySearchResponse(response.data, action.searchUrl, action.filterObj));
            })
            .catch((e) => {
                return Rx.Observable.of(queryError(e));
            })
        );
    });

const closeFeatureEpic = action$ =>
    action$.ofType(TOGGLE_CONTROL).switchMap(action => {
        return action.control && action.control === 'drawer' ? Rx.Observable.of(featureClose()) : Rx.Observable.empty();
    });

/**
 * Epics for wfs query functionality
 * @name epics.wfsquery
 * @type {Object}
 */

module.exports = {
    featureTypeSelectedEpic,
    wfsQueryEpic,
    closeFeatureEpic
};
