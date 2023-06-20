/**
  * Copyright 2017, GeoSolutions Sas.
  * All rights reserved.
  *
  * This source code is licensed under the BSD-style license found in the
  * LICENSE file in the root directory of this source tree.
  */
import {compose, withProps} from 'recompose';
import { castArray, sortBy } from 'lodash';

import { getLayerJSONFeature } from '../../../observables/wfs';
import propsStreamFactory from '../../misc/enhancers/propsStreamFactory';
import Rx from 'rxjs';
import {getSearchUrl} from '../../../utils/LayersUtils';
import axios from '../../../libs/ajax';

export const wfsToChartData = ({ features } = {}, { groupByAttributes }) => {

    return sortBy(features.map(({properties}) => properties), groupByAttributes); // TODO: sort
};
const sameFilter = (f1, f2) => f1 === f2;
const sameOptions = (o1 = {}, o2 = {}) =>
    o1.aggregateFunction === o2.aggregateFunction
    && o1.aggregationAttribute === o2.aggregationAttribute
    && o1.groupByAttributes === o2.groupByAttributes
    && o1.classificationAttribute === o2.classificationAttribute
    && o1.viewParams === o2.viewParams;

const getFeatures = {
    wfs: ({layer = {}, options}) => {
        if (layer.name && getSearchUrl(layer)
            && options
            && options.aggregationAttribute // maybe another attribute
            && options.groupByAttributes // TODO: not needed
        ) {
            return ({ filter }) => getLayerJSONFeature(
                layer,
                filter,
                { propertyName: options.classificationAttribute ? [
                    ...castArray(options.aggregationAttribute),
                    ...castArray(options.groupByAttributes),
                    ...castArray(options.classificationAttribute)
                ] :
                    [
                        ...castArray(options.aggregationAttribute),
                        ...castArray(options.groupByAttributes)
                    ]
                }
            ).map((response) => {
                console.log({
                    loading: false,
                    isAnimationActive: false,
                    error: undefined,
                    data: wfsToChartData(response, options),
                    series: [{ dataKey: options.aggregationAttribute }],
                    classifications: {dataKey: options.classificationAttribute},
                    xAxis: { dataKey: options.groupByAttributes}
                });
                return {
                    loading: false,
                    isAnimationActive: false,
                    error: undefined,
                    data: wfsToChartData(response, options),
                    series: [{ dataKey: options.aggregationAttribute }],
                    classifications: {dataKey: options.classificationAttribute},
                    xAxis: { dataKey: options.groupByAttributes}
                };
            });
        }
        return null;
    },
    arcgis: ({ layer = {}, options }) => {
        console.log(layer, options);
        if (layer.name !== undefined && getSearchUrl(layer)
            && options
            && options.aggregationAttribute // maybe another attribute
            && options.groupByAttributes // TODO: not needed
        ) {
            return () => {
                return Rx.Observable.defer(() => axios.post(`${getSearchUrl(layer)}/${layer.name}/query`, null, {
                    params: {
                        f: 'geojson',
                        outFields: '*',
                        returnGeometry: false,
                        geometry: `-180,-90,180,90`,
                        inSR: 'EPSG:4326'
                    } }))
                    .map(({ data }) => {
                        console.log(data);
                        return {
                            loading: false,
                            isAnimationActive: false,
                            error: undefined,
                            data: wfsToChartData(data, options),
                            series: [{ dataKey: options.aggregationAttribute }],
                            classifications: {dataKey: options.classificationAttribute},
                            xAxis: { dataKey: options.groupByAttributes}
                        };
                    });
            };
        }
        return null;
    }

};

const dataStreamFactory = ($props) =>
    $props
        .filter(({layer = {}, options}) => !!getFeatures[layer?.search?.type]({ layer, options }))
        .distinctUntilChanged(
            ({layer = {}, options = {}, filter}, newProps) =>
                (newProps.layer && layer.name === newProps.layer.name && layer.loadingError === newProps.layer.loadingError)
                && sameOptions(options, newProps.options)
                && sameFilter(filter, newProps.filter))
        .switchMap(
            ({layer = {}, options, filter, onLoad = () => {}, onLoadError = () => {}}) =>
                getFeatures[layer?.search?.type]({ layer, options })({ filter })
                    .do(onLoad)
                    .catch((e) => Rx.Observable.of({
                        loading: false,
                        error: e,
                        data: []
                    }).do(onLoadError)
                    ).startWith({loading: true})
        );
export default compose(
    withProps( () => ({
        dataStreamFactory
    })),
    propsStreamFactory
);
