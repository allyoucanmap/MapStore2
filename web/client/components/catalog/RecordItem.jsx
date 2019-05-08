/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const React = require('react');
const PropTypes = require('prop-types');
const SharingLinks = require('./SharingLinks');
const Message = require('../I18N/Message');
const {Image, Button: ButtonRB, Glyphicon} = require('react-bootstrap');
const { isObject, template } = require('lodash');

const MapInfoUtils = require('../../utils/MapInfoUtils');
const HtmlRenderer = require('../misc/HtmlRenderer');

const CoordinatesUtils = require('../../utils/CoordinatesUtils');
const ContainerDimensions = require('react-container-dimensions').default;
const {getRecordLinks, recordToLayer, extractOGCServicesReferences, buildSRSMap, extractEsriReferences, esriToLayer} = require('../../utils/CatalogUtils');

const tooltip = require('../misc/enhancers/tooltip');
const Button = tooltip(ButtonRB);
const defaultThumb = require('./img/default.jpg');

import SideCard from '../misc/cardgrids/SideCard';
import Toolbar from '../misc/toolbar/Toolbar';

class RecordItem extends React.Component {
    static propTypes = {
        addAuthentication: PropTypes.bool,
        buttonSize: PropTypes.string,
        crs: PropTypes.string,
        currentLocale: PropTypes.string,
        onCopy: PropTypes.func,
        onError: PropTypes.func,
        onLayerAdd: PropTypes.func,
        onZoomToExtent: PropTypes.func,
        record: PropTypes.object,
        authkeyParamNames: PropTypes.array,
        showGetCapLinks: PropTypes.bool,
        zoomToLayer: PropTypes.bool,
        catalogURL: PropTypes.string,
        catalogType: PropTypes.string,
        hideThumbnail: PropTypes.bool,
        hideIdentifier: PropTypes.bool,
        hideExpand: PropTypes.bool
    };

    static defaultProps = {
        buttonSize: "small",
        crs: "EPSG:3857",
        currentLocale: 'en-US',
        onCopy: () => {},
        onError: () => {},
        onLayerAdd: () => {},
        onZoomToExtent: () => {},
        style: {},
        showGetCapLinks: true,
        zoomToLayer: true,
        hideThumbnail: false,
        hideIdentifier: false,
        hideExpand: false
    };

    state = {};

