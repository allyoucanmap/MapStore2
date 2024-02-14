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
            <ItemComponent
                {...props}
                labelId={'toc.toolGroupMutuallyExclusive'}
                glyph={selected?.node?.mutuallyExclusive ? 'checkbox-on' : 'radio-on'}
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
        );
    }
    return null;
});

export default GroupOptionsButton;

