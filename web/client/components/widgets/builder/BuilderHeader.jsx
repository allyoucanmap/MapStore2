/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const { Button, Glyphicon } = require('react-bootstrap');


/**
 * Common header component for builder content. With close button and icon
 * @name  BuilderHeader
 * @memberof components.widgets.builder
 * @prop {function} onClose
 */
module.exports = ({onClose = () => {}, children} = {}) =>
    (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: 8
            }}>
            <Glyphicon glyph="stats" className="text-primary"/>
            <div
                style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0 4px'
                }}>
                {children}
            </div>
            <Button
                className="square-button-md no-border"
                onClick={() => onClose()}>
                <Glyphicon glyph="1-close"/>
            </Button>
        </div>
    );

/* module.exports = ({onClose = () => {}, children} = {}) =>
    (<div className="mapstore-flex-container">
        <div className="m-header bg-body widgets-builder-header">
            <Row>
                <Col md={12} className="text-center" style={{overflow: 'hidden', lineHeight: '52px'}}>
                    <Button onClick={() => onClose()} className="pull-left on-close-btn square-button no-border ">
                        <Glyphicon glyph="1-close"/>
                    </Button>
                    <span style={{padding: '50px 0 0 0', fontSize: 16}}><Message msgId="widgets.builder.header.title" /></span>
                    {<div style={{display: "flex"}} className="square-button pull-right no-border">
                        <Glyphicon glyph="stats" className="text-primary"/>
                    </div>}
                </Col>
            </Row>
            <Row className="text-center">
                <div className="m-padding-md">
                    {children}
                </div>
            </Row>
        </div>
    </div>
    );*/
