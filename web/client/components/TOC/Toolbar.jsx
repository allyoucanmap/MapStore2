/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TableOfContentItemButton from './TableOfContentItemButton';
import { NodeTypes, ROOT_GROUP_ID, DEFAULT_GROUP_ID } from '../../utils/LayersUtils';
import { StatusTypes } from '../../utils/TOCUtils';

function Toolbar({
    items = [],
    selectedNodes,
    buttonProps = {
        className: 'toc-toolbar-button',
        bsStyle: 'primary'
    },
    nodeTypes = NodeTypes,
    rootGroupId = ROOT_GROUP_ID,
    defaultGroupId = DEFAULT_GROUP_ID,
    statusTypes = StatusTypes,
    config
}) {
    const selectedGroups = selectedNodes.filter((node) => node.type === nodeTypes.GROUP).map(({ node }) => node);
    const selectedLayers = selectedNodes.filter((node) => node.type === nodeTypes.LAYER).map(({ node }) => node);
    function getSelectedNodesStatus() {
        if (!selectedNodes?.length) {
            return statusTypes.DESELECT;
        }
        if (selectedNodes?.length === 1) {
            return selectedGroups?.length === 1 ? statusTypes.GROUP : statusTypes.LAYER;
        }
        if (!!selectedGroups?.length && !!selectedLayers?.length) {
            return statusTypes.BOTH;
        }
        return !!selectedGroups?.length ? statusTypes.GROUPS : statusTypes.LAYERS;
    }

    const status = getSelectedNodesStatus();

    return (
        <div className="ms-toc-toolbar">
            {items
                .filter(({ selector = () => true }) => selector({
                    status,
                    selectedLayers,
                    selectedGroups,
                    selectedNodes,
                    statusTypes
                })) // filter items that should not show
                .map(({ Component, name }, i) => {
                    return (
                        <Component
                            key={name ?? `item-${i}`}
                            buttonProps={buttonProps}
                            selectedLayers={selectedLayers}
                            selectedGroups={selectedGroups}
                            selectedNodes={selectedNodes}
                            status={status}
                            statusTypes={statusTypes}
                            nodeTypes={nodeTypes}
                            rootGroupId={rootGroupId}
                            defaultGroupId={defaultGroupId}
                            itemComponent={TableOfContentItemButton}
                            config={config}
                        />
                    );
                })}
        </div>
    );
}

export default Toolbar;
