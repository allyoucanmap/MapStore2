/**
  * Copyright 2018, GeoSolutions Sas.
  * All rights reserved.
  *
  * This source code is licensed under the BSD-style license found in the
  * LICENSE file in the root directory of this source tree.
  */
import { compose, withProps } from 'recompose';

import wpsAggregate from '../../../observables/wps/aggregate';
import propsStreamFactory from '../../misc/enhancers/propsStreamFactory';
import Rx from 'rxjs';
import axios from '../../../libs/ajax';

const wpsAggregateToCounterData = ({AggregationResults = [], GroupByAttributes = [], AggregationAttribute, AggregationFunctions} = {}) =>
    AggregationResults.map( (res) => ({
        ...GroupByAttributes.reduce( (a, p, i) => ({...a, [p]: res[i]}), {}),
        [`${AggregationFunctions[0]}(${AggregationAttribute})`]: res[res.length - 1]
    }));
const sameFilter = (f1, f2) => f1 === f2;
const sameOptions = (o1 = {}, o2 = {}) =>
    o1.aggregateFunction === o2.aggregateFunction
    && o1.aggregationAttribute === o2.aggregationAttribute
    && o1.viewParams === o2.viewParams;
import { getWpsUrl } from '../../../utils/LayersUtils';


const aggregateFunctionToStatisticType = (aggregateFunction = '') => {
    switch (aggregateFunction) {
    case 'Average':
        return 'avg';
    default:
        return aggregateFunction.toLowerCase();
    }
};

const getProcessWorkflow = ({ layer = {}, options }) => {

    if (layer.name && getWpsUrl(layer) && options && options.aggregateFunction && options.aggregationAttribute) {
        return ({ filter }) => wpsAggregate(getWpsUrl(layer), {featureType: layer.name, ...options, filter }, {
            timeout: 15000
        }).map((data) => {
            console.log({
                loading: false,
                isAnimationActive: false,
                error: undefined,
                data: wpsAggregateToCounterData(data),
                series: [{dataKey: `${data.AggregationFunctions[0]}(${data.AggregationAttribute})`}]
            });
            return {
                loading: false,
                isAnimationActive: false,
                error: undefined,
                data: wpsAggregateToCounterData(data),
                series: [{dataKey: `${data.AggregationFunctions[0]}(${data.AggregationAttribute})`}]
            };
        });
    }

    if (layer.name !== undefined && layer.search?.type === 'arcgis' && options.aggregateFunction && options.aggregationAttribute) {
        const outStatistics =  encodeURIComponent(JSON.stringify([
            {
                statisticType: aggregateFunctionToStatisticType(options.aggregateFunction),
                onStatisticField: options.aggregationAttribute
            }
        ]));
        return ({ filter }) => {
            console.log(filter);
            return Rx.Observable.defer(() => axios.get(`${layer.search.url}/${layer.name}/query?outStatistics=${outStatistics}`, {
                params: {
                    f: 'json'
                }
            }))
                .map(({ data }) => {
                    console.log(data);
                    const dataKey = `${options.aggregateFunction}(${options.aggregationAttribute})`;
                    const attributes = data?.features?.[0].attributes;
                    const dataValue = attributes[Object.keys(attributes)[0]];
                    return {
                        loading: false,
                        isAnimationActive: false,
                        error: undefined,
                        data: [{ [dataKey]: dataValue }],
                        series: [{ dataKey }]
                    };
                });
        };
    }
    return null;
};
/**
 * Stream of props -> props to retrieve data from WPS aggregate process on params changes.
 * Can be used with widgets and charts to auto-update data on property changes.
 * When new data is retrieved, calls also onLoad handler, or onLoadError if something went wrong.
 *
 */
const dataStreamFactory = ($props) =>
    $props
        .filter(({layer = {}, options}) => !!getProcessWorkflow({ layer, options }))
        .distinctUntilChanged(
            ({layer = {}, options = {}, filter}, newProps) =>
                (newProps.layer && layer.name === newProps.layer.name && layer.loadingError === newProps.layer.loadingError)
                && sameOptions(options, newProps.options)
                && sameFilter(filter, newProps.filter))
        .switchMap(
            ({layer = {}, options, filter, onLoad = () => {}, onLoadError = () => {}}) =>
                getProcessWorkflow({ layer, options })({ filter }).do(onLoad)
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
