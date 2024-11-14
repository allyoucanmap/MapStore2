/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import Permissions from '../components/Permissions';
import GeoStoreDAO from '../../../api/GeoStoreDAO';
import { userSelector } from '../../../selectors/security';

function ResourcePermissions({
    editing,
    user,
    resource,
    onChange
}) {

    const [availableGroups, setGroups] = useState([]);

    useEffect(() => {
        GeoStoreDAO.getAvailableGroups(user)
            .then((response) => {
                setGroups(response);
            });
    }, [user]);

    const permissionEntries = resource?.permissions?.filter(entry => entry.group)?.map((entry) => {
        return {
            type: 'group',
            id: entry?.group?.id,
            name: entry?.group?.groupName,
            permissions: entry?.canWrite ? 'edit' : 'view'
        };
    });

    if (editing) {
        return (
            <Permissions
                compactPermissions={{
                    entries: permissionEntries
                }}
                onChange={({ entries }) => {
                    const userPermissions = (resource?.permissions || []).filter((entry) => !entry.group);
                    onChange({
                        'permissions': [
                            ...entries.map((entry) => {
                                return {
                                    canRead: ['view', 'edit'].includes(entry.permissions),
                                    canWrite: ['edit'].includes(entry.permissions),
                                    group: {
                                        id: entry.id,
                                        groupName: entry.name
                                    }
                                };
                            }),
                            ...userPermissions
                        ]
                    });
                }}
                permissionOptions={{
                    'default': [
                        {
                            value: 'view',
                            labelId: 'resourcesCatalog.viewPermission'
                        },
                        {
                            value: 'edit',
                            labelId: 'resourcesCatalog.editPermission'
                        }
                    ]
                }}
                entriesTabs={[
                    {
                        id: 'group',
                        labelId: 'resourcesCatalog.groups',
                        request: ({ q }) => {
                            return Promise.resolve(availableGroups.filter(group => (group?.groupName || '').toLowerCase().includes(q.toLowerCase())));
                        },
                        responseToEntries: ({ response, entries }) => {
                            return response.map((group) => {
                                const permissions = (entries || []).find(entry => entry.id === group.id)?.permissions;
                                return {
                                    type: 'group',
                                    id: group.id,
                                    name: group.groupName,
                                    permissions,
                                    parsed: true
                                };
                            });
                        }
                    }
                ]}
            />
        );
    }

    return (
        <div className="ms-details-info-fields">
            {permissionEntries.map((entry) => {
                return (
                    <div key={entry.name} className={`ms-details-info-row`}>
                        <div className={`ms-details-info-label`}>{entry.name}</div>
                        <div className="ms-details-info-value">
                            {entry.permissions}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const ConnectedResourcePermissions = connect(
    createStructuredSelector({
        user: userSelector
    })
)(ResourcePermissions);

export default ConnectedResourcePermissions;
