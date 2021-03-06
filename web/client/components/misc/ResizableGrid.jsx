/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const ReactDataGrid = require('react-data-grid');
/**
 * Component for rendering a feature grid.
 * @memberof components.ResizableGrid
 * @class
 * @prop {object[]} columns. The columns rendered in the header. Each object is composed by key,name,[reizable=true|false].
 * @prop {number} headerRowHeight the height in pixels of the rows in the header. Default 55
 * @prop {number} minHeight the min height of the grid container. Default 250
 * @prop {number} minWidth the min width of the grid container.
 * @prop {string} refGrid the reference to the react-data-grid-component
 * @prop {number} rowHeight the height of the rows in the grid. Default 30
 * @prop {string} rowKey the key used to distinguish rows.
 * @prop {object} rowSelection The object used to handle selection of rows. It puts a column of check as the first row.
 * @prop {object[]} rows. The features passed to the grid.
 * @prop {number} size. The size of the dock panel wrapping this component.
 *
 */
const ResizableGrid = React.createClass({
    propTypes: {
        columns: React.PropTypes.array.isRequired,
        headerRowHeight: React.PropTypes.number,
        minHeight: React.PropTypes.number.isRequired,
        minWidth: React.PropTypes.number,
        refGrid: React.PropTypes.string,
        rowHeight: React.PropTypes.number.isRequired,
        rowKey: React.PropTypes.string,
        rowSelection: React.PropTypes.object,
        rows: React.PropTypes.array.isRequired,
        size: React.PropTypes.object
    },
    contextTypes: {
        messages: React.PropTypes.object
    },
    getDefaultProps() {
        return {
            columns: [],
            headerRowHeight: 55,
            minHeight: 250,
            minWidth: null,
            refGrid: "grid",
            rowHeight: 30,
            rowKey: "id",
            rowSelection: null,
            rows: []
        };
    },
    getInitialState() {
        return {
            minHeight: this.props.minHeight,
            minWidth: this.props.minWidth
        };
    },
    componentWillReceiveProps(newProps) {
        if (this.props.size.width !== newProps.size.width ) {
            this.setState({
                minWidth: this.getWidth(this.refs.grid),
                minHeight: this.getHeight(this.refs.grid)}
            );
        }
        if (this.props.size.height !== newProps.size.height ) {
            this.setState({
                minHeight: this.getHeight(this.refs.grid)}
            );
        }
    },
    getHeight(element) {
        return element && element.getDataGridDOMNode().clientHeight || this.props.minHeight;
    },
    getWidth(element) {
        return element && element.getDataGridDOMNode().clientWidth || this.props.minWidth;
    },
    render() {
        return (
            <ReactDataGrid
                columns={this.props.columns}
                headerRowHeight={this.props.headerRowHeight}
                minHeight={this.state.minHeight || this.props.minHeight}
                minWidth={this.state.minWidth || this.props.minWidth}
                ref={this.props.refGrid}
                rowGetter={this.rowGetter}
                rowHeight={this.props.rowHeight}
                rowKey={this.props.rowKey}
                rowSelection={this.props.rowSelection}
                rowsCount={this.props.rows.length}
            />
        );
    },
    rowGetter(i) {
        return this.props.rows[i];
    }
});

module.exports = ResizableGrid;
