/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import draggableComponent from './enhancers/draggableComponent';
import GroupChildren from './fragments/GroupChildren';
import SideCard from '../misc/cardgrids/SideCard';
import { getTitleAndTooltip } from '../../utils/TOCUtils';
import Toolbar from '../misc/toolbar/Toolbar';
import { Glyphicon as GlyphiconRB } from 'react-bootstrap';
import tooltip from '../misc/enhancers/tooltip';

const Glyphicon = tooltip(GlyphiconRB);

function GroupNode({
    node = {},
    level,
    filter,
    onSort = () => {},
    onError = () => {},
    setDndState = () => {},
    onSelect = () => {},
    currentLocale,
    tooltipOptions,
    selectedNodes = [],
    onToggle = () => {},
    propertiesChangeHandler = () => {},
    isDraggable,
    isDragging,
    isOver,
    children,
    connectDragPreview = cmp => cmp,
    connectDropTarget = cmp => cmp,
    connectDragSource = cmp => cmp,
    filterText
}) {

    const { title } = getTitleAndTooltip({  node, currentLocale, tooltipOptions });
    const selected = selectedNodes.find((s) => s === node.id) ? true : false;
    const expanded = node.expanded !== undefined ? node.expanded : true;
    const visibility = node.visibility;

    const selectedClass = selected ? ' ms-toc-node-selected' : '';
    const draggableClass = isDraggable && ' ms-draggable' || '';
    const draggingClass = isDragging && ' ms-dragging' || '';
    const overClass = isOver && ' ms-over' || '';

    const error = visibility && node.loadingError ? true : false;

    const nodeIndicators = (node.indicators || [])
        .map((indicator, idx) => {
            if (indicator.type === 'dimension') {
                return find(node && node.dimensions || [], indicator.condition);
            }
            if (indicator.glyph) {
                return (
                    <div key={idx} className="ms-toc-node-indicator">
                        <Glyphicon key={indicator.key} glyph={indicator.glyph} { ...indicator.props } />
                    </div>);
            }
            return null;
        });

    const indicatorsComponents = [
        ...nodeIndicators,
        (error)
            && visibility &&
                <div
                    key="error-indicator"
                    className="ms-toc-node-indicator ms-danger-indicator">
                    <Glyphicon
                        tooltipId="toc.loadingerror"
                        glyph="exclamation-mark"/>
                </div>
    ].filter(val => val);

    const indicatorClass = indicatorsComponents.length > 0 ? ' with-indicators' : '';

    const card = (<div style={{ position: 'relative' }}>
        <SideCard
            size="sm"
            preview={<Glyphicon glyph={expanded ? 'folder-open' : 'folder-close'}/>}
            className={`ms-toc-group${draggableClass}${draggingClass}${overClass}${selectedClass}${indicatorClass}`}
            title={title}
            onClick={(properties, event) => {
                event.stopPropagation();
                if (onSelect) { onSelect(node.id, 'layer', event.ctrlKey); }
            }}
            headTools={
                <Toolbar
                    btnDefaultProps={selected
                        ? {
                            className: 'square-button-md',
                            bsStyle: 'primary'
                        }
                        : {
                            className: 'square-button-md no-border',
                            bsStyle: 'default'
                        }}
                    buttons={[
                        {
                            glyph: expanded ? 'collapse-down' : 'expand',
                            visible: !filterText,
                            // tooltipId: 'toc.toggleLayerVisibility',
                            onClick: (event) => {
                                event.stopPropagation();
                                onToggle(node.id, expanded);
                            }
                        }
                    ]}/>
            }
            body={indicatorsComponents.length > 0
                && <div className="ms-toc-node-indicators">
                    {indicatorsComponents}
                </div>}
            tools={
                <Toolbar
                    btnDefaultProps={selected
                        ? {
                            className: 'square-button-md',
                            bsStyle: 'primary'
                        }
                        : {
                            className: 'square-button-md no-border',
                            bsStyle: 'default'
                        }}
                    buttons={[
                        {
                            glyph: visibility ? 'eye-open' : 'eye-close',
                            tooltipId: 'toc.toggleLayerVisibility',
                            onClick: (event) => {
                                event.stopPropagation();
                                propertiesChangeHandler(node.id, { visibility: !visibility });
                            }
                        }
                    ]}/>
            }/></div>);
    return (
        <>
            {connectDragPreview(connectDropTarget(isDraggable ? connectDragSource(card) : card))}
            {expanded && !isDragging
                ? <div className="ms-toc-children-container">
                    <GroupChildren
                        node={node}
                        filter={filter}
                        onSort={onSort}
                        level={level + 1}
                        onSort={onSort}
                        onError={onError}
                        setDndState={setDndState}
                        position="collapsible">
                        {children}
                    </GroupChildren>
                </div>
                : null}
        </>
    );
}

