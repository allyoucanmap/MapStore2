/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const ChartWidget = require('../../widgets/widget/ChartWidget');
const {Grid, Row, Col} = require('react-bootstrap');

module.exports = ({
    features = []
}) => {
    return (
        <Grid fluid style={{paddingBottom: 15}}>
            {features.map(feature => {
                return (
                    <Row>
                        <Col xs={12}>
                            <h5>{feature.id}</h5>
                        </Col>
                        <Col xs={12}>
                            <ChartWidget />
                        </Col>
                        <Col xs={12}>
                            <hr/>
                        </Col>
                    </Row>
                );
            })}
        </Grid>
    );
};
