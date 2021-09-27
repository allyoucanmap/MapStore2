/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isString, capitalize } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { containsHTML } from '../../../../../utils/StringUtils';

const alwaysExcluded = ['title'];

class PropertiesViewer extends React.Component {
    static displayName = 'PropertiesViewer';

    static propTypes = {
        title: PropTypes.string,
        exclude: PropTypes.array,
        include: PropTypes.array,
        titleStyle: PropTypes.object,
        listStyle: PropTypes.object,
        componentStyle: PropTypes.object,
        properties: PropTypes.object
    };

    static defaultProps = {
        exclude: [],
        titleStyle: {},
        listStyle: {},
        componentStyle: {}
    };

    getBodyItems = () => {
        return Object.keys(this.props.properties || {})
            .filter(this.props?.include?.length > 0 ? this.toInclude : this.toExclude)
            .map((key) => {
                const val = this.renderProperty(this.props.properties[key]);
                return (
                    <li
                        key={key}
                        style={this.props.listStyle}>
                        <div><strong>{capitalize(key)}</strong></div>
                        {containsHTML(val) ? <div dangerouslySetInnerHTML={{__html: val}}/> : <div>{val}</div>}
                    </li>);
            });
    };

    renderHeader = () => {
        if (!this.props.title) {
            return null;
        }
        return (
            <div
                key={this.props.title}
                style={this.props.titleStyle}
                className="ms-properties-viewer-title">
                <div><strong>Title</strong></div>
                <div>{this.props.title}</div>
            </div>
        );
    };

    renderBody = () => {
        const items = this.getBodyItems();
        if (items.length === 0) {
            return null;
        }
        return (
            <ul
                className="ms-properties-viewer-body">
                {items}
            </ul>
        );
    };

    renderProperty = (prop) => {
        if (isString(prop)) {
            return prop;
        }
        return JSON.stringify(prop);
    };

    render() {
        return (
            <div
                className="ms-properties-viewer"
                style={this.props.componentStyle}>
                {this.renderHeader()}
                {this.renderBody()}
            </div>
        );
    }

    toExclude = (propName) => {
        return alwaysExcluded
            .concat(this.props.exclude)
            .indexOf(propName) === -1;
    };

    toInclude = () => {
        return this.props.include
            .indexOf(propName) !== -1;
    };
}

export default PropertiesViewer;
