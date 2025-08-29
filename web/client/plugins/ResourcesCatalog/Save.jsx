/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import uuid from 'uuid/v1';
import { createPlugin } from "../../utils/PluginsUtils";
import PendingStatePrompt from './containers/PendingStatePrompt';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { isEmpty } from 'lodash';
import { getPendingChanges, getResourceWithDataInfoByType } from './selectors/save';
import Persistence from '../../api/persistence';
import { setSelectedResource } from './actions/resources';
import { mapSaveError, mapSaved, mapInfoLoaded, configureMap, MAP_CONFIG_LOADED } from '../../actions/config';
import { userSelector } from '../../selectors/security';
import { storySaved, geostoryLoaded, setResource as setGeoStoryResource, setCurrentStory, saveGeoStoryError } from '../../actions/geostory';
import { dashboardSaveError, dashboardSaved, dashboardLoaded } from '../../actions/dashboard';
import { convertDependenciesMappingForCompatibility } from '../../utils/WidgetsUtils';
import { show } from '../../actions/notifications';
import { computePendingChanges, computeSaveResource } from '../../utils/GeostoreUtils';
import save from './reducers/save';
import { setPendingChanges as setPendingChangesAction } from './actions/save';
import { layersSelector } from '../../selectors/layers';
import { Observable } from 'rxjs';
import { updateNode } from '../../actions/layers';

function addNameToResource(resource) {
    return {
        ...resource,
        metadata: {
            ...resource?.metadata,
            name: resource?.metadata?.name || `${resource?.category || 'Resource'}-${uuid()}`
        }
    };
}

/**
 * Plugin to save resource. Allows to re-save an existing resource using the persistence API. Note: creation of new resource is implemented by {@link #plugins.SaveAs|SaveAs} plugin.
 * @memberof plugins
 * @class
 * @name Save
 * @prop {string} cfg.resourceType one of `MAP`, `DASHBOARD` or `GEOSTORY` based on the viewer in use
 */
function Save({
    pendingChanges,
    resourceType,
    resourceInfo,
    onSelect,
    onSuccess,
    onError,
    user,
    onNotification,
    component,
    menuItem
}) {
    const [loading, setLoading] = useState(false);

    const changes = !isEmpty(pendingChanges);

    function handleSave() {
        const saveResource = computeSaveResource(resourceInfo.initialResource, resourceInfo.resource, resourceInfo.data);
        if (saveResource && !loading) {
            setLoading(true);
            const api = Persistence.getApi();
            api.updateResource(addNameToResource(saveResource))
                .toPromise()
                .then((resourceId) => api.getResource(resourceId, { includeAttributes: true, withData: false }).toPromise())
                .then(resource => ({ ...resource, category: { name: resourceType } }))
                .then((resource) => {
                    onSelect(resource);
                    onSuccess(resourceType, resource, saveResource?.data);
                    onNotification({
                        id: 'RESOURCE_SAVE_SUCCESS',
                        title: 'saveDialog.saveSuccessTitle',
                        message: 'saveDialog.saveSuccessMessage'
                    }, 'success');
                })
                .catch((error) => {
                    onError(resourceType, error);
                    onNotification({
                        id: 'RESOURCE_SAVE_ERROR',
                        title: `resourcesCatalog.resourceError.errorTitle`,
                        message: `resourcesCatalog.resourceError.error${error.status || 'Default'}`
                    }, 'error');
                })
                .finally(() => setLoading(false));
        }
    }

    if (!(user && resourceInfo?.resource?.canEdit)) {
        return null;
    }
    const Component = component;
    return (
        <>
            <Component
                className={changes && !loading ? 'ms-notification-circle warning' : ''}
                onClick={handleSave}
                labelId="saveDialog.saveTooltip"
                glyph="floppy-disk"
                menuItem={menuItem}
                loading={loading}
            />
        </>
    );
}

