/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import Message from '../../../components/I18N/Message';
import PropTypes from 'prop-types';
import IconComponent from './Icon';
import tooltip from '../../../components/misc/enhancers/tooltip';

const Icon = ({ glyph, type, ...props }) => {
    return (<div {...props}><IconComponent type={type} glyph={glyph} /></div> );
};

const IconWithTooltip = tooltip(Icon);

const ResourceStatus = ({ statusItems = [] }) => {

    if (!statusItems?.length) {
        return null;
    }
    return (
        <div className="ms-resource-status">
            {statusItems.map((item, idx) => {
                if (item.type === 'text') {
                    return (
                        <div key={idx} className={`ms-resource-status-text ms-resource-status-${item.variant}`} >
                            <Message msgId={item.labelId} />
                        </div>
                    );
                }
                if (item.type === 'icon') {
                    return (
                        <IconWithTooltip
                            glyph={item.glyph}
                            type={item.iconType}
                            tooltip={item.tooltip}
                            tooltipId={item.tooltipId}
                            className={`ms-resource-status-icon ms-resource-status-${item.variant}`}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

ResourceStatus.propTypes = {
    statusItems: PropTypes.array
};

ResourceStatus.defaultProps = {
    statusItems: []
};


export default ResourceStatus;
