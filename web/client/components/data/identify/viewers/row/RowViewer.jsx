/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { isString } from 'lodash';
import PropertiesViewer from './PropertiesViewer';
import { getRowViewer } from '../../../../../utils/MapInfoUtils';

function RowViewer({
    layer,
    rowViewer,
    feature
}) {
    // the name of the registered viewer could be associate by a string in the rowViewer or id
    const layerRowViewerProperty = layer?.rowViewer || layer?.layerId;
    const layerRowViewer = layerRowViewerProperty && (isString(layerRowViewerProperty) ? getRowViewer(layerRowViewerProperty) : layerRowViewerProperty);
    const Row = layerRowViewer || rowViewer || PropertiesViewer;
    return <Row feature={feature} title={feature.id + ''} exclude={['bbox']} {...feature.properties}/>;
}

export default RowViewer;
