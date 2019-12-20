/*
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
/*
const React = require('react');
const PropTypes = require('prop-types');
const Node = require('./Node');

const { isObject, castArray, find} = require('lodash');
const { Grid, Row, Col, Glyphicon} = require('react-bootstrap');
const draggableComponent = require('./enhancers/draggableComponent');
const VisibilityCheck = require('./fragments/VisibilityCheck');
const Title = require('./fragments/Title');
const WMSLegend = require('./fragments/WMSLegend');
const LayersTool = require('./fragments/LayersTool');
const OpacitySlider = require('./fragments/OpacitySlider');
const ToggleFilter = require('./fragments/ToggleFilter');
const withTooltip = require('../data/featuregrid/enhancers/withTooltip');
const localizedProps = require('../misc/enhancers/localizedProps');

const GlyphIndicator = localizedProps('tooltip')(withTooltip(Glyphicon));
*/
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Highlighter from 'react-highlight-words';
import castArray from 'lodash/castArray';
import find from 'lodash/find';
import { Glyphicon as GlyphiconRB } from 'react-bootstrap';
import tooltip from '../misc/enhancers/tooltip';
import SideCard from '../misc/cardgrids/SideCard';
import Toolbar from '../misc/toolbar/Toolbar';
import WMSLegend from './fragments/WMSLegend';
import OpacitySlider from './fragments/OpacitySlider';
import draggableComponent from './enhancers/draggableComponent';
import { getTitleAndTooltip } from '../../utils/TOCUtils';

const Glyphicon = tooltip(GlyphiconRB);

function LayerNode({
    node = {},
    filter = () => true,
    connectDragSource = (cmp) => cmp,
    connectDropTarget = (cmp) => cmp,
    currentZoomLvl,
    scales,
    legendOptions,
    onUpdateNode = () => {},
    propertiesChangeHandler = () => {},
    isDraggable,
    isDragging,
    isOver,
    filterText,
    selectedNodes = [],
    onSelect = () => {},
    currentLocale,
    tooltipOptions,
    buttons = [],
    indicators = []
}) {

    const visibility = node.visibility;
    const selected = selectedNodes.find((s) => s === node.id) ? true : false;

    const errorClass = visibility && node.loadingError === 'Error' ? ' ms-node-error' : '';
    const warningClass = visibility && node.loadingError === 'Warning' ? ' ms-node-warning' : '';
    const draggableClass = isDraggable && ' ms-draggable' || '';
    const draggingClass = isDragging && ' ms-dragging' || '';
    const overClass = isOver && ' ms-over' || '';
    const selectedClass = selected ? ' ms-toc-node-selected' : '';

    const { title } = getTitleAndTooltip({ node, currentLocale, tooltipOptions });

    const nodeIndicators = [ ...castArray(indicators),  ...(node.indicators || []) ]
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
        (errorClass || warningClass)
            && visibility &&
                <div
                    key="error-indicator"
                    className={`ms-toc-node-indicator${warningClass && ' ms-warning-indicator'
                        || errorClass && ' ms-danger-indicator'
                        || ''}`}>
                    <Glyphicon
                        tooltipId={
                            warningClass && 'ms.layerWarning'
                            || errorClass && 'toc.loadingerror'}
                        glyph="exclamation-mark"/>
                </div>

    ].filter(val => val);

    const indicatorClass = indicatorsComponents.length > 0 ? ' with-indicators' : '';

    const card = node.dummy
        ? <div style={{ height: 2 }} />
        : <div
            style={{ position: 'relative' }}>
            <SideCard
                preview={node.loading
                    ? <div className="ms-toc-loader">
                        <div className="mapstore-small-size-loader"/>
                    </div>
                    : <Glyphicon glyph="1-layer"/>}
                style={{ opacity: visibility ? 1.0 : 0.4 }}
                className={`ms-toc-layer${draggableClass}${draggingClass}${overClass}${warningClass}${errorClass}${indicatorClass}${selectedClass}`}
                size="sm"
                title={filterText
                    ? <Highlighter
                        highlightClassName="ms-mark"
                        searchWords={[ filterText ]}
                        autoEscape
                        textToHighlight={title}
                    />
                    : title
                }
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
                                glyph: node.expanded ? 'collapse-down' : 'expand',
                                tooltipId: 'ms.displayLegend',
                                onClick: (event) => {
                                    event.stopPropagation();
                                    onUpdateNode(node.id, 'layers', { expanded: !node.expanded });
                                }
                            }
                        ]}/>
                }
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
                            ...buttons
                                .map((button) => button({
                                    node,
                                    onChange: propertiesChangeHandler
                                }))
                                .filter(button => button),
                            {
                                glyph: visibility ? 'eye-open' : 'eye-close',
                                tooltipId: 'toc.toggleLayerVisibility',
                                onClick: (event) => {
                                    event.stopPropagation();
                                    propertiesChangeHandler(node.id, { visibility: !visibility });
                                }
                            }
                        ]}/>
                }
                body={
                    <>
                        {indicatorsComponents.length > 0
                        && <div className="ms-toc-node-indicators">
                            {indicatorsComponents}
                        </div>}
                        {node.expanded && <div className="ms-layer-node-body">
                            <WMSLegend
                                node={node}
                                currentZoomLvl={currentZoomLvl}
                                scales={scales}
                                { ...legendOptions } />
                        </div>}
                        <OpacitySlider
                            opacity={node.opacity}
                            disabled={!visibility}
                            onChange={opacity => onUpdateNode(node.id, 'layers', { opacity })}/>
                    </>
                }/>
        </div>;
    if (node.showComponent !== false
    && !node.hide
    && filter(node)
    && (!filterText || node.title && node.title.toLowerCase().indexOf(filterText.toLowerCase()) !== -1)) {
        return connectDropTarget(isDraggable ? connectDragSource(card) : card);
    }
    return null;
}
LayerNode.propTypes = {
    node: PropTypes.object,
    filter: PropTypes.func,
    connectDragSource: PropTypes.func,
    connectDropTarget: PropTypes.func,
    currentZoomLvl: PropTypes.number,
    scales: PropTypes.array,
    legendOptions: PropTypes.object,
    onUpdateNode: PropTypes.func,
    onZoomTo: PropTypes.func,
    isDraggable: PropTypes.bool,
    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,
    filterText: PropTypes.string,
    additionalLayers: PropTypes.array,
    parentCategoryName: PropTypes.string,
    buttons: PropTypes.array
};
export default draggableComponent('LayerOrGroup', class extends Component { render() { return <LayerNode {...this.props}/>; }});

