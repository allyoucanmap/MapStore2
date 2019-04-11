/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const {
    Popover,
    OverlayTrigger
} = require('react-bootstrap');

class ToolbarPopover extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        placement: PropTypes.string,
        container: PropTypes.node,
        title: PropTypes.node,
        content: PropTypes.node
    };

    static defaultProps = {
        id: ''
    };

    state = {};

    render() {
        return (
            <div>
                <OverlayTrigger
                    ref={trigger => { this.trigger = trigger; }}
                    trigger={['click']}
                    container={this.props.container}
                    placement={this.props.placement}
                    rootClose
                    overlay={
                        <Popover
                            id={this.props.id}
                            title={this.props.title}>
                            {this.props.content}
                        </Popover>}>
                        {this.props.children}
                </OverlayTrigger>
            </div>
        );
    }
}

module.exports = ToolbarPopover;