export default draggableComponent('LayerOrGroup', class extends Component { render() { return <GroupNode {...this.props}/>; }});
/*
const React = require('react');
const Node = require('./Node');
const PropTypes = require('prop-types');
const draggableComponent = require('./enhancers/draggableComponent');
const GroupTitle = require('./fragments/GroupTitle');
const GroupChildren = require('./fragments/GroupChildren');
const VisibilityCheck = require('./fragments/VisibilityCheck');
const LayersTool = require('./fragments/LayersTool');

class DefaultGroup extends React.Component {
    static propTypes = {
        node: PropTypes.object,
        style: PropTypes.object,
        sortableStyle: PropTypes.object,
        onToggle: PropTypes.func,
        level: PropTypes.number,
        onSort: PropTypes.func,
        onError: PropTypes.func,
        propertiesChangeHandler: PropTypes.func,
        groupVisibilityCheckbox: PropTypes.bool,
        visibilityCheckType: PropTypes.string,
        currentLocale: PropTypes.string,
        selectedNodes: PropTypes.array,
        onSelect: PropTypes.func,
        titleTooltip: PropTypes.bool,
        tooltipOptions: PropTypes.object,
        setDndState: PropTypes.func,
        connectDragSource: PropTypes.func,
        connectDragPreview: PropTypes.func,
        connectDropTarget: PropTypes.func,
        isDraggable: PropTypes.bool,
        isDragging: PropTypes.bool,
        isOver: PropTypes.bool
    };

    static defaultProps = {
        node: {},
        onToggle: () => {},
        style: {
            marginBottom: "16px",
            cursor: "pointer"
        },
        sortableStyle: {},
        propertiesChangeHandler: () => {},
        groupVisibilityCheckbox: false,
        visibilityCheckType: "glyph",
        level: 1,
        currentLocale: 'en-US',
        joinStr: ' - ',
        selectedNodes: [],
        onSelect: () => {},
        titleTooltip: false,
        connectDragPreview: (x) => x,
        connectDragSource: (x) => x,
        connectDropTarget: (x) => x,
        isDraggable: false,
        isDragging: false,
        isOver: false
    };

    renderVisibility = (error) => {
        return this.props.groupVisibilityCheckbox && !error ?
            (<VisibilityCheck
                node={this.props.node}
                key="visibility"
                tooltip="toc.toggleGroupVisibility"
                checkType={this.props.visibilityCheckType}
                propertiesChangeHandler={this.props.propertiesChangeHandler}/>)
            :
            (<LayersTool key="loadingerror"
                glyph="exclamation-mark text-danger"
                tooltip="toc.loadingerror"
                className="toc-error"/>);
    }

    render() {
        let {children, onToggle, connectDragPreview, connectDragSource, connectDropTarget, ...other } = this.props;
        const selected = this.props.selectedNodes.filter((s) => s === this.props.node.id).length > 0 ? ' selected' : '';
        const error = this.props.node.loadingError ? ' group-error' : '';
        const grab = other.isDraggable ? <LayersTool key="grabTool" tooltip="toc.grabGroupIcon" className="toc-grab" ref="target" glyph="menu-hamburger"/> : <span className="toc-layer-tool toc-grab"/>;
        const groupHead = (
            <div className="toc-default-group-head">
                {grab}
                {this.renderVisibility(error)}
                <GroupTitle
                    tooltipOptions={this.props.tooltipOptions}
                    tooltip={this.props.titleTooltip}
                    node={this.props.node}
                    currentLocale={this.props.currentLocale}
                    onClick={this.props.onToggle}
                    onSelect={this.props.onSelect}
                />
            </div>
        );
        const groupChildren = (
            <GroupChildren
                level={this.props.level + 1}
                onSort={this.props.onSort}
                onError={this.props.onError}
                setDndState={this.props.setDndState}
                position="collapsible">
                {this.props.children}
            </GroupChildren>
        );

        if (this.props.node.showComponent && !this.props.node.hide) {
            return (
                <Node className={(this.props.isDragging || this.props.node.placeholder ? "is-placeholder " : "") + "toc-default-group toc-group-" + this.props.level + selected + error} sortableStyle={this.props.sortableStyle} style={this.props.style} type="group" {...other}>
                    {connectDragPreview(connectDropTarget(this.props.isDraggable ? connectDragSource(groupHead) : groupHead))}
                    {this.props.isDragging || this.props.node.placeholder ? null : groupChildren}
                </Node>
            );
        }
        return null;
    }
}

module.exports = draggableComponent('LayerOrGroup', DefaultGroup);
*/
