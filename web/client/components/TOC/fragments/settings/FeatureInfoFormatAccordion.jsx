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
const ResizableModal = require('../../../misc/ResizableModal');
const Portal = require('../../../misc/Portal');

const HTMLViewer = require('../../../data/identify/viewers/HTMLViewer');
const TextViewer = require('../../../data/identify/viewers/TextViewer');
const JSONViewer = require('../../../data/identify/viewers/JSONViewer');
const HtmlRenderer = require('../../../misc/HtmlRenderer');

const responses = {
    html: require('raw-loader!./featureInfoPreviews/responseHTML.txt'),
    json: JSON.parse(require('raw-loader!./featureInfoPreviews/responseJSON.txt')),
    text: require('raw-loader!./featureInfoPreviews/responseText.txt')
};

const formatBody = {
    TEXT: () => <TextViewer response={responses.text}/>,
    HTML: () => <HTMLViewer response={responses.html}/>,
    PROPERTIES: () => <JSONViewer response={responses.json} />,
    CUSTOM: ({template = ''}) => template && template !== '<p><br></p>' && <HtmlRenderer html={template}/>
        || <div>
            <p><i>Click on edit button to add a new template.</i>&nbsp;<Glyphicon glyph="pencil"/></p>
            <p><i>{'Use \$\{ \} to wrap the properties you need to be displayed.'}</i></p>
            <pre>
                {'The id of the feature is \$\{ properties.id \}'}
            </pre>
        </div>
};

module.exports = class extends React.Component {
    static propTypes = {
        element: PropTypes.object,
        label: PropTypes.object,
        defaultInfoFormat: PropTypes.object,
        generalInfoFormat: PropTypes.string,
        onChange: PropTypes.func,
        showEditor: PropTypes.bool,
        onShowEditor: PropTypes.func
    };

    static defaultProps = {
        defaultInfoFormat: MapInfoUtils.getAvailableInfoFormat(),
        generalInfoFormat: "text/plain",
        onChange: () => {},
        showEditor: false,
        onShowEditor: () => {}
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
                body: <div><div>Example of Response</div><br/><Body template={this.props.element.featureInfo && this.props.element.featureInfo.template || ''} /></div>
            };
        });
    }

    render() {
        // the selected value if missing on that layer should be set to the general info format value and not the first one.
        const data = this.getInfoFormat(this.props.defaultInfoFormat);
        // const checkDisabled = !!(this.props.element.featureInfo && this.props.element.featureInfo.viewer);
        return (
            <span>
                <AccordionMS
                    fillContainer
                    activePanel={this.props.element.featureInfo ? this.props.element.featureInfo.format : MapInfoUtils.getLabelFromValue(this.props.generalInfoFormat)}
                    panels={data}
                    onSelect={value => {
                        this.props.onChange("featureInfo", {
                            ...(this.props.element && this.props.element.featureInfo || {}),
                            format: value,
                            viewer: this.props.element.featureInfo ? this.props.element.featureInfo.viewer : undefined
                        });
                    }}/>
                <Portal>
                    <ResizableModal
                        fade
                        show={this.props.showEditor}
                        title={'Changed Settings'}
                        size="lg"
                        showFullscreen
                        clickOutEnabled={false}
                        onClose={() => this.props.onShowEditor(!this.props.showEditor)}
                        buttons={[
                            {
                                bsStyle: 'primary',
                                text: 'Close',
                                onClick: () => this.props.onShowEditor(!this.props.showEditor)
                            }
                        ]}>
                        <div id="ms-template-editor" className="ms-editor">
                            <ReactQuill
                                bounds={"#ms-template-editor"}
                                defaultValue ={this.props.element.featureInfo && this.props.element.featureInfo.template || ''}
                                onChange={template => {
                                    this.props.onChange("featureInfo", {
                                        ...(this.props.element && this.props.element.featureInfo || {}),
                                        template
                                    });
                                }}/>
                        </div>
                    </ResizableModal>
                </Portal>
            </span>
        );
    }
};
