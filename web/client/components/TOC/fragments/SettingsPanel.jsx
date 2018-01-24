/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const Dock = require('react-dock').default;
const BorderLayout = require('../../layout/BorderLayout');
const {Button, Glyphicon, Grid, Row, Col} = require('react-bootstrap');

class SettingsPanel extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        open: PropTypes.bool,
        header: PropTypes.array,
        footer: PropTypes.node,
        title: PropTypes.node,
        glyph: PropTypes.string,
        width: PropTypes.number,
        onClose: PropTypes.func
    };

    static defaultProps = {
        className: '',
        open: false,
        header: [],
        title: '',
        glyph: '',
        width: 500,
        onClose: () => {}
    };

    renderHader() {
        return (
            <Grid fluid style={{width: '100%'}} className="ms-header">
                <Row>
                    <Col xs={2}>
                        <Button className="square-button" onClick={this.props.onClose}>
                            <Glyphicon glyph="1-close"/>
                        </Button>
                    </Col>
                    <Col xs={8}>
                        <h4>{this.props.title}</h4>
                    </Col>
                    <Col xs={2}>
                        <Button className="square-button" style={{pointerEvents: 'none'}}>
                            <Glyphicon glyph={this.props.glyph}/>
                        </Button>
                    </Col>
                </Row>
                {this.props.header}
            </Grid>
        );
    }

    render() {
        return (
            <span
                className={'ms-side-panel ' + this.props.className}>
                <Dock
                    position={'left'}
                    fluid={false}
                    dimMode="none"
                    isVisible={this.props.open}
                    size={this.props.width}
                    dockStyle={{height: 'calc(100% - 30px)'}}
                    zIndex={1030}>
                    <BorderLayout
                        header={this.renderHader()}
                        footer={this.props.footer}>
                        {this.props.children}
                    </BorderLayout>
                </Dock>
            </span>
        );
    }
}

module.exports = SettingsPanel;
