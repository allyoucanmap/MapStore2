/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import { isNil } from 'lodash';
import { isInsideResolutionsLimits } from '../../utils/LayersUtils';
import DefaultLayerTypeNode from './DefaultLayerTypeNode';
import DropNode from './DropNode';
import DragNode from './DragNode';

import { isSRSAllowed } from '../../utils/CoordinatesUtils';
import { VisualizationModes } from '../../utils/MapTypeUtils';

const getSourceCRS = (node) => node?.bbox?.crs || node?.sourceMetadata?.crs;
const isCRSCompatible = (node) => {
    const CRS = getSourceCRS(node);
    // Check if source crs is compatible
    return !isNil(CRS) ? isSRSAllowed(CRS) : true;
};
const getLayerErrorMessage = (node) => {
    if (node.loadingError === 'Error') {
        return { msgId: "toc.loadingerror" };
    }
    if (!isCRSCompatible(node)) {
        return {
            msgId: "toc.sourceCRSNotCompatible",
            msgParams: { sourceCRS: getSourceCRS(node) }
        };
    }
    return null;
};

const getLayerVisibilityWarningMessageId = (node, config = {}) => {
    if (config.visualizationMode === VisualizationModes._2D && ['3dtiles'].includes(node.type)) {
        return 'toc.notVisibleSwitchTo3D';
    }
    if (config.visualizationMode === VisualizationModes._3D && ['cog'].includes(node.type)) {
        return 'toc.notVisibleSwitchTo2D';
    }
    if (config.resolution !== undefined && !isInsideResolutionsLimits(node, config.resolution)) {
        const maxResolution = node.maxResolution || Infinity;
        return config.resolution >=  maxResolution
            ? 'toc.notVisibleZoomIn'
            : 'toc.notVisibleZoomOut';
    }
    if (node.loadingError === 'Warning') {
        return 'toc.toggleLayerVisibilityWarning';
    }
    return '';
};

const DefaultLayer = ({
    node: nodeProp,
    parentId,
    connectDragPreview = cmp => cmp,
    connectDragSource = cmp => cmp,
    index,
    sort,
    filter = () => true,
    filterText,
    replaceNodeOptions = node => node,
    onChange = () => {},
    onContextMenu = () => {},
    onSelect = () => {},
    getNodeStyle = () => {},
    getNodeClassName = () => '',
    parentMutuallyExclusive,
    nodeType,
    sortable,
    config,
    nodeToolItems = []
}) => {

    const node = replaceNodeOptions(nodeProp, nodeType);

    function handleOnChange(options) {
        onChange(node.id, nodeType, options, parentId);
    }

    function handleOnContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        onContextMenu(event, nodeProp, nodeType, parentId);
    }

    function handleOnSelect(event) {
        event.stopPropagation();
        event.preventDefault();
        onSelect(event, nodeProp, nodeType, parentId);
    }

    if (!filter(node, nodeType)) {
        return null;
    }
    const error = getLayerErrorMessage(node);
    const visibilityWarningMessageId = getLayerVisibilityWarningMessageId(node, config);
    const styleNodeProp = {
        ...nodeProp,
        error,
        visibilityWarningMessageId
    };
    const style = getNodeStyle(styleNodeProp, nodeType);
    const className = getNodeClassName(styleNodeProp, nodeType);
    return (
        connectDragPreview(
            <li className={`ms-node ms-node-layer${className ? ` ${className}` : ''}`} style={style} onContextMenu={handleOnContextMenu}>
                <DropNode
                    sortable={sortable}
                    sort={sort}
                    nodeType={nodeType}
                    index={index}
                    id={node.id}
                    parentId={parentId}
                >
                    <DefaultLayerTypeNode
                        node={node}
                        filterText={filterText}
                        onChange={handleOnChange}
                        parentMutuallyExclusive={parentMutuallyExclusive}
                        config={config}
                        nodeToolItems={nodeToolItems}
                        onSelect={handleOnSelect}
                        nodeType={nodeType}
                        error={error}
                        visibilityWarningMessageId={visibilityWarningMessageId}
                        sortHandler={
                            sortable ? connectDragSource(
                                <div className="grab-handle" onClick={(event) => event.stopPropagation()}>
                                    <Glyphicon glyph="grab-handle" />
                                </div>
                            ) : <div className="grab-handle disabled" />
                        }
                    />
                </DropNode>
            </li>
        )
    );
};

const DraggableDefaultLayer = (props) => <DragNode {...props} component={DefaultLayer}/>;

export default DraggableDefaultLayer;
