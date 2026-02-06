/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root dir
 ectory of this source tree.
 */

import React, { useContext } from 'react';

import ConfigUtils from '../../utils/ConfigUtils';
import { DocumentContext } from '../../contexts/DocumentContext';


const withContainer = (Component) => {
    return (props) => {
        const doc = useContext(DocumentContext);
        return <Component {...props} container={doc.querySelector('.' + (ConfigUtils.getConfigProp('themePrefix') || 'ms2') + " > div") || doc.body}/>;
    };
};

export default withContainer;
