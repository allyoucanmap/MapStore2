/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { computePendingChanges } from '../../../utils/GeostoreUtils';
import { mapSelector } from '../../../selectors/map';
import { mapHasPendingChangesSelector, mapSaveSelector } from '../../../selectors/mapsave';
import { dashboardHasPendingChangesSelector } from '../../../selectors/dashboardsave';
import { dashboardResource as getDashboardResource } from '../../../selectors/dashboard';
import { widgetsConfig } from '../../../selectors/widgets';
import { getInitialSelectedResource, getSelectedResource } from './resources';
import { currentStorySelector, resourceSelector, hasPendingChanges } from '../../../selectors/geostory';
import { contextResourceSelector } from '../../../selectors/context';
import { isEmpty, omit } from 'lodash';

const defaultNewResource = (resourceType) => {
    return { canCopy: true, category: { name: resourceType } };
};

const applyContextAttribute = (resource, contextId) => {
    const context = contextId !== undefined
        ? contextId
        : resource?.attributes?.context;
    return {
        ...resource,
        ...(context !== undefined && {
            attributes: {
                ...resource?.attributes,
                ...(context !== undefined && { context })
            }
        })
    };
};

// export const getResourceInfoByType = (state, props) => {
//     const resourceType = props?.resourceType;
//     const initialResource = getInitialSelectedResource(state, props);
//     const resource = getSelectedResource(state, props);
//     const newResource = defaultNewResource(resourceType);
//     if (resourceType === 'MAP') {
//         const contextResource = contextResourceSelector(state);
//         const mapInfo = (mapSelector(state) || {})?.info;
//         const contextId = contextResource?.id !== undefined
//             ? contextResource.id
//             : mapInfo?.context; // new map has context in info property
//         const mapResource = omit(mapInfo, ['context']);
//         const mapInitialResource = applyContextAttribute(isEmpty(mapResource) ? newResource : mapResource, contextId);
//         return {
//             initialResource: resource ? initialResource : mapInitialResource,
//             resource: resource ? resource : mapInitialResource
//         };
//     }
//     if (resourceType === 'DASHBOARD') {
//         const dashboardResource = getDashboardResource(state);
//         const dashboardInitialResource = isEmpty(dashboardResource) ? newResource : dashboardResource;
//         return {
//             initialResource: resource ? initialResource : dashboardInitialResource,
//             resource: resource ? resource : dashboardInitialResource
//         };
//     }
//     if (resourceType === 'GEOSTORY') {
//         const geoStoryResource = resourceSelector(state);
//         const geoStoryInitialResource = isEmpty(geoStoryResource) ? newResource : geoStoryResource;
//         return {
//             initialResource: resource ? initialResource : geoStoryInitialResource,
//             resource: resource ? resource : geoStoryInitialResource
//         };
//     }
//     return {
//         resource,
//         initialResource
//     };
// };

// TODO: try to use createSelector instead to use inline selectors
const getResourceInfoByTypeSelectorCreator = (excludeData) => (state, props) => {
    const resourceType = props?.resourceType;
    const initialResource = getInitialSelectedResource(state, props);
    const resource = getSelectedResource(state, props);
    const newResource = defaultNewResource(resourceType);
    if (resourceType === 'MAP') {
        const contextResource = contextResourceSelector(state);
        const mapInfo = (mapSelector(state) || {})?.info;
        const contextId = contextResource?.id !== undefined
            ? contextResource.id
            : mapInfo?.context; // new map has context in info property
        const mapResource = omit(mapInfo, ['context']);
        const mapInitialResource = applyContextAttribute(isEmpty(mapResource) ? newResource : mapResource, contextId);
        return {
            initialResource: resource ? initialResource : mapInitialResource,
            resource: resource ? resource : mapInitialResource,
            ...(!excludeData && {
                data: {
                    // TODO: we should pass also initial payload to compare after inside the comparePendingChanges func
                    payload: mapSaveSelector(state) // TODO: mapSaveSelector uses saveMapConfiguration that too slow. We should compose the map only on save and on compare and not in the selector
                }
            })
        };
    }
    if (resourceType === 'DASHBOARD') {
        const dashboardResource = getDashboardResource(state);
        const dashboardInitialResource = isEmpty(dashboardResource) ? newResource : dashboardResource;
        return {
            initialResource: resource ? initialResource : dashboardInitialResource,
            resource: resource ? resource : dashboardInitialResource,
            ...(!excludeData && {
                data: {
                    // TODO: we should pass also initial payload to compare after inside the comparePendingChanges func
                    payload: widgetsConfig(state)
                }
            })
        };
    }
    if (resourceType === 'GEOSTORY') {
        const geoStoryResource = resourceSelector(state);
        const geoStoryInitialResource = isEmpty(geoStoryResource) ? newResource : geoStoryResource;
        return {
            initialResource: resource ? initialResource : geoStoryInitialResource,
            resource: resource ? resource : geoStoryInitialResource,
            ...(!excludeData && {
                data: {
                    // TODO: in this case we can pass the pending selector because geostories store a boolean and not compare initial and current data payload
                    payload: currentStorySelector(state)
                }
            })
        };
    }
    return {
        initialResource,
        resource
    };
};

export const getResourceInfoByType = getResourceInfoByTypeSelectorCreator(true);
export const getResourceWithDataInfoByType = getResourceInfoByTypeSelectorCreator(false);

export const getComputedPendingChanges = (state, props) => {
    const { initialResource, resource, data } = getResourceInfoByType(state, props);
    if (!(resource && initialResource)) {
        return null;
    }
    return computePendingChanges(initialResource, resource, data);
};

export const getPendingChanges = (state) => {
    return state?.save?.pendingChanges;
};
