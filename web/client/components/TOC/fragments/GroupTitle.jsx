/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const StatusIcon = require('./StatusIcon');
const {isObject} = require('lodash');

class GroupTitle extends React.Component {
    static propTypes = {
        node: PropTypes.object,
        onClick: PropTypes.func,
        onSelect: PropTypes.func,
        style: PropTypes.object,
        currentLocale: PropTypes.string
    };

    static inheritedPropTypes = ['node'];

    static defaultProps = {
        onClick: () => {},
        onSelect: null,
        currentLocale: 'en-US',
        style: {

        }
    };

    render() {
        let expanded = this.props.node.expanded !== undefined ? this.props.node.expanded : true;
        const groupTitle = isObject(this.props.node.title) ? this.props.node.title[this.props.currentLocale] || this.props.node.title.default || this.props.node.name : this.props.node.title || this.props.node.name;
        return (
            <div style={this.props.style}>
                <span className="toc-group-title" onClick={ this.props.onSelect ? (e) => this.props.onSelect(this.props.node.id, 'group', e.ctrlKey) : () => {}}>{groupTitle}</span><StatusIcon onClick={() => this.props.onClick(this.props.node.id, expanded)} expanded={expanded} node={this.props.node}/>
            </div>
        );
    }
}

module.exports = GroupTitle;
