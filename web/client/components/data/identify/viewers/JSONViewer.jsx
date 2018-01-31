/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const Viewers = {
    CUSTOM: require('./CustomViewer'),
    PROPERTIES: require('./PropertiesViewer')
};

module.exports = props => {
    const type = props.layer.featureInfo && props.layer.featureInfo.format && props.layer.featureInfo.format || 'PROPERTIES';
    const Viewer = Viewers[type] || Viewers.PROPERTIES;
    return <Viewer {...props}/>;
};
