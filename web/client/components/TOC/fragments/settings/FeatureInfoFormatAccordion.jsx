/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const MapInfoUtils = require('../../../../utils/MapInfoUtils');
const AccordionMS = require('../../../misc/panels/AccordionMS');
const {Glyphicon} = require('react-bootstrap');
const ReactQuill = require('react-quill');

const formatBody = {
    TEXT: () => <div>TEST</div>,
    HTML: () => <div/>,
    PROPERTIES: () => <div/>,
    CUSTOM: ({template = '', onChange = () => {}}) =>
        <div id="ms-settings-template-editor">
            <ReactQuill
                bounds={"#ms-template-editor"}
                defaultValue ={template}
                onChange={value => { console.log(value); onChange(value); }}/>
        </div>
};

module.exports = class extends React.Component {
    static propTypes = {
        element: PropTypes.object,
        label: PropTypes.object,
        defaultInfoFormat: PropTypes.object,
        generalInfoFormat: PropTypes.string,
        onInfoFormatChange: PropTypes.func
    };

    static defaultProps = {
        defaultInfoFormat: MapInfoUtils.getAvailableInfoFormat(),
        generalInfoFormat: "text/plain",
        onInfoFormatChange: () => {}
    };

    getInfoFormat = (infoFormats) => {
        return Object.keys(infoFormats).map((infoFormat) => {
            const Body = formatBody[infoFormat];
            return {
                id: infoFormat,
                head: {
                    preview: <Glyphicon glyph="geoserver"/>,
                    title: infoFormat,
                    description: infoFormats[infoFormat],
                    size: 'sm'
                },
                body: <Body
                    template={this.props.element.featureInfo && this.props.element.featureInfo.template || ''}
                    onChange={template => {
                        this.props.onInfoFormatChange("featureInfo", {
                            ...(this.props.element && this.props.element.featureInfo || {}),
                            template
                        });
                    }}/>
            };
        });
    }

    render() {
        // the selected value if missing on that layer should be set to the general info format value and not the first one.
        const data = this.getInfoFormat(this.props.defaultInfoFormat);
        // const checkDisabled = !!(this.props.element.featureInfo && this.props.element.featureInfo.viewer);
        return (
            <AccordionMS
                activePanel={this.props.element.featureInfo ? this.props.element.featureInfo.format : MapInfoUtils.getLabelFromValue(this.props.generalInfoFormat)}
                panels={data}
                onSelect={value => {
                    this.props.onInfoFormatChange("featureInfo", {
                        ...(this.props.element && this.props.element.featureInfo || {}),
                        format: value,
                        viewer: this.props.element.featureInfo ? this.props.element.featureInfo.viewer : undefined
                    });
                }}/>
        );
    }
};
