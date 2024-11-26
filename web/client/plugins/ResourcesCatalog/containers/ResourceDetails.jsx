/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from 'react';
import { Alert } from 'react-bootstrap';
import useRequestResource from '../hooks/useRequestResource';
import DetailsInfo from '../components/DetailsInfo';
import ButtonMS from '../components/Button';
import Icon from '../components/Icon';
import { getResourceTypesInfo } from '../utils/ResourcesUtils';
import DetailsHeader from '../components/DetailsHeader';
import { isEmpty, isArray, isObject, get } from 'lodash';
import useParsePluginConfigExpressions from '../hooks/useParsePluginConfigExpressions';
import { hashLocationToHref } from '../utils/ResourcesFiltersUtils';
import url from 'url';
import Box from '../components/Box';
import Text from '../components/Text';
import Spinner from '../components/Spinner';
import Message from '../../../components/I18N/Message';
import tooltip from '../../../components/misc/enhancers/tooltip';

const Button = tooltip(ButtonMS);

const replaceResourcePaths = (value, resource, facets) => {
    if (isArray(value)) {
        return value.map(val => replaceResourcePaths(val, resource, facets));
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
            [key]: replaceResourcePaths(value[key], resource, facets)
        }), {});
    }
    return value;
};

function ResourceDetails({
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
    onClose,
    tabComponents,
    setRequest,
    updateRequest,
    facets,
    resourceType
}) {

    const parsedConfig = useParsePluginConfigExpressions(monitoredState, { tabs });

    const {
        resource,
        loading,
        updating,
        update: handleUpdateResource
    } = useRequestResource({
        user,
        resource: resourceProp,
        setRequest,
        updateRequest,
        setResource: (data, isUpdate) => {
            onSelect(data, resourcesGridId);
            if (isUpdate) {
                onSearch({ refresh: true }, resourcesGridId);
                return;
            }
            return;
        },
        onUpdateStart: () => {
            setError(false);
        },
        onUpdateSuccess: () => {
            setEditing(false);
        },
        onUpdateError: (err) => {
            setError(`error${err.status || 'Default'}`);
        }
    });

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

    function handleOnChange(options) {
        onChange(options, resourcesGridId);
    }

    return (
        <Box className="ms-details-panel">
            <DetailsHeader
                resource={resource || {}}
                editing={editing}
                tools={
                    <Box display="flex" flexVerticalAlign flexGap="sm">
                        {resourceType === undefined && editing ? <Button
                            tooltipId="resourcesCatalog.apply"
                            className={isEmpty(pendingChanges?.changes) ? undefined : 'ms-notification-circle warning'}
                            disabled={isEmpty(pendingChanges?.changes)}
                            onClick={() => handleUpdateResource(pendingChanges.saveResource)}
                        >
                            <Icon glyph="floppy-disk" type="glyphicon" />
                        </Button> : null}
                        {(resource?.canEdit || resource?.canCopy) ? <Button
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
                key={resource?.pk}
                tabs={replaceResourcePaths(parsedConfig.tabs, resource, facets)}
                editing={editing}
                tabComponents={tabComponents}
                loading={loading}
                query={query}
                formatHref={handleFormatHref}
                resourcesGridId={resourcesGridId}
                onChange={handleOnChange}
                resource={resource || {}}
            /> : null}
            {(updating || loading) ? <Box position="absolute" fill display="flex" flexItemsCenter overlay>
                <Text fontSize="xxl">
                    <Spinner />
                </Text>
            </Box> : null}
        </Box>
    );
}

export default ResourceDetails;
