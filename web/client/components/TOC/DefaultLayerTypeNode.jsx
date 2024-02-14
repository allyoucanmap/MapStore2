/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import { castArray, find } from 'lodash';
import { getLayerTypeGlyph } from '../../utils/LayersUtils';
import WMSLegend from './fragments/WMSLegend';
import OpacitySlider from './fragments/OpacitySlider';
import StyleBasedLegend from './fragments/StyleBasedLegend';
import VisibilityCheck from './fragments/VisibilityCheck';
import NodeHeader from './NodeHeader';
import NodeTool from './NodeTool';
import ExpandButton from './fragments/ExpandButton';

const DefaultLayerTypeNode = ({
    node,
    filterText,
    onChange,
    sortHandler,
    parentMutuallyExclusive,
    config = {},
    nodeToolItems = [],
    onSelect,
    nodeType,
    error,
    visibilityWarningMessageId
}) => {

    const getContent = () => {

        // currently the only content of the layer is the legend
        // so we hide it if not visible
        if (error || config?.layerOptions?.hideLegend) {
            return null;
        }

        const layerType = node?.type;
        if (['wfs', 'vector'].includes(layerType)) {
            const hasStyle = node?.style?.format === 'geostyler' && node?.style?.body?.rules?.length > 0;
            return hasStyle
                ? (
                    <>
                        <li>
                            <StyleBasedLegend
                                style={node?.style}
                            />
                        </li>
                    </>
                )
                : null;
        }
        if (layerType === 'wms') {
            return (
                <>
                    <li>
                        <WMSLegend
                            node={node}
                            currentZoomLvl={config?.zoom}
                            scales={config?.scales}
                            language={config?.language}
                            {...config?.layerOptions?.legendOptions}
                        />
                    </li>
                </>
            );
        }
        return null;
    };

    const icon = getLayerTypeGlyph(node);
    const forceExpanded = config?.expanded !== undefined;
    const expanded = forceExpanded ? config?.expanded : node?.expanded;
    const content = getContent(error);
    // loader
    return (
        <>
            <NodeHeader
                node={node}
                className={nodeType}
                filterText={filterText}
                currentLocale={config?.currentLocale}
                tooltipOptions={config?.layerOptions?.tooltipOptions}
                onClick={onSelect}
                showTitleTooltip={config?.showTitleTooltip}
                beforeTitle={
                    <>
                        {sortHandler}
                        <ExpandButton
                            hide={!(!forceExpanded && content)}
                            expanded={expanded}
                            onChange={onChange}
                        />
                        <VisibilityCheck
                            error={error}
                            hide={config?.hideVisibilityButton}
                            mutuallyExclusive={parentMutuallyExclusive}
                            value={!!node?.visibility}
                            onChange={(visibility) => {
                                onChange({ visibility });
                            }}
                        />
                        <Glyphicon glyph={icon} />
                    </>
                }
                afterTitle={
                    <>
                        {visibilityWarningMessageId && <NodeTool glyph="info-sign" tooltipId={visibilityWarningMessageId} />}
                        {
                        // indicators are deprecated
                        // use node items instead
                        }
                        {config?.layerOptions?.indicators ? castArray(config.layerOptions.indicators).map( indicator =>
                            (indicator.type === 'dimension'
                                ? find(node?.dimensions || [], indicator.condition) : false)
                                ? indicator.glyph && <NodeTool onClick={false} key={indicator.key} glyph={indicator.glyph} {...indicator.props} />
                                : null)
                            : null}
                        {nodeToolItems.map(({ Component, name }) => {
                            return (<Component key={name} itemComponent={NodeTool} node={node} onChange={onChange} />);
                        })}
                    </>
                }
            />
            {expanded && content ? <ul>
                {content}
            </ul> : null}
            <OpacitySlider
                hide={!!error || config?.hideOpacitySlider || ['3dtiles'].includes(node?.type)}
                opacity={node?.opacity}
                disabled={!node.visibility}
                hideTooltip={!config.showOpacityTooltip}
                onChange={opacity => onChange({ opacity })}
            />
        </>
    );
};

export default DefaultLayerTypeNode;
