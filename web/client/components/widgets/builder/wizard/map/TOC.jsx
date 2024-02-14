/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from 'recompose';
import TOC from '../../../../TOC/TOC';
import handleNodePropertyChanges from './enhancers/handleNodePropertyChanges';

const enhanceTOC = compose(
    handleNodePropertyChanges
);

export default enhanceTOC(({
    onSelect,
    selectedNodes,
    updateMapEntries = () => {},
    map
} = {}) => <TOC
    map={map}
    selectedNodes={selectedNodes}
    onSelectNode={onSelect}
    onChangeMap={(newMap) => {
        updateMapEntries({
            layers: newMap?.layers,
            groups: newMap?.groups
        }, 'replace');
    }}
/>);
