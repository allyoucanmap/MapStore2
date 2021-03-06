/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PaginationButton = require('./PaginationButton');

const PreviewList = React.createClass({
    propTypes: {
        bottom: React.PropTypes.number,
        width: React.PropTypes.number,
        height: React.PropTypes.number,
        length: React.PropTypes.number,
        start: React.PropTypes.number,
        pagination: React.PropTypes.bool,
        vertical: React.PropTypes.bool,
        icons: React.PropTypes.array,
        onStartChange: React.PropTypes.func
    },
    getDefaultProps() {
        return {
            bottom: 0,
            width: 0,
            height: 0,
            length: 0,
            start: 0,
            pagination: false,
            vertical: false,
            icons: [],
            onStartChange: () => {}
        };
    },
    render() {
        let iconButtons = [].concat(this.props.icons);
        iconButtons = iconButtons.slice(this.props.start, this.props.start + this.props.length);
        if (this.props.pagination) {
            if (this.props.start !== 0) {
                iconButtons.unshift(<PaginationButton key="pagination_0" vertical={this.props.vertical} side={this.props.vertical ? this.props.width : this.props.height} direction={false} onClick={ () => { this.props.onStartChange(this.props.start - 1); }} />);
            }
            if (this.props.start + this.props.length !== this.props.icons.length) {
                iconButtons.push(<PaginationButton key="pagination_1" vertical={this.props.vertical} side={this.props.vertical ? this.props.width : this.props.height} direction={true} onClick={ () => { this.props.onStartChange(this.props.start + 1); } } />);
            }
        }
        const style = this.props.vertical ? { height: this.props.pagination ? this.props.height + 50 : this.props.height, width: this.props.width, bottom: this.props.bottom} : { height: this.props.height, width: this.props.pagination ? this.props.width + 50 : this.props.width, bottom: this.props.bottom};
        return (
            <div style={style}>
                {iconButtons}
            </div>
        );
    }
});

module.exports = PreviewList;
