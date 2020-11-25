/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { find } from 'lodash';
import { compose, mapPropsStream, withProps, withPropsOnChange } from 'recompose';

import { getFilterRenderer } from '../../components/data/featuregrid/filterRenderers';
import { getAttributeFields } from '../../utils/FeatureGridUtils';

/**
 * Uses the quickFilterStream$ to generate the value prop.
 * Each time the quickFilterStream emits a value
 */
const mergeQuickFiltersStream = compose(
    mapPropsStream(props$ =>
        props$.combineLatest(
            // extract the quickFilterStream$ from props
            props$.pluck('quickFilterStream$').distinctUntilChanged().switchMap(quickFilterStream$ => quickFilterStream$).startWith(undefined),
            (props, quickFilters) => {
                const attributeQuickFilter = quickFilters && props.options && find(props.options.propertyName, f => f === props.attributeName) && quickFilters[props.attributeName] || {};
                const value = attributeQuickFilter && (attributeQuickFilter.rawValue || attributeQuickFilter.value);
                return {
                    ...props,
                    value
                };
            })
    ) // emit first to trigger first combine latest

);

const getFilterComponent = ({options, localType, attributeName, quickFilterStream$}) => compose(
    withProps({quickFilterStream$, attributeName, options}),
    mergeQuickFiltersStream
)(getFilterRenderer(localType, {name: attributeName }));

// add to the container a stream as a prop that emits a value each time quick filter stream changes
const withQuickFiltersStream = compose(
    mapPropsStream(props$ => {
        return props$.map((p) => ({...p, quickFilterStream$: props$.pluck('quickFilters').distinctUntilChanged()}));
    })
);

/**
 * Create the quick filter renderers for table widget. Adds the prop "filterRenderers" to the nested component
 * as a map of `attribute (column) name` - component of the filter.
 * NOTE: In order to connect the value of the current filter with the component generated by this enhancer,
 * it creates internally a stream shared as prop between the main widget and the various filter component.
 * As well as properties change, a new event is emitted on this stream and so captured by the filter component
 * as a property change.
 *
 */
export const getWidgetFilterRenderers = compose(
    withQuickFiltersStream,
    withPropsOnChange(
        ["describeFeatureType", "options"],
        ({ describeFeatureType, options, quickFilterStream$} = {}) => {
            return describeFeatureType ?
                {filterRenderers: getAttributeFields(describeFeatureType).reduce( (prev, {localType, name: attributeName}) => {
                    const filterComp = getFilterComponent({options, localType, attributeName, quickFilterStream$});
                    return {...prev, [attributeName]: filterComp};
                }, {})}
                : {};
        }
    )
);

export default {getWidgetFilterRenderers};
