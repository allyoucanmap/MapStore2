/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const ReactQuill = require('react-quill');
const ResizableModal = require('../../../misc/ResizableModal');
const Portal = require('../../../misc/Portal');
const Message = require('../../../I18N/Message');
const {Quill} = ReactQuill;
const {ResizeModule, IFrame, toolbarConfig} = require('../../../misc/quillmodules/ResizeModule')(Quill);
const { debounce } = require('lodash');

Quill.register({
    'formats/video': IFrame,
    'modules/resizeModule': ResizeModule
});

/**
 * Component for rendering FeatureInfoEditor a modal editor to modify format template
 * @memberof components.TOC.fragments.settings
 * @name FeatureInfoEditor
 * @class
 * @prop {object} element data of the current selected node
 * @prop {bool} showEditor show/hide modal
 * @prop {funciotn} onShowEditor called when click on close buttons
 * @prop {function} onChange called when text in editor has been changed
 * @prop {bool} enableIFrameModule enable iframe in editor, default true
 */

class FeatureInfoEditor extends React.Component {

    static propTypes = {
        showEditor: PropTypes.bool,
        element: PropTypes.object,
        onChange: PropTypes.func,
        onShowEditor: PropTypes.func,
        enableIFrameModule: PropTypes.bool,
        debounceTime: PropTypes.number
    };

    static defaultProps = {
        showEditor: false,
        element: {},
        enableIFrameModule: false,
        onChange: () => {},
        onShowEditor: () => {},
        debounceTime: 500
    };

    state = { };

    componentWillMount() {
        this.update = debounce((changedValues) => {
            this.props.onChange('featureInfo', changedValues);
        }, this.props.debounceTime);
    }

    render() {
        const { onShowEditor = () => {}, showEditor, element = {}, enableIFrameModule = true } = this.props;
        return (
            <Portal>
                <ResizableModal
                    fade
                    show={showEditor}
                    title={<Message msgId="layerProperties.editCustomFormat"/>}
                    size="lg"
                    showFullscreen
                    clickOutEnabled={false}
                    onClose={() => onShowEditor(!showEditor)}
                    buttons={[
                        {
                            bsStyle: 'primary',
                            text: <Message msgId="close"/>,
                            onClick: () => onShowEditor(!showEditor)
                        }
                    ]}>
                    <div id="ms-template-editor" className="ms-editor">
                        <ReactQuill
                            bounds="#ms-template-editor"
                            ref={(quill) => { if (quill) { this.quill = quill; } } }
                            modules={enableIFrameModule ? {
                                resizeModule: {},
                                toolbar: toolbarConfig
                            } : {}}
                            defaultValue={element.featureInfo && element.featureInfo.template || ' '}
                            onChange={template => {
                                this.update.cancel();
                                this.update({
                                    ...(element && element.featureInfo || {}),
                                    template
                                });
                            }}/>
                    </div>
                </ResizableModal>
            </Portal>
        );
    }
}

module.exports = FeatureInfoEditor;
