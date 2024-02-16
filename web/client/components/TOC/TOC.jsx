/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import LayersTree from './LayersTree';
import {
    NodeTypes,
    denormalizeGroups,
    splitMapAndLayers,
    sortGroups,
    changeNodeConfiguration
} from '../../utils/LayersUtils';
import { selectedNodesIdsToObject } from '../../utils/TOCUtils';
import {
    saveMapConfiguration
} from '../../utils/MapUtils';
import './css/toc.css';

export function ControlledTOC({
    tree,
    contextMenu,
    onSort = () => {},
    onChange = () => {},
    onSelectNode = () => {},
    onContextMenu = () => {},
    groupNodeComponent,
    layerNodeComponent,
    filterText,
    selectedNodes,
    rootGroupId,
    nodeTypes = NodeTypes,
    config,
    className,
    nodeItems,
    nodeToolItems,
    singleDefaultGroup,
    theme
}) {
    return (
        <LayersTree
            className={className}
            theme={theme}
            tree={tree}
            filterText={filterText}
            onSort={onSort}
            onChange={onChange}
            groupNodeComponent={groupNodeComponent}
            layerNodeComponent={layerNodeComponent}
            contextMenu={contextMenu}
            onContextMenu={onContextMenu}
            selectedNodes={selectedNodes}
            onSelect={(event, currentNode, nodeType) => {
                onSelectNode(currentNode.id, nodeType === nodeTypes.GROUP ? 'group' : 'layer', event?.ctrlKey);
            }}
            nodeTypes={nodeTypes}
            rootGroupId={rootGroupId}
            config={config}
            nodeItems={nodeItems}
            nodeToolItems={nodeToolItems}
            singleDefaultGroup={singleDefaultGroup}
        />
    );
}

function TOC({
    map,
    onChangeMap = () => {},
    selectedNodes = [],
    onSelectNode = () => {},
    config,
    className,
    nodeToolItems,
    singleDefaultGroup,
    nodeItems,
    theme
}) {
    const { layers } = splitMapAndLayers(map) || {};
    const tree = denormalizeGroups(layers.flat || [], layers.groups || []).groups;
    function handleOnChange(currentLayers, currentGroups) {
        const mapConfig = saveMapConfiguration(map, currentLayers || layers.flat, currentGroups || layers.groups, []);
        const newMap = {
            ...map,
            layers: mapConfig?.map?.layers,
            groups: mapConfig?.map?.groups
        };
        onChangeMap(newMap);
    }
    function handleOnSort(nodeId, groupId, index) {
        const sortedGroups = sortGroups({
            groups: layers.groups,
            layers: layers.flat
        }, {
            node: nodeId,
            index,
            groupId
        });
        if (sortedGroups) {
            handleOnChange(sortedGroups.layers, sortedGroups.groups);
        }
    }
    function handleUpdateNode(nodeId, nodeType, options) {
        const updatedNode = changeNodeConfiguration({
            groups: layers.groups,
            layers: layers.flat
        }, {
            node: nodeId,
            nodeType,
            options
        });
        handleOnChange(updatedNode.layers, updatedNode.groups);
    }
    return (
        <ControlledTOC
            className={className}
            theme={theme}
            tree={tree}
            selectedNodes={selectedNodesIdsToObject(selectedNodes, layers.flat, tree)}
            onSelectNode={onSelectNode}
            onSort={handleOnSort}
            onChange={handleUpdateNode}
            config={config}
            nodeItems={nodeItems}
            nodeToolItems={nodeToolItems}
            singleDefaultGroup={singleDefaultGroup}
        />
    );
}

export default TOC;
