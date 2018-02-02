/*
 * Copyright 2018, GeoSolutions Sas.
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
const {withState} = require('recompose');

const fullscreenGlyph = {
    bottom: {
        true: 'chevron-down',
        false: 'chevron-up'
    },
    top: {
        true: 'chevron-up',
        false: 'chevron-down'
    },
    right: {
        true: 'chevron-right',
        false: 'chevron-left'
    },
    left: {
        true: 'chevron-left',
        false: 'chevron-right'
    }
};

class DockPanel extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        open: PropTypes.bool,
        header: PropTypes.array,
        footer: PropTypes.node,
        title: PropTypes.node,
        glyph: PropTypes.string,
        size: PropTypes.number,
        onClose: PropTypes.func,
        bsStyle: PropTypes.string,
        position: PropTypes.string,
        showFullscreen: PropTypes.bool,
        fluid: PropTypes.bool,
        onFullscreen: PropTypes.func,
        fullscreen: PropTypes.bool
    };

    static defaultProps = {
        className: '',
        open: false,
        header: [],
        title: '',
        glyph: '',
        size: 500,
        onClose: () => {},
        bsStyle: 'default',
        position: 'left',
        showFullscreen: false,
        onFullscreen: () => {},
        fullscreen: false
    };

    getHeaderButton() {
        const close = (
            <Button key="ms-header-close" className="square-button ms-close" onClick={this.props.onClose} bsStyle={this.props.bsStyle}>
                <Glyphicon glyph="1-close"/>
            </Button>
        );
        const glyph = (
            <Button
                key="ms-header-glyph"
                className="square-button"
                style={{pointerEvents: this.props.showFullscreen ? 'auto' : 'none'}}
                bsStyle={this.props.bsStyle}
                onClick={this.props.showFullscreen ? () => this.props.onFullscreen(!this.props.fullscreen) : () => {}}>
                <Glyphicon glyph={this.props.showFullscreen ? fullscreenGlyph[this.props.position] && fullscreenGlyph[this.props.position][this.props.fullscreen] || 'resize-full' : this.props.glyph}/>
            </Button>
        );
        return this.props.position === 'left' ? [close, glyph] : [glyph, close];
    }

    renderHader() {
        const buttons = this.getHeaderButton();
        return (
            <Grid fluid style={{width: '100%'}} className={'ms-header ms-' + this.props.bsStyle}>
                <Row>
                    <Col xs={2}>
                        {buttons[0]}
                    </Col>
                    <Col xs={8}>
                        <h4>{this.props.title}</h4>
                    </Col>
                    <Col xs={2}>
                        {buttons[1]}
                    </Col>
                </Row>
                {this.props.header}
            </Grid>
        );
    }

    render() {
        return (
            <span className={'ms-side-panel ' + this.props.className}>
                <Dock
                    fluid={this.props.fluid || this.props.fullscreen}
                    position={this.props.position}
                    dimMode="none"
                    isVisible={this.props.open}
                    size={this.props.fullscreen ? 1 : this.props.size}
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

module.exports = withState('fullscreen', 'onFullscreen', false)(DockPanel);
