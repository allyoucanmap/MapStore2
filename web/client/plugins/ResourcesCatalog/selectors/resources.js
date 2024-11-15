import { getMonitoredState } from '../../../utils/PluginsUtils';
import { getConfigProp } from '../../../utils/ConfigUtils';

const getStatePart = (state, props) => {
    const id = props?.id || props?.resourcesGridId;
    if (id === undefined) {
        return state?.resources;
    }
    return state?.resources?.sections?.[id] || {};
};

const RESOURCES = [];
export const getResources = (state, props) => {
    const resources = getStatePart(state, props)?.resources || RESOURCES;
    return resources;
};

export const getResourcesLoading = (state, props) => getStatePart(state, props)?.loading;
export const getResourcesError = (state, props) => getStatePart(state, props)?.error;
export const getIsFirstRequest = (state, props) => getStatePart(state, props)?.isFirstRequest !== false;
export const getTotalResources = (state, props) => getStatePart(state, props)?.total || 0;
export const getShowFiltersForm = (state, props) => getStatePart(state, props)?.showFiltersForm;
export const getInitialSelectedResource = (state, props) => getStatePart(state, props)?.initialSelectedResource;
export const getSelectedResource = (state, props) => getStatePart(state, props)?.selectedResource;
export const getShowDetails = (state, props) => !!getSelectedResource(state, props);
export const getCurrentPage = (state, props) => getStatePart(state, props)?.params?.page ?? 1;
export const getSearch = (state, props) => getStatePart(state, props)?.search || null;

export const getMonitoredStateSelector =  state => getMonitoredState(state, getConfigProp('monitorState'));
export const getRouterLocation = state => state?.router?.location;
