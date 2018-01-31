/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {template, has} = require('lodash');

const validateVariable = (feature, variable) => {
    const path = variable.substring(2, variable.length - 1).trim();
    return has(feature, path);
};

const getEscapedTemplate = (layer, feature) => {
    const matchVariables = layer.featureInfo && layer.featureInfo.template && layer.featureInfo.template.match(/\$\{.*?\}/g);
    const replacedTag = matchVariables && matchVariables.map(temp => ({ previous: temp, next: validateVariable(feature, temp.replace(/(<([^>]+)>)/ig, '')) && temp.replace(/(<([^>]+)>)/ig, '') || ''})) || null;
    return replacedTag && replacedTag.reduce((temp, variable) => temp.replace(variable.previous, variable.next), layer.featureInfo.template) || layer.featureInfo && layer.featureInfo.template || '';
};

module.exports = ({layer = {}, response}) => {
    // remove all html tag from ${ }
    return (
        <div className="mapstore-custom-viewer">
            {response.features.map(feature => <div dangerouslySetInnerHTML={{__html: template(getEscapedTemplate(layer, feature))(feature)}}/>)}
        </div>
    );
};