const saveConnect = connect(
    createStructuredSelector({
        user: userSelector,
        resourceInfo: getResourceWithDataInfoByType,
        pendingChanges: getPendingChanges
    }),
    {
        onSelect: setSelectedResource,
        onNotification: show,
        onSuccess: (resourceType, resource, data) => {
            return (dispatch) => {
                if (resourceType === 'MAP') {
                    dispatch(configureMap(data, resource.id));
                    dispatch(mapInfoLoaded(resource, resource.id));
                    dispatch(mapSaved(resource.id));
                    return;
                }
                if (resourceType === 'DASHBOARD') {
                    dispatch(dashboardSaved(resource.id));
                    dispatch(dashboardLoaded(resource, convertDependenciesMappingForCompatibility(data)));
                    return;
                }
                if (resourceType === 'GEOSTORY') {
                    dispatch(storySaved(resource.id));
                    dispatch(geostoryLoaded(resource.id));
                    dispatch(setCurrentStory(data));
                    dispatch(setGeoStoryResource(resource));
                    return;
                }
            };
        },
        onError: (resourceType, error) => {
            return (dispatch) => {
                const { status, statusText, data, message, ...other} = error;
                if (resourceType === 'MAP') {
                    dispatch(mapSaveError(status ? { status, statusText, data } : message || other));
                    return;
                }
                if (resourceType === 'DASHBOARD') {
                    dispatch(dashboardSaveError(status ? { status, statusText, data } : message || other));
                }
                if (resourceType === 'GEOSTORY') {
                    dispatch(saveGeoStoryError(status ? { status, statusText, data } : message || other));
                    return;
                }
            };
        }
    }
);

const SavePlugin = saveConnect(Save);

SavePlugin.defaultProps = {
    resourceType: 'MAP'
};

const useComputedPendingChanges = ({
    setPendingChanges,
    initialResource,
    resource,
    data
}) => {
    const timeout = useRef();
    useEffect(() => {
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = undefined;
        }
        timeout.current = setTimeout(() => {
            const pendingChanges = computePendingChanges(initialResource, resource, data);
            console.log('pendingChanges', pendingChanges);
            setPendingChanges(pendingChanges);
        }, 500);
    }, [initialResource, resource, data]);
    useEffect(() => {
        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = undefined;
            }
            setPendingChanges(null);
        };
    }, []);
    return null;
};

const ConnectedPendingStatePrompt = connect(
    createStructuredSelector({
        user: userSelector,
        resourceInfo: getResourceWithDataInfoByType
    }),
    {
        // onSetPendingChanges: setPendingChangesAction
    }
)(({
    user,
    resourceInfo,
    // onSetPendingChanges
}) => {

    const [pendingChanges, setPendingChanges] = useState(false);
    useComputedPendingChanges({
        ...resourceInfo,
        setPendingChanges: (newPendingChanges) => {
            setPendingChanges(newPendingChanges);
            // onSetPendingChanges(newPendingChanges);
        }
    });

    if (!(user && (resourceInfo?.resource?.canCopy || resourceInfo?.resource?.canEdit))) {
        return null;
    }
    const changes = !isEmpty(pendingChanges);
    return (
        <PendingStatePrompt
            pendingState={changes}
            titleId="resourcesCatalog.detailsPendingChangesTitle"
            descriptionId="resourcesCatalog.detailsPendingChangesDescription"
            cancelId="resourcesCatalog.detailsPendingChangesCancel"
            confirmId="resourcesCatalog.detailsPendingChangesConfirm"
            variant="danger"
        />
    );
});

ConnectedPendingStatePrompt.defaultProps = {
    resourceType: 'MAP'
};

export default createPlugin('Save', {
    component: ConnectedPendingStatePrompt,
    containers: {
        BrandNavbar: {
            target: 'left-menu',
            position: 2,
            priority: 3,
            Component: SavePlugin,
            doNotHide: true
        },
        BurgerMenu: {
            position: 30,
            tool: SavePlugin,
            priority: 2,
            doNotHide: true
        },
        SidebarMenu: {
            position: 30,
            tool: SavePlugin,
            priority: 1,
            doNotHide: true
        }
    },
    reducers: {
        save
    },
    epics: {
        // testUpdateNodeEpic: (action$, { getState }) => {
        //     return action$.ofType(MAP_CONFIG_LOADED)
        //         .switchMap(() => {
        //             const layers = layersSelector(getState());
        //             return Observable.of(
        //                 ...layers.map((layer) => updateNode(layer.id, 'layers', { visibility: false }))
        //             );
        //         });
        // }
    }
});
