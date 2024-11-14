/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import Message from '../../../components/I18N/Message';
import { FormControl as FormControlRB, Nav, NavItem } from 'react-bootstrap';
import Popover from '../../../components/styleeditor/Popover';
import Button from './Button';
import PermissionsAddEntriesPanel from './PermissionsAddEntriesPanel';
import PermissionsRow from './PermissionsRow';
import Icon from './Icon';
import localizedProps from '../../../components/misc/enhancers/localizedProps';

import Spinner from './Spinner';

const FormControl = localizedProps('placeholder')(FormControlRB);

function Permissions({
    compactPermissions = {},
    onChange = () => {},
    entriesTabs = [],
    loading,
    permissionOptions,
    permissionsToLists = (value) => value,
    listsToPermissions = (value) => value,
    showGroupsPermissions
}) {

    const { entries = [], groups = [] } = permissionsToLists(compactPermissions);
    const [activeTab, setActiveTab] = useState(entriesTabs?.[0]?.id || '');
    const [permissionsEntires, setPermissionsEntires] = useState(entries);
    const [permissionsGroups, setPermissionsGroups] = useState(groups);

    const [order, setOrder] = useState([]);
    const [filter, setFilter] = useState('');

    function handleChange(newValues) {
        onChange(listsToPermissions({
            entries: permissionsEntires,
            groups: permissionsGroups,
            ...newValues
        }));
    }

    function handleUpdateGroup(groupId, properties) {
        const newGroups = permissionsGroups.map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    ...properties
                };
            }
            return group;
        });
        setPermissionsGroups(newGroups);
        handleChange({ groups: newGroups });
    }

    function handleAddNewEntry(newEntry) {
        const newEntries = [
            ...permissionsEntires,
            {
                ...newEntry,
                permissions: 'view'
            }
        ];
        setPermissionsEntires(newEntries);
        handleChange({ entries: newEntries });
    }

    function handleRemoveEntry(newEntry) {
        const newEntries = permissionsEntires.filter(entry => entry.id !== newEntry.id);
        setPermissionsEntires(newEntries);
        handleChange({ entries: newEntries });
    }

    function handleUpdateEntry(entryId, properties, noCallback) {
        const newEntries = permissionsEntires.map(entry => {
            if (entry.id === entryId) {
                return {
                    ...entry,
                    ...properties
                };
            }
            return entry;
        });
        setPermissionsEntires(newEntries);
        if (!noCallback) {
            handleChange({ entries: newEntries });
        }
    }

    function sortEntries(key) {
        const direction = !order[1];
        setOrder([key, direction]);
        function sortByKey(a, b) {
            const aProperty = (a[key] || '').toLowerCase();
            const bProperty = (b[key] || '').toLowerCase();
            return direction
                ? (aProperty > bProperty ? 1 : -1)
                : (aProperty > bProperty ? -1 : 1);
        }
        setPermissionsEntires(
            [...permissionsEntires]
                .sort(sortByKey)
        );
        setPermissionsGroups(
            [...permissionsGroups]
                .sort(sortByKey)
        );
    }

    useEffect(() => {
        sortEntries(order[1] || 'name');
    }, []);

    const filteredEntries = permissionsEntires
        .filter((entry) => !filter
            || (entry?.name?.toLowerCase()?.includes(filter?.toLowerCase())
            || entry?.permissions?.toLowerCase()?.includes(filter?.toLowerCase())));

    const isMounted = useRef();
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return (
        <div className="ms-share-permissions-container">
            {showGroupsPermissions ? <ul className="ms-share-permissions-list">
                <li className="ms-share-permissions-pinned">
                    {filteredEntries
                        .filter((item) => item.permissions === 'owner' && !item.is_superuser)
                        .map((item) => {
                            return (
                                <div className="ms-share-permissions-row">
                                    <p className="ms-share-permissions-label ms-share-permissions-name"><Message msgId="resourcesCatalog.ownerPermission" />:</p>
                                    <div className="ms-share-permissions-owner">
                                        <div className="ms-share-permission-tag">
                                            <div className="ms-share-permissions-icon">
                                                {item.avatar
                                                    ? <img src={item.avatar}/>
                                                    : <Icon glyph={item.type} />}
                                            </div>
                                            <a className="ms-share-permissions-owners-name" href={`/people/profile/${item?.username}/`}>
                                                {(item?.first_name !== "" && item?.last_name !== "") ?
                                                    (item?.first_name + ' ' + item?.last_name) :
                                                    item?.username
                                                }
                                            </a>
                                        </div>
                                    </div>
                                </div>);
                        })}
                    {permissionsGroups
                        .map((group) => {
                            return (
                                <PermissionsRow
                                    key={group.id}
                                    {...group}
                                    hideIcon
                                    onChange={handleUpdateGroup.bind(null, group.id)}
                                    name={<strong>{<Message msgId={`resourcesCatalog.${group.name}`} />}</strong>}
                                    options={permissionOptions?.[group.name] || permissionOptions?.default}
                                />
                            );
                        })}
                </li>
            </ul> : null}
            <div className="ms-share-permissions-list-head">
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <div style={{ flex: 1 }} className="ms-share-filter">
                        <FormControl
                            placeholder="resourcesCatalog.filterByNameOrPermissions"
                            value={filter}
                            onChange={event => setFilter(event.target.value)}
                        />
                        {filter && <Button onClick={() => setFilter('')}>
                            <Icon glyph="times"/>
                        </Button>}
                    </div>
                    <Popover
                        placement="bottom"
                        content={
                            <div className="ms-add-permissions-entries-container">
                                <Nav bsStyle="tabs" activeKey={activeTab}>
                                    {entriesTabs.map((tab) => {
                                        return (
                                            <NavItem
                                                key={tab.id}
                                                eventKey={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                            >
                                                <Message msgId={tab.labelId} />
                                            </NavItem>
                                        );
                                    })}
                                </Nav>
                                <div className="ms-add-permissions-entries-body">
                                    {entriesTabs
                                        .filter(tab => tab.id === activeTab)
                                        .map(tab => {
                                            return (
                                                <PermissionsAddEntriesPanel
                                                    key={tab.id}
                                                    request={(params) => tab.request({
                                                        ...params,
                                                        entries: permissionsEntires,
                                                        groups: permissionsGroups
                                                    })}
                                                    onAdd={handleAddNewEntry}
                                                    onRemove={handleRemoveEntry}
                                                    responseToEntries={(response) =>
                                                        tab.responseToEntries({ response, entries: permissionsEntires })
                                                    }
                                                />
                                            );
                                        })}
                                </div>
                            </div>
                        }>
                        <Button variant={'primary'} size="sm">
                            <Icon glyph="plus" />{' '}<Message msgId="resourcesCatalog.addPermissionsEntry"/>
                        </Button>
                    </Popover>
                </div>
                <div className="ms-share-permissions-head">
                    <div className="ms-share-permissions-row">
                        <div className="ms-share-permissions-name">
                            <Button onClick={sortEntries.bind(null, 'name')}>
                                <Message msgId="resourcesCatalog.permissionsName"/>
                                {order[0] === 'name' && <>{' '}<Icon glyph={order[1] ? 'chevron-up' : 'chevron-down'} /></>}
                            </Button>
                        </div>
                        <div className="ms-share-permissions-options">
                            <Button onClick={sortEntries.bind(null, 'permissions')}>
                                <Message msgId="resourcesCatalog.permissions"/>
                                {order[0] === 'permissions' && <>{' '}<Icon glyph={order[1] ? 'chevron-up' : 'chevron-down'} /></>}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <ul className="ms-share-permissions-list">
                {filteredEntries
                    .filter((item) => item.permissions !== 'owner' && !item.is_superuser)
                    .map((entry, idx) => {
                        return (
                            <li
                                key={entry.id + '-' + idx}>
                                <PermissionsRow
                                    {...entry}
                                    onChange={handleUpdateEntry.bind(null, entry.id)}
                                    options={permissionOptions?.default}
                                >
                                    {entry.permissions !== 'owner' &&
                                    <>
                                        <Button onClick={handleRemoveEntry.bind(null, entry)}>
                                            <Icon glyph="trash" />
                                        </Button>
                                    </>}
                                </PermissionsRow>
                            </li>
                        );
                    })}
            </ul>
            {(filteredEntries.length === 0 && filter) &&
                <div className="ms-permissions-alert">
                    <Message msgId="resourcesCatalog.permissionsEntriesNoResults" />
                </div>
            }
            {loading && (
                <div className="ms-spinner-container">
                    <Spinner />
                </div>
            )}
        </div>
    );
}

export default Permissions;