    componentWillMount() {
        document.addEventListener('click', this.handleClick, false);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClick, false);
    }

    getTitle = (title) => {
        return isObject(title) ? title[this.props.currentLocale] || title.default : title || '';
    };

    renderThumb = (thumbURL, record) => {
        let thumbSrc = thumbURL || defaultThumb;

        return (<Image className="preview" src={thumbSrc} alt={record && this.getTitle(record.title)}/>);

    };

    renderButtons = (record) => {
        if (!record || !record.references) {
            // we don't have a valid record so no buttons to add
            return null;
        }
        // let's extract the references we need
        const {wms, wmts} = extractOGCServicesReferences(record);
        // let's extract the esri
        const {esri} = extractEsriReferences(record);

        // let's create the buttons
        let buttons = [];
        // TODO addLayer and addwmtsLayer do almost the same thing and they should be unified
        if (wms) {
            buttons.push(
                <Button
                    key="wms-button"
                    tooltipId="catalog.addToMap"
                    className="square-button-md"
                    bsStyle="primary"
                    onClick={() => { this.addLayer(wms); }}
                    key="addlayer">
                        <Glyphicon glyph="plus" />
                </Button>
            );
        }
        if (wmts) {
            buttons.push(
                <Button
                    key="wmts-button"
                    tooltipId="catalog.addToMap"
                    className="square-button-md"
                    bsStyle="primary"
                    onClick={() => { this.addwmtsLayer(wmts); }}
                    key="addwmtsLayer">
                        <Glyphicon glyph="plus" />
                </Button>
            );
        }
        if (esri) {
            buttons.push(
                <Button
                    key="wmts-button"
                    tooltipId="catalog.addToMap"
                    className="square-button-md"
                    bsStyle="primary"
                    onClick={() => { this.addEsriLayer(); }}
                    key="addwmtsLayer">
                        <Glyphicon glyph="plus" />
                </Button>
            );
        }
        // create get capabilities links that will be used to share layers info
        // if (this.props.showGetCapLinks) {
        let links = getRecordLinks(record);
        if (links.length > 0) {
            buttons.push(<SharingLinks key="sharing-links" popoverContainer={this} links={links}
                onCopy={this.props.onCopy} buttonSize={this.props.buttonSize} addAuthentication={this.props.addAuthentication}/>);
        }
        // }

        return buttons;
    };

    renderDescription = (record) => {
        if (!record) {
            return null;
        }
        if (typeof record.description === "string") {
            return (
                this.state.fullText && record.metadataTemplate
                    ? (
                        <div className="catalog-metadata ql-editor">
                            <HtmlRenderer html={template(MapInfoUtils.getCleanTemplate(record.metadataTemplate || '', record, /\$\{.*?\}/g, 2, 1))(record)}/>
                        </div>
                    )
                    : record.metadataTemplate ? '' : record.description
            );
        } else if (Array.isArray(record.description)) {
            return (
                this.state.fullText && record.metadataTemplate
                    ? (
                        <div className="catalog-metadata ql-editor">
                            <HtmlRenderer html={template(MapInfoUtils.getCleanTemplate(record.metadataTemplate || '', record, /\$\{.*?\}/g, 2, 1))(record)}/>
                        </div>
                    )
                    : record.metadataTemplate ? '' : record.description.join(", ")
            );
        }
    };

    render() {
        let record = this.props.record;
        const {wms, wmts} = extractOGCServicesReferences(record);
        const {esri} = extractEsriReferences(record);
        return record ? (
            <ContainerDimensions>
                {({ width }) =>
                <SideCard
                    fullText={this.state.fullText}
                    preview={!this.props.hideThumbnail && this.renderThumb(record && record.thumbnail, record)}
                    title={record && this.getTitle(record.title)}
                    description={this.renderDescription(record)}
                    caption={<div>
                        {!this.props.hideIdentifier && <div>{record && record.identifier}</div>}
                        <div>{!wms && !wmts && !esri && <small className="text-danger"><Message msgId="catalog.missingReference"/></small>}</div>
                        {!this.props.hideExpand &&
                            <div
                                className="ms-ruler"
                                style={{visibility: 'hidden', height: 0, whiteSpace: 'nowrap', position: 'absolute' }}
                                ref={ruler => { this.descriptionRuler = ruler; }}>{this.renderDescription(record)}</div>}
                    </div>}
                    tools={
                        <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md',
                                bsStyle: 'primary'
                            }}
                            btnGroupProps={{
                                style: {
                                    margin: 10
                                }
                            }}
                            buttons={[
                                ...(record && this.renderButtons(record) || []).map(Element => ({ Element: () => Element })),
                                {
                                    glyph: this.state.fullText ? 'chevron-down' : 'chevron-left',
                                    visible: (this.displayExpand(width - (104 + 83)) || record.metadataTemplate) ? true : false,
                                    tooltip: this.state.fullText ? 'Collapse metadata' : 'Expand metadata',
                                    onClick: () => this.setState({ fullText: !this.state.fullText })
                                }
                            ]}/>
                    }
                    /*body={
                        <div>
                            {this.state.fullText && record.metadataTemplate
                                ? (
                                    <div className="catalog-metadata ql-editor">
                                        <HtmlRenderer html={template(MapInfoUtils.getCleanTemplate(record.metadataTemplate || '', record, /\$\{.*?\}/g, 2, 1))(record)}/>
                                    </div>
                                )
                                : null}
                        </div>
                    }*//>}
            </ContainerDimensions>
        ) : null;
        /*return (
            <Panel className="record-item">
                {!this.props.hideThumbnail && <div className="record-item-thumb">
                    {this.renderThumb(record && record.thumbnail, record)}
                </div>}
                <div className="record-item-content">
                    <div className="record-item-title">
                        <h4>{record && this.getTitle(record.title)}</h4>
                        {!this.props.hideExpand && <ContainerDimensions>
                            {({width}) => this.displayExpand(width) &&
                            <Button
                                tooltipPosition="left"
                                tooltipId={!this.state.truncateText ? 'catalog.showDescription' : 'catalog.hideDescription'}
                                className={`square-button-md ${!this.state.truncateText ? '' : ' ms-collapsed'}`} onClick={() => this.setState({truncateText: !this.state.truncateText})}>
                                <Glyphicon glyph="chevron-left"/>
                            </Button>}
                        </ContainerDimensions>}
                    </div>
                    <div className={`record-item-info${this.state.truncateText ? '' : ' record-item-truncate-text'}`}>
                        {!this.props.hideIdentifier && <h4><small>{record && record.identifier}</small></h4>}
                        <p className="record-item-description">{this.renderDescription(record)}</p>
                    </div>
                    {!wms && !wmts && !esri && <small className="text-danger"><Message msgId="catalog.missingReference"/></small>}
                    {!this.props.hideExpand && <div
                    className="ms-ruler"
                    style={{visibility: 'hidden', height: 0, whiteSpace: 'nowrap', position: 'absolute' }}
                    ref={ruler => { this.descriptionRuler = ruler; }}>{this.renderDescription(record)}</div>}
                    {this.renderButtons(record)}
                </div>
            </Panel>
        );*/
    }

    isLinkCopied = (key) => {
        return this.state[key];
    };

    setLinkCopiedStatus = (key, status) => {
        this.setState({[key]: status});
    };

    addLayer = (wms) => {
        const allowedSRS = buildSRSMap(wms.SRS);
        if (wms.SRS.length > 0 && !CoordinatesUtils.isAllowedSRS(this.props.crs, allowedSRS)) {
            this.props.onError('catalog.srs_not_allowed');
        } else {
            this.props.onLayerAdd(
                recordToLayer(this.props.record, "wms", {
                    removeParams: this.props.authkeyParamNames,
                    catalogURL: this.props.catalogType === 'csw' && this.props.catalogURL ? this.props.catalogURL + "?request=GetRecordById&service=CSW&version=2.0.2&elementSetName=full&id=" + this.props.record.identifier : null
                }));
            if (this.props.record.boundingBox && this.props.zoomToLayer) {
                let extent = this.props.record.boundingBox.extent;
                let crs = this.props.record.boundingBox.crs;
                this.props.onZoomToExtent(extent, crs);
            }
        }
    };

    addwmtsLayer = (wmts) => {
        const allowedSRS = buildSRSMap(wmts.SRS);
        if (wmts.SRS.length > 0 && !CoordinatesUtils.isAllowedSRS(this.props.crs, allowedSRS)) {
            this.props.onError('catalog.srs_not_allowed');
        } else {
            this.props.onLayerAdd(recordToLayer(this.props.record, "wmts", {
                removeParams: this.props.authkeyParamNames
            }));
            if (this.props.record.boundingBox && this.props.zoomToLayer) {
                let extent = this.props.record.boundingBox.extent;
                let crs = this.props.record.boundingBox.crs;
                this.props.onZoomToExtent(extent, crs);
            }
        }
    };
    addEsriLayer = () => {
        this.props.onLayerAdd(esriToLayer(this.props.record));
        if (this.props.record.boundingBox && this.props.zoomToLayer) {
            let extent = this.props.record.boundingBox.extent;
            let crs = this.props.record.boundingBox.crs;
            this.props.onZoomToExtent(extent, crs);
        }
    };
    displayExpand = width => {
        const descriptionWidth = this.descriptionRuler ? this.descriptionRuler.clientWidth : 0;
        return descriptionWidth > width;
    };
}

module.exports = RecordItem;
