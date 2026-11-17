/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { toOGCFilterParts, convertFiltersToOGC } from '../../../utils/FilterUtils';
import filterBuilder from '../../../utils/ogc/Filter/FilterBuilder';
import { composeFilterObject } from './utils';

/**
 * Returns the OGC filter of a dataset: layer filter, own filter and column filters, filters applied by the interactions
 * @param {object} props `{ layer, filter, quickFilters, options, interactionFilters }` of the widget or chart trace
 * @returns {string|undefined} the OGC filter, undefined without filters
 */
export const getDatasetFilter = ({ layer, filter: filterObj, quickFilters, options, interactionFilters } = {}) => {
    const { filter, and } = filterBuilder({ gmlVersion: "3.1.1" });
    const layerFilter = layer?.layerFilter;
    const ownFilter = composeFilterObject(filterObj, quickFilters, options);
    const parts = [
        ...(layerFilter && !layerFilter.disabled ? toOGCFilterParts(layerFilter, "1.1.0", "ogc") : []),
        ...(!isEmpty(ownFilter) ? toOGCFilterParts(ownFilter, "1.1.0", "ogc") : []),
        ...(Array.isArray(interactionFilters) && interactionFilters.length > 0
            ? convertFiltersToOGC(interactionFilters, { nsplaceholder: "ogc", versionOGC: "1.1.0" }) || []
            : [])
    ];
    return parts.length > 0 ? filter(and(...parts)) : undefined;
};

/**
 * Sets the `filter` prop of a dataset widget, or of each chart trace, from its layer, own and interaction filters
 */
const interactionFiltersToFilter = (Component) => ({ traces, ...props }) => traces
    ? <Component {...props} traces={traces.map(trace => ({ ...trace, filter: getDatasetFilter({ interactionFilters: props.interactionFilters, ...trace }) }))} />
    : <Component {...props} filter={getDatasetFilter(props)} />;

export default interactionFiltersToFilter;
