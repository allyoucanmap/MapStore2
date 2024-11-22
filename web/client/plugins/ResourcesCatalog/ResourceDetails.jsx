/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import { createPlugin } from '../../utils/PluginsUtils';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import resourcesReducer from './reducers/resources';
import {
    resetSelectedResource,
    searchResources,
    setSelectedResource,
    setShowDetails,
    updateSelectedResource
} from './actions/resources';
import {
    getSelectedResource,
    getMonitoredStateSelector,
    getRouterLocation,
    getShowDetails
} from './selectors/resources';
import { getPendingChanges } from './selectors/save';
import ResourcePermissions from './containers/ResourcePermissions';
import ResourceAbout from './containers/ResourceAbout';
import { updateResource } from '../../observables/geostore';
import { userSelector } from '../../selectors/security';
import ResourcesPanelWrapper from './components/ResourcesPanelWrapper';
import TargetSelectorPortal from './components/TargetSelectorPortal';
import useResourcePanelWrapper from './hooks/useResourcePanelWrapper';
import { withResizeDetector } from 'react-resize-detector';
import { requestResource, facets } from './api/resources';
import { isEmpty } from 'lodash';
import DirtyStatePrompt from './containers/DirtyStatePrompt';
import ResourceDetailsComponent from './containers/ResourceDetails';
import Button from './components/Button';
import { getResourceTypesInfo } from './utils/ResourcesUtils';
import Icon from './components/Icon';
import Text from './components/Text';
import Box from './components/Box';

const tabComponents = {
    permissions: ResourcePermissions,
    about: ResourceAbout
};

function ResourceDetails({
    targetSelector,
    headerNodeSelector = '#ms-brand-navbar',
    navbarNodeSelector = '',
    footerNodeSelector = '',
    width,
    height,
    show,
    onShow,
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

    useEffect(() => {
        return () => {
            props.onSelect(null, props.resourcesGridId);
            onShow(false);
        };
    }, []);

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
        if (props.resourceType === undefined) {
            props.onSelect(null, props.resourcesGridId);
        }
        onShow(false);
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
                show={show}
                editing={editing}
                enabled={show}
            >
                <ResourceDetailsComponent
                    {...props}
                    editing={editing}
                    setEditing={setEditing}
                    onToggleEditing={handleToggleEditing}
                    error={error}
                    setError={setError}
                    onClose={handleClose}
                    tabComponents={tabComponents}
                    setRequest={requestResource}
                    updateRequest={updateResource}
                    facets={facets}
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

const resourceDetailsConnect = connect(
    createStructuredSelector({
        resource: getSelectedResource,
        pendingChanges: getPendingChanges,
        user: userSelector,
        monitoredState: getMonitoredStateSelector,
        location: getRouterLocation,
        show: getShowDetails
    }),
    {
        onSelect: setSelectedResource,
        onChange: updateSelectedResource,
        onSearch: searchResources,
        onReset: resetSelectedResource,
        onShow: setShowDetails
    }
);

function BrandNavbarDetailsButton({
    pendingChanges,
    resourceType,
    onSelect,
    onShow
}) {

    if (!resourceType) {
        return null;
    }
    const resource = {
        pk: pendingChanges?.initialResource?.id,
        ...pendingChanges?.initialResource,
        category: {
            name: resourceType.toUpperCase()
        }
    };
    const { icon, title } = getResourceTypesInfo(resource);
    return (
        <Box display="flex" flexVerticalAlign flexGap="xs">
            <Button
                square="md"
                onClick={() => {
                    onSelect(resource);
                    onShow(true);
                }}
            >
                {icon ? <Icon {...icon} /> : null}
            </Button>
            <Text ellipsis>
                {title}
            </Text>
        </Box>
    );
}

export default createPlugin('ResourceDetails', {
    component: resourceDetailsConnect(withResizeDetector(ResourceDetails)),
    containers: {
        BrandNavbar: {
            priority: 1,
            target: 'left-menu',
            Component: resourceDetailsConnect(BrandNavbarDetailsButton),
            doNotHide: true
        },
        ResourcesGrid: {
            priority: 2,
            target: 'card-buttons',
            position: 2,
            Component: connect(
                createStructuredSelector({
                    selectedResource: getSelectedResource
                }),
                {
                    onSelect: setSelectedResource,
                    onShow: setShowDetails
                }
            )(({ resourcesGridId, resource,  onSelect, component, selectedResource, onShow }) => {
                const Component = component;
                function handleClick() {
                    if (selectedResource?.pk !== resource.pk) {
                        onSelect(resource, resourcesGridId);
                        onShow(true, resourcesGridId);
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
            }),
            doNotHide: true
        }
    },
    epics: {},
    reducers: {
        resources: resourcesReducer
    }
});