/**
 * Default layer node for TOC
 */


/*
class DefaultLayer extends React.Component {
    static propTypes = {
        node: PropTypes.object,
        propertiesChangeHandler: PropTypes.func,
        onToggle: PropTypes.func,
        onContextMenu: PropTypes.func,
        onSelect: PropTypes.func,
        style: PropTypes.object,
        sortableStyle: PropTypes.object,
        activateLegendTool: PropTypes.bool,
        activateOpacityTool: PropTypes.bool,
        indicators: PropTypes.array,
        visibilityCheckType: PropTypes.string,
        currentZoomLvl: PropTypes.number,
        scales: PropTypes.array,
        additionalTools: PropTypes.array,
        legendOptions: PropTypes.object,
        currentLocale: PropTypes.string,
        selectedNodes: PropTypes.array,
        filterText: PropTypes.string,
        onUpdateNode: PropTypes.func,
        titleTooltip: PropTypes.bool,
        filter: PropTypes.func,
        showFullTitleOnExpand: PropTypes.bool,
        hideOpacityTooltip: PropTypes.bool,
        tooltipOptions: PropTypes.object,
        connectDragPreview: PropTypes.func,
        connectDragSource: PropTypes.func,
        connectDropTarget: PropTypes.func,
        isDraggable: PropTypes.bool,
        isDragging: PropTypes.bool,
        isOver: PropTypes.bool
    };

    static defaultProps = {
        style: {},
        sortableStyle: {},
        propertiesChangeHandler: () => {},
        onToggle: () => {},
        onContextMenu: () => {},
        onSelect: () => {},
        activateLegendTool: false,
        activateOpacityTool: true,
        indicators: [],
        visibilityCheckType: "glyph",
        additionalTools: [],
        currentLocale: 'en-US',
        joinStr: ' - ',
        selectedNodes: [],
        filterText: '',
        onUpdateNode: () => {},
        filter: () => true,
        titleTooltip: false,
        showFullTitleOnExpand: false,
        hideOpacityTooltip: false,
        connectDragPreview: (x) => x,
        connectDragSource: (x) => x,
        connectDropTarget: (x) => x
    };

    getTitle = (layer) => {
        const translation = isObject(layer.title) ? layer.title[this.props.currentLocale] || layer.title.default : layer.title;
        return translation || layer.name;
    };

    renderOpacitySlider = (hideOpacityTooltip) => {
        return this.props.activateOpacityTool ? (
            <OpacitySlider
                opacity={this.props.node.opacity}
                disabled={!this.props.node.visibility}
                hideTooltip={hideOpacityTooltip}
                onChange={opacity => this.props.onUpdateNode(this.props.node.id, 'layers', {opacity})}/>
        ) : null;
    }

    renderCollapsible = () => {
        return (
            <div key="legend" position="collapsible" className="collapsible-toc">
                <Grid fluid>
                    {this.props.showFullTitleOnExpand ? <Row><Col xs={12} className="toc-full-title">{this.getTitle(this.props.node)}</Col></Row> : null}
                    {this.props.activateLegendTool ?
                        <Row>
                            <Col xs={12}>
                                <WMSLegend node={this.props.node} currentZoomLvl={this.props.currentZoomLvl} scales={this.props.scales} {...this.props.legendOptions} />
                            </Col>
                        </Row> : null}
                </Grid>
                {this.renderOpacitySlider(this.props.hideOpacityTooltip)}
            </div>);
    };

    renderVisibility = () => {
        return this.props.node.loadingError === 'Error' ?
            (<LayersTool key="loadingerror"
                glyph="exclamation-mark text-danger"
                tooltip="toc.loadingerror"
                className="toc-error" />)
            :
            (<VisibilityCheck key="visibilitycheck"
                tooltip={this.props.node.loadingError === 'Warning' ? 'toc.toggleLayerVisibilityWarning' : 'toc.toggleLayerVisibility'}
                node={this.props.node}
                checkType={this.props.visibilityCheckType}
                propertiesChangeHandler={this.props.propertiesChangeHandler} />);
    }

    renderToolsLegend = (isEmpty) => {
        return this.props.node.loadingError === 'Error' || isEmpty ?
            null
            :
            (<LayersTool
                node={this.props.node}
                tooltip="toc.displayLegendAndTools"
                key="toollegend"
                className="toc-legend"
                ref="target"
                glyph="chevron-left"
                onClick={(node) => this.props.onToggle(node.id, node.expanded)} />);
    }
    renderIndicators = () => {
        // initial support to render icons in TOC nodes (now only type = "dimension" supported)
        return castArray(this.props.indicators).map( indicator =>
            (indicator.type === "dimension" ? find(this.props.node && this.props.node.dimensions || [], indicator.condition) : false)
                ? indicator.glyph && <GlyphIndicator key={indicator.key} glyph={indicator.glyph} {...indicator.props} />
                : null);
    }
    renderNode = (grab, hide, selected, error, warning, isDummy, other) => {
        const isEmpty = this.props.node.type === 'wms' && !this.props.activateLegendTool && !this.props.showFullTitleOnExpand
        || this.props.node.type !== 'wms' && !this.props.showFullTitleOnExpand;
        const head = (isDummy ?
            <div style={{padding: 0, height: 10}} className="toc-default-layer-head"/> :
            <div className="toc-default-layer-head">
                {grab}
                {this.renderVisibility()}
                <ToggleFilter node={this.props.node} propertiesChangeHandler={this.props.propertiesChangeHandler}/>
                <Title
                    tooltipOptions={this.props.tooltipOptions}
                    tooltip={this.props.titleTooltip}
                    filterText={this.props.filterText}
                    node={this.props.node}
                    currentLocale={this.props.currentLocale}
                    onClick={this.props.onSelect}
                    onContextMenu={this.props.onContextMenu}
                />

                {this.props.node.loading ? <div className="toc-inline-loader"></div> : this.renderToolsLegend(isEmpty)}
                {this.props.indicators ? this.renderIndicators() : null}
            </div>
        );
        return (
            <Node className={(this.props.isDragging || this.props.node.placeholder ? "is-placeholder " : "") + 'toc-default-layer' + hide + selected + error + warning} style={this.props.style} type="layer" {...other}>
                {other.isDraggable && !isDummy ? this.props.connectDragPreview(head) : head}
                {isDummy || !this.props.activateOpacityTool || this.props.node.expanded || !this.props.node.visibility || this.props.node.loadingError === 'Error' ? null : this.renderOpacitySlider(this.props.hideOpacityTooltip)}
                {isDummy || isEmpty ? null : this.renderCollapsible()}
            </Node>
        );
    }

    render() {
        let {children, propertiesChangeHandler, onToggle, connectDragSource, connectDropTarget, ...other } = this.props;

        const hide = !this.props.node.visibility || this.props.node.invalid ? ' visibility' : '';
        const selected = this.props.selectedNodes.filter((s) => s === this.props.node.id).length > 0 ? ' selected' : '';
        const error = this.props.node.loadingError === 'Error' ? ' layer-error' : '';
        const warning = this.props.node.loadingError === 'Warning' ? ' layer-warning' : '';
        const grab = other.isDraggable ? <LayersTool key="grabTool" tooltip="toc.grabLayerIcon" className="toc-grab" ref="target" glyph="menu-hamburger"/> : <span className="toc-layer-tool toc-grab"/>;
        const isDummy = !!this.props.node.dummy;
        const filteredNode = !isDummy && this.filterLayers(this.props.node) ? this.renderNode(grab, hide, selected, error, warning, isDummy, other) : null;
        const tocListItem = (
            <div style={isDummy ? {opacity: 0, boxShadow: 'none'} : {}} className="toc-list-item">
                {!this.props.filterText || (this.props.filterText && isDummy) ? this.renderNode(grab, hide, selected, error, warning, isDummy, other) : filteredNode}
            </div>
        );
        if (other.node.showComponent !== false && !other.node.hide && this.props.filter(this.props.node)) {
            return connectDropTarget(other.isDraggable && !isDummy ? connectDragSource(tocListItem) : tocListItem);
        }
        return null;
    }

    filterLayers = (layer) => {
        const translation = isObject(layer.title) ? layer.title[this.props.currentLocale] || layer.title.default : layer.title;
        const title = translation || layer.name;
        return title.toLowerCase().indexOf(this.props.filterText.toLowerCase()) !== -1;
    };
}

module.exports = draggableComponent('LayerOrGroup', DefaultLayer);*/
