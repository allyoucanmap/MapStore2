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
import {
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
import Button from './components/Button';
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
    monitoredState,
    location
}) {

    const {
        resource,
        loading
    } = useRequestResource({
        user,
        resource: resourceProp,
        request: requestResource,
        setResource: (data) => onSelect(data, resourcesGridId)
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
        updateResource(pendingChanges.resource)
            .toPromise()
            .then((response) => {
                console.log(response);
            });
    }

    function handleOnChange(options) {
        onChange(options, resourcesGridId);
    }
    // const detailsToolbarItems = configuredItems.filter(item => (item.target === "cardOptions" && item.detailsToolbar) || item.target === "detailsToolbar");
    return (
        <div className={`ms-details-panel${loading ? ' loading' : ''}`}>
            <DetailsHeader
                resource={resource}
                editing={editing}
                tools={
                    <div className="ms-details-panel-tools">
                        {editing ? <Button size="xs" variant="primary" disabled={isEmpty(pendingChanges?.changes)} onClick={handleUpdateResource} >
                            Apply
                        </Button> : null}
                        {resource.canEdit ? <Button size="xs" variant={editing ? 'success' : undefined} onClick={() => setEditing(!editing)} >
                            <Icon glyph="edit" type="glyphicon" />
                        </Button> : null}
                    </div>
                }
                loading={loading}
                getResourceTypesInfo={getResourceTypesInfo}
                onClose={() => onSelect(null, resourcesGridId)}
                onChangeThumbnail={(thumbnail) => handleOnChange({ attributes: { thumbnail } })}
            />
            {!loading ? <DetailsInfo
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
        </div>
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
    targetSelector = 'body > div',
    headerNodeSelector = '#mapstore-navbar-container',
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
                />
            </ResourcesPanelWrapper>
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
        onChange: updateSelectedResource
    }
)(withResizeDetector(ResourceDetails));

export default createPlugin('ResourceDetails', {
    component: ResourceDetailsPlugin,
    containers: {
        ResourcesGrid: [
            {
                target: 'card-buttons',
                Component: connect(() => ({ }), { onSelect: setSelectedResource  })(({ resourcesGridId, resource,  onSelect, component }) => {
                    const Component = component;
                    function handleClick() {
                        onSelect(resource, resourcesGridId);
                    }
                    return (
                        <Component
                            onClick={handleClick}
                            glyph="wrench"
                            iconType="glyphicon"
                            tooltipId="resources.resource.editResource"
                        />
                    );
                })
            }/* ,
            {
                target: 'card',
                priority: 1,
                Component: connect(() => ({ }), { onSelect: setSelectedResource  })(({ children, onSelect, resource, ...props }) => {
                    function handleClick() {
                        onSelect(resource, props.resourcesGridId);
                    }
                    return (<div {...props} onClick={handleClick}>{children}</div>);
                })
            },
            {
                target: 'card-buttons',
                priority: 1,
                Component: ({ component, viewerUrl }) => {
                    const Component = component;
                    return (
                        <Component
                            href={viewerUrl}
                            rel="noopener noreferrer"
                            labelId="resourcesCatalog.view"
                        />
                    );
                }
            }
            */
        ]
    },
    epics: {},
    reducers: {
        resources: resourcesReducer
    }
});
