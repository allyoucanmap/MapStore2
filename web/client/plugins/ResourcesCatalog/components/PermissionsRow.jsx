/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Icon from './Icon';
import Message from '../../../components/I18N/Message';

function PermissionsRow({
    type,
    name,
    options,
    hideOptions,
    hideIcon,
    permissions,
    avatar,
    children,
    clearable,
    onChange
}) {

    return (
        <div
            className="ms-share-permissions-row"
        >
            {(!hideIcon && (type || avatar)) && <div className="ms-share-permissions-icon">
                {avatar
                    ? <img src={avatar}/>
                    : <Icon glyph={type} />}
            </div>}
            <div className="ms-share-permissions-name">{name}</div>
            <div className="ms-share-permissions-tools">
                {children}
            </div>
            {!hideOptions && <div className="ms-share-permissions-options">
                <Select
                    clearable={clearable}
                    options={options.map(({ value, labelId, label }) => ({ value, label: label ? <span>{label}</span> : <Message msgId={labelId} />}))}
                    value={permissions}
                    onChange={(option) => onChange({ permissions: option?.value || '' })}
                />
            </div>}
        </div>
    );
}

PermissionsRow.propTypes = {
    options: PropTypes.array,
    clearable: PropTypes.bool,
    onChange: PropTypes.func
};

PermissionsRow.defaultProps = {
    options: [
        {
            value: 'view',
            labelId: 'resourcesCatalog.viewPermission'
        },
        {
            value: 'download',
            labelId: 'resourcesCatalog.downloadPermission'
        },
        {
            value: 'edit',
            labelId: 'resourcesCatalog.editPermission'
        },
        {
            value: 'manage',
            labelId: 'resourcesCatalog.managePermission'
        }
    ],
    clearable: false,
    onChange: () => { }
};

export default PermissionsRow;
