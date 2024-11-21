/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useRef } from 'react';
import { createPlugin } from '../../utils/PluginsUtils';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import resourcesReducer from './reducers/resources';
import { Alert } from 'react-bootstrap';
import {
    resetSelectedResource,
    searchResources,
    setSelectedResource,
    updateSelectedResource
} from './actions/resources';
import {
    getInitialSelectedResource,
    getSelectedResource,
    getMonitoredStateSelector,
    getRouterLocation
} from './selectors/resources';
import useRequestResource from './hooks/useRequestResource';
import DetailsInfo from './components/DetailsInfo';
import ResourcePermissions from './containers/ResourcePermissions';
import ResourceAbout from './containers/ResourceAbout';
import ButtonMS from './components/Button';
import Icon from './components/Icon';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import get from 'lodash/get';
import { updateResource } from '../../observables/geostore';
import merge from 'lodash/fp/merge';
import { getResourceTypesInfo } from './utils/ResourcesUtils';
import { userSelector } from '../../selectors/security';
import DetailsHeader from './components/DetailsHeader';
import ResourcesPanelWrapper from './components/ResourcesPanelWrapper';
import TargetSelectorPortal from './components/TargetSelectorPortal';
import useResourcePanelWrapper from './hooks/useResourcePanelWrapper';
import { withResizeDetector } from 'react-resize-detector';
import { requestResource, facets } from './api/resources';
import { isEmpty, isEqual, omit } from 'lodash';
import useParsePluginConfigExpressions from './hooks/useParsePluginConfigExpressions';
import { hashLocationToHref } from './utils/ResourcesFiltersUtils';
import url from 'url';
import Box from './components/Box';
import Text from './components/Text';
import Spinner from './components/Spinner';
import Message from '../../components/I18N/Message';
import tooltip from '../../components/misc/enhancers/tooltip';
import ConfirmModal from './components/ConfirmModal';
import DirtyStatePrompt from './containers/DirtyStatePrompt';

const Button = tooltip(ButtonMS);

const tabComponents = {
    permissions: ResourcePermissions,
    about: ResourceAbout
};

const replaceResourcePaths = (value, resource) => {
    if (isArray(value)) {
        return value.map(val => replaceResourcePaths(val, resource));
    }
    if (isObject(value)) {
        if (value.path || value.facet) {
            const facet = facets.find(fc => fc.id === value.facet);
            return {
                ...facet,
                ...value,
                ...(value.path && { value: get(resource, value.path) })
            };
        }
        return Object.keys(value).reduce((acc, key) => ({
            ...acc,
            [key]: replaceResourcePaths(value[key], resource)
        }), {});
    }
    return value;
};

