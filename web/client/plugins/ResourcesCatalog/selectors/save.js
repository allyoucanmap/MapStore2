
import { computePendingChanges } from '../utils/ResourcesUtils';
import { mapSelector } from '../../../selectors/map';
import { mapHasPendingChangesSelector, mapSaveSelector } from '../../../selectors/mapsave';
import { getInitialSelectedResource, getSelectedResource } from './resources';

const getResourceByType = (state, props) => {
    const resourceType = props?.resourceType;
    const initialResource = getInitialSelectedResource(state, props);
    const resource = getSelectedResource(state, props);
    if (resourceType === 'map') {
        const mapInitialResource = (mapSelector(state) || {})?.info || {};
        return {
            initialResource: resource ? initialResource : mapInitialResource,
            resource: resource ? resource : mapInitialResource,
            data: {
                payload: mapSaveSelector(state),
                pending: mapHasPendingChangesSelector(state)
            }
        };
    }
    return {
        initialResource,
        resource
    };
};

export const getPendingChanges = (state, props) => {
    const { initialResource, resource, data } = getResourceByType(state, props);
    if (!(resource && initialResource)) {
        return null;
    }
    return computePendingChanges(initialResource, resource, data);
};
