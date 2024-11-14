/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from './Icon';
import { Dropdown, MenuItem } from 'react-bootstrap';
import Message from '../../../components/I18N/Message';

const ActionMenuItem = ({
    glyph,
    iconType,
    children,
    labelId,
    ...props
}) => {
    return (
        <MenuItem {...props}>
            {glyph ? <><Icon type={iconType} glyph={glyph}/>{' '}</> : null}
            <Message msgId={labelId} />
        </MenuItem>
    );
};

function ActionButtons({
    options,
    viewerUrl,
    resource
}) {

    const containerNode = useRef();
    const dropdownClassName = 'ms-card-dropdown';
    const dropdownNode = containerNode?.current?.querySelector(`.${dropdownClassName}`);
    const isDropdownEmpty = (dropdownNode?.children?.length || 0) === 0;

    return (
        <div
            ref={containerNode}
            className="ms-resource-action-buttons"
            onClick={event => event.stopPropagation()}
            style={isDropdownEmpty ? { display: 'none' } : {}}
        >
            <Dropdown className="ms-card-options" pullRight id={`ms-card-options-${resource.pk2 || resource.pk}`}>
                <Dropdown.Toggle
                    variant="default"
                    size="xs"
                    noCaret
                >
                    <Icon glyph="ellipsis-v" />
                </Dropdown.Toggle>
                <Dropdown.Menu className={dropdownClassName}>
                    {options.map((option) => {
                        if (option.Component) {
                            const { Component } = option;
                            return <Component key={option.name} resource={resource} viewerUrl={viewerUrl} renderType="menuItem" component={ActionMenuItem}/>;
                        }
                        return null;
                    })}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

ActionButtons.propTypes = {
    options: PropTypes.array,
    resource: PropTypes.object
};

ActionButtons.defaultProps = {
    options: [],
    resource: {}
};

export default ActionButtons;