function ResourceDetailsComponent({
    user,
    resourcesGridId,
    resource: resourceProp,
    onSelect,
    onChange,
    pendingChanges,
    tabs = [],
    editing,
    setEditing,
    onToggleEditing,
    monitoredState,
    location,
    onSearch,
    error,
    setError,
    onClose
}) {

    const [update, setUpdate] = useState(0);
    const [updating, setUpdating] = useState();

    const {
        resource,
        loading
    } = useRequestResource({
        user,
        resource: resourceProp,
        request: requestResource,
        setResource: (data, isUpdate) => {
            onSelect(data, resourcesGridId);
            if (isUpdate) {
                onSearch({ refresh: true }, resourcesGridId);
                return;
            }
            return;
        },
        updateResource: () => {},
        update
    });

    const parsedConfig = useParsePluginConfigExpressions(monitoredState, { tabs });
    const { query } = url.parse(location.search, true);
    const updatedLocation = useRef();
    updatedLocation.current = location;
    function handleFormatHref(options) {
        return hashLocationToHref({
            location: updatedLocation.current,
            excludeQueryKeys: ['page'],
            ...options
        });
    }

    function handleUpdateResource() {
        if (!updating) {
            setUpdating(true);
            setError(false);
            updateResource(pendingChanges.resource)
                .toPromise()
                .then(() => {
                    setUpdate(prevUpdate => prevUpdate + 1);
                    setEditing(false);
                })
                .catch(err => {
                    setError(`error${err.status || 'Default'}`);
                })
                .finally(() => setUpdating(false));
        }
    }

    function handleOnChange(options) {
        onChange(options, resourcesGridId);
    }

    return (
        <Box className="ms-details-panel">
            <DetailsHeader
                resource={resource}
                editing={editing}
                tools={
                    <Box display="flex" flexVerticalAlign flexGap="sm">
                        {editing ? <Button variant="primary" disabled={isEmpty(pendingChanges?.changes)} onClick={handleUpdateResource} >
                            <Message msgId="resourcesCatalog.apply" />
                        </Button> : null}
                        {resource.canEdit ? <Button
                            tooltipId="resourcesCatalog.editResourceProperties"
                            square="md"
                            variant={editing ? 'success' : undefined}
                            onClick={() => onToggleEditing()}
                        >
                            <Icon glyph="edit" type="glyphicon" />
                        </Button> : null}
                    </Box>
                }
                loading={loading}
                getResourceTypesInfo={getResourceTypesInfo}
                onClose={() => onClose()}
                onChangeThumbnail={(thumbnail) => handleOnChange({ attributes: { thumbnail } })}
            />
            {error ? <Box component={Alert} bsStyle="danger" m="md" p="sm">
                <Message msgId={`resourcesCatalog.resourceError.${error}`}/>
            </Box> : null}
            {!loading ? <Box
                component={DetailsInfo}
                plr="md"
                key={resource.pk}
                tabs={replaceResourcePaths(parsedConfig.tabs, resource)}
                editing={editing}
                tabComponents={tabComponents}
                loading={loading}
                query={query}
                formatHref={handleFormatHref}
                resourcesGridId={resourcesGridId}
                onChange={handleOnChange}
                resource={resource}
            /> : null}
            {(updating || loading) ? <Box position="absolute" fill display="flex" flexItemsCenter overlay>
                <Text fontSize="xxl">
                    <Spinner />
                </Text>
            </Box> : null}
        </Box>
    );
}

const recursivePendingChanges = (a, b) => {
    return Object.keys(a).reduce((acc, key) => {
        if (!isArray(a[key]) && isObject(a[key])) {
            const obj = recursivePendingChanges(a[key], b[key]);
            return isEmpty(obj) ? acc : { ...acc, [key]: obj };
        }
        return !isEqual(a[key], b[key])
            ? { ...acc, [key]: a[key] }
            : acc;
    }, {});
};

const getPendingChanges = (state, props) => {
    const initialResource = getInitialSelectedResource(state, props);
    const resource = getSelectedResource(state, props);
    if (!(resource && initialResource)) {
        return null;
    }
    const { attributes: pendingAttributes = {}, ...pendingChanges } = recursivePendingChanges(resource, initialResource);
    const attributesKeys = [
        'thumbnail',
        'details'
    ];
    const categoryOptions = {
        'thumbnail': {
            tail: '/raw?decode=datauri',
            category: 'THUMBNAIL'
        },
        'details': {
            category: 'DETAILS'
        }
    };
    const linkedResources = attributesKeys.reduce((acc, key) => {
        const value = initialResource?.attributes?.[key] || 'NODATA';
        const data = pendingAttributes?.[key] || 'NODATA';
        if (pendingAttributes?.[key] !== undefined && value !== data) {
            return {
                ...acc,
                [key]: {
                    ...categoryOptions[key],
                    value,
                    data
                }
            };
        }
        return acc;
    }, {});
    const attributes = omit(pendingAttributes, attributesKeys);
    const excludedMetadata = ['pk', 'permissions', 'attributes', 'data', 'category'];
    const metadata = merge(omit(initialResource, excludedMetadata), omit(pendingChanges, excludedMetadata));
    const mergedAttributes = merge(initialResource.attributes, attributes) || {};
    return {
        resource: {
            id: initialResource.pk,
            // data,
            permission: pendingChanges.permissions ?? initialResource.permissions,
            metadata: {
                ...metadata,
                attributes: Object.fromEntries(Object.keys(mergedAttributes || {}).map((key) => {
                    return [key, isObject(mergedAttributes[key])
                        ? JSON.stringify(mergedAttributes[key])
                        : mergedAttributes[key]];
                }))
            },
            ...(!isEmpty(linkedResources) && { linkedResources })
        },
        changes: {
            ...pendingChanges,
            ...(!isEmpty(attributes) && { attributes }),
            ...(!isEmpty(linkedResources) && { linkedResources })
        }
    };
};

