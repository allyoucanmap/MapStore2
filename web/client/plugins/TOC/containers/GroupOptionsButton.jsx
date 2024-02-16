/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import { connect } from 'react-redux';
import {
    updateNode
} from '../../../actions/layers';

const getFlatNodes = (selected) => {
    return [
        ...(selected?.id ? [ selected ] : []),
        ...(selected?.mutuallyExclusive ? [] : (selected?.nodes || [])).map(getFlatNodes).flat()
    ];
};

const GroupOptionsButton = connect(() => ({}), {
    onChange: updateNode
})(({
    status,
    onChange,
    itemComponent,
    selectedNodes,
    statusTypes,
    nodeTypes,
    ...props
}) => {

    const ItemComponent = itemComponent;
    if ([statusTypes.GROUP].includes(status)) {
        const selected = selectedNodes?.[0];
        return (
            <>
                {!selected?.node?.mutuallyExclusive && <ItemComponent
                    {...props}
                    labelId={'toc.toolGroupShowAllChildren'}
                    glyph={'checkbox-on'}
                    onClick={() => {
                        const nodes = getFlatNodes({ ...selected?.node, id: null });
                        nodes.forEach((node) => {
                            onChange(node?.id, node?.nodes ? nodeTypes.GROUP : nodeTypes.LAYER, {
                                visibility: true
                            });
                        });
                    }}
                />}
                {!selected?.node?.mutuallyExclusive && <ItemComponent
                    {...props}
                    labelId={'toc.toolGroupHideAllChildren'}
                    glyph={'checkbox-off'}
                    onClick={() => {
                        const nodes = getFlatNodes({ ...selected?.node, id: null });
                        nodes.forEach((node) => {
                            onChange(node?.id, node?.nodes ? nodeTypes.GROUP : nodeTypes.LAYER, {
                                visibility: false
                            });
                        });
                    }}
                />}
                <ItemComponent
                    {...props}
                    labelId={selected?.node?.mutuallyExclusive ? 'toc.deactivateToolGroupMutuallyExclusive' : 'toc.activateToolGroupMutuallyExclusive'}
                    glyph={selected?.node?.mutuallyExclusive ? 'radio-on' : 'radio-off'}
                    onClick={() => {
                        const mutuallyExclusive = !selected?.node?.mutuallyExclusive;
                        if (mutuallyExclusive && selected?.node?.nodes) {
                            selected.node.nodes.forEach((node) => {
                                onChange(node?.id, node?.nodes ? nodeTypes.GROUP : nodeTypes.LAYER, {
                                    visibility: false
                                });
                            });
                        }
                        onChange(selected?.id, selected?.type, {
                            mutuallyExclusive
                        });
                    }}
                />
            </>
        );
    }
    return null;
});

export default GroupOptionsButton;

