/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import tooltip from '../../misc/enhancers/tooltip';
import { getTitleAndTooltip } from '../../../utils/TOCUtils';

const NodeTitle = tooltip(({ children, ...props }) => {
    return <div {...props} className="ms-node-title">{children}</div>;
});

const Title = ({
    node,
    filterText = '',
    currentLocale,
    tooltipOptions,
    showTooltip
}) => {
    const { title: value, tooltipText } = getTitleAndTooltip({ node, currentLocale, tooltipOptions });
    const tooltipValue = showTooltip ? tooltipText : undefined;
    const id = `title-tooltip-${node?.id}`;
    const tooltipPosition = node?.tooltipPlacement || 'top';
    if (!filterText) {
        return (<NodeTitle idDropDown={id} keyProp={id} tooltip={tooltipValue} tooltipPosition={tooltipPosition} >{value}</NodeTitle>);
    }
    const regularExpression = new RegExp(filterText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    const matches = value.match(regularExpression);
    if (!matches) {
        return (<NodeTitle idDropDown={id} keyProp={id} tooltip={tooltipValue} tooltipPosition={tooltipPosition}>{value}</NodeTitle>);
    }
    return (<NodeTitle idDropDown={id} keyProp={id} tooltip={tooltipValue} tooltipPosition={tooltipPosition}>
        {value.split(regularExpression)
            .map((split, idx) => {
                if (idx < matches.length) {
                    return (<React.Fragment key={idx}>
                        {split}
                        <mark >{matches[idx]}</mark>
                    </React.Fragment>);
                }
                return (<React.Fragment key={idx}>{split}</React.Fragment>);
            })}
    </NodeTitle>);
};

export default Title;