function ResourceDetails({
    targetSelector,
    headerNodeSelector = '#ms-brand-navbar',
    navbarNodeSelector = '',
    footerNodeSelector = '',
    width,
    height,
    ...props
}) {

    const {
        stickyTop,
        stickyBottom
    } = useResourcePanelWrapper({
        headerNodeSelector,
        navbarNodeSelector,
        footerNodeSelector,
        width,
        height,
        active: true
    });

    const [editing, setEditing] = useState();
    const [error, setError] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);

    function handleToggleEditing(force) {
        if (!force && editing && !isEmpty(props.pendingChanges?.changes)) {
            setConfirmModal('editing');
            return;
        }
        setEditing(!editing);
        setError(false);
        return;
    }

    function handleClose(force) {
        if (!force && !isEmpty(props.pendingChanges?.changes)) {
            setConfirmModal('close');
            return;
        }
        props.onSelect(null, props.resourcesGridId);
        setEditing(false);
        setError(false);
        return;
    }

    function handleConfirm() {
        const isClose = confirmModal === 'close';
        setConfirmModal(false);
        props.onReset();
        if (isClose) {
            handleClose(true);
            return;
        }
        handleToggleEditing(true);
    }

    return (
        <TargetSelectorPortal targetSelector={targetSelector}>
            <ResourcesPanelWrapper
                className="ms-resource-detail"
                top={stickyTop}
                bottom={stickyBottom}
                show={!!props.resource}
                editing={editing}
                enabled={!!props.resource}
            >
                <ResourceDetailsComponent
                    {...props}
                    editing={editing}
                    setEditing={setEditing}
                    onToggleEditing={handleToggleEditing}
                    error={error}
                    setError={setError}
                    onClose={handleClose}
                />
            </ResourcesPanelWrapper>
            <DirtyStatePrompt
                show={!!confirmModal}
                onCancel={() => setConfirmModal(false)}
                onConfirm={handleConfirm}
                dirtyState={!isEmpty(props.pendingChanges?.changes)}
                titleId="resourcesCatalog.detailsPendingChangesTitle"
                descriptionId="resourcesCatalog.detailsPendingChangesDescription"
                cancelId="resourcesCatalog.detailsPendingChangesCancel"
                confirmId="resourcesCatalog.detailsPendingChangesConfirm"
                variant="danger"
            />
        </TargetSelectorPortal>
    );
}

const ResourceDetailsPlugin = connect(
    createStructuredSelector({
        resource: getSelectedResource,
        pendingChanges: getPendingChanges,
        user: userSelector,
        monitoredState: getMonitoredStateSelector,
        location: getRouterLocation
    }),
    {
        onSelect: setSelectedResource,
        onChange: updateSelectedResource,
        onSearch: searchResources,
        onReset: resetSelectedResource
    }
)(withResizeDetector(ResourceDetails));

export default createPlugin('ResourceDetails', {
    component: ResourceDetailsPlugin,
    containers: {
        ResourcesGrid: {
            target: 'card-buttons',
            position: 2,
            Component: connect(
                createStructuredSelector({
                    selectedResource: getSelectedResource
                }),
                {
                    onSelect: setSelectedResource
                }
            )(({ resourcesGridId, resource,  onSelect, component, selectedResource }) => {
                const Component = component;
                function handleClick() {
                    if (selectedResource?.pk !== resource.pk) {
                        onSelect(resource, resourcesGridId);
                    }
                }
                return (
                    <Component
                        onClick={handleClick}
                        glyph="info-sign"
                        iconType="glyphicon"
                        square
                        labelId="resourcesCatalog.viewResourceProperties"
                    />
                );
            })
        }
    },
    epics: {},
    reducers: {
        resources: resourcesReducer
    }
});
