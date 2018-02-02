/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {template, has} = require('lodash');
const HtmlRenderer = require('../../../misc/HtmlRenderer');
const {Row, Col, Grid} = require('react-bootstrap');

const validateVariable = (feature, variable) => {
    const path = variable.substring(2, variable.length - 1).trim();
    return has(feature, path);
};

const getEscapedTemplate = (layer, feature) => {
    const matchVariables = layer.featureInfo && layer.featureInfo.template && layer.featureInfo.template.match(/\$\{.*?\}/g);
    const replacedTag = matchVariables && matchVariables.map(temp => ({ previous: temp, next: validateVariable(feature, temp.replace(/(<([^>]+)>)/ig, '')) && temp.replace(/(<([^>]+)>)/ig, '') || ''})) || null;
    return replacedTag && replacedTag.reduce((temp, variable) => temp.replace(variable.previous, variable.next), layer.featureInfo.template) || layer.featureInfo && layer.featureInfo.template || '';
};

module.exports = ({layer = {}, response}) => (
    <Grid fluid>
    {response.features.map(feature =>
        <Row xs={12}>
            <Col xs={12}>
                <HtmlRenderer html={template(getEscapedTemplate(layer, feature))(feature)}/>
            </Col>
            <Col xs={12}>
                <hr/>
            </Col>
        </Row>
    )}
    </Grid>
);
