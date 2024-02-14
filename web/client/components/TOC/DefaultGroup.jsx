
/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { cloneElement } from 'react';
import { Glyphicon } from 'react-bootstrap';
import DropNode from './DropNode';
import DragNode from './DragNode';
import VisibilityCheck from './fragments/VisibilityCheck';
import NodeHeader from './NodeHeader';
import NodeTool from './NodeTool';
import ExpandButton from './fragments/ExpandButton';

const DefaultGroup = ({
    node: nodeProp,
    parentId,
    children,
    connectDragPreview = cmp => cmp,
    connectDragSource = cmp => cmp,
    parentMutuallyExclusive,
    sortable,
    nodeType,
    ...props
}) => {

    const {
        sort,
        index,
        filter = () => true,
        replaceNodeOptions = (node) => node,
        filterText,
        onChange = () => {},
        onContextMenu = () => {},
        onSelect = () => {},
        getNodeStyle = () => {},
        getNodeClassName = () => '',
        nodeTypes,
        config,
        nodeToolItems = []
    } = props;

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
    const forceExpanded = config?.expanded !== undefined;
    const expanded = forceExpanded ? config?.expanded : node?.expanded;

    const style = getNodeStyle(nodeProp, nodeType);
    const className = getNodeClassName(nodeProp, nodeType);

    return (
        connectDragPreview(
            <li className={`ms-node ms-node-group${className ? ` ${className}` : ''}`} style={style} onContextMenu={handleOnContextMenu}>
                <DropNode
                    nodeType={nodeType}
                    index={index}
                    id={node.id}
                    parentId={parentId}
                    sort={sort}
                    sortable={sortable}
                >
                    <NodeHeader
                        node={node}
                        nodeType={nodeType}
                        currentLocale={config?.currentLocale}
                        tooltipOptions={config?.groupOptions?.tooltipOptions}
                        onClick={handleOnSelect}
                        showTitleTooltip={config?.showTitleTooltip}
                        beforeTitle={<>
                            {sortable ? connectDragSource(
                                <div className="grab-handle" onClick={(event) => event.stopPropagation()}>
                                    <Glyphicon glyph="grab-handle" />
                                </div>
                            ) : <div className="grab-handle disabled" />}
                            <ExpandButton
                                hide={!!forceExpanded}
                                expanded={expanded}
                                onChange={handleOnChange}
                                disabled={!!filterText}
                            />
                            <VisibilityCheck
                                hide={config?.hideVisibilityButton}
                                mutuallyExclusive={parentMutuallyExclusive}
                                value={node?.visibility}
                                onChange={(visibility) => {
                                    handleOnChange({ visibility });
                                }}
                            />
                            <Glyphicon glyph={expanded ? 'folder-open' : 'folder-close'} />
                        </>}
                        afterTitle={
                            <>
                                {node.error ? <NodeTool tooltipId="toc.loadingerror" glyph="exclamation-mark" /> : null}
                                {nodeToolItems.map(({ Component, name }) => {
                                    return (<Component key={name} itemComponent={NodeTool} node={node} onChange={onChange} />);
                                })}
                            </>
                        }
                    />
                </DropNode>
                {expanded ? <ul>
                    <DropNode
                        sortable={sortable}
                        sort={sort}
                        nodeType={nodeType}
                        index={index}
                        id={node.id}
                        position="before"
                        parentId={parentId}
                    >
                        <div style={{ display: 'flex', height: 8 }}></div>
                    </DropNode>
                    {node?.nodes?.map?.((childNode, _index) => cloneElement(children, {
                        ...props,
                        key: childNode.id,
                        node: childNode,
                        parentId: node.id,
                        index: _index,
                        parentMutuallyExclusive: node?.mutuallyExclusive,
                        onChange: (nodeId, _nodeType, options, nodeParentId) => {
                            if (nodeParentId === node?.id && options?.visibility !== undefined && node?.mutuallyExclusive) {
                                node.nodes.forEach((cNode) => {
                                    if (cNode.id !== nodeId) {
                                        onChange(cNode.id, cNode?.nodes ? nodeTypes.GROUP : nodeTypes.LAYER, {
                                            visibility: false
                                        });
                                    }
                                });
                                return onChange(nodeId, _nodeType, { ...options, visibility: true });
                            }
                            return onChange(nodeId, _nodeType, options);
                        }
                    }))}
                </ul> : null}
                <DropNode
                    sortable={sortable}
                    sort={sort}
                    nodeType={nodeType}
                    index={index}
                    id={node.id}
                    position="after"
                    parentId={parentId}
                >
                    <div style={{ display: 'flex', height: 8 }}></div>
                </DropNode>
            </li>
        )
    );
};

const DraggableDefaultGroup = (props) => <DragNode {...props} component={DefaultGroup} />;

export default DraggableDefaultGroup;
