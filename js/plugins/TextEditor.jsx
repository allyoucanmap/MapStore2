
import React from 'react';
import PropTypes from 'prop-types';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { debounce } from 'lodash';

class TextEditor extends React.Component {

    static propTypes = {
        html: PropTypes.string,
        toolbar: PropTypes.object,
        placeholder: PropTypes.string,
        className: PropTypes.string,
        onChange: PropTypes.func,
        readOnly: PropTypes.bool
    };

    static defaultProps = {
        className: 'ms-text-editor',
        placeholder: 'Insert text'
    }

    state = { }

    componentWillMount() {
        if (this.props.html) {
            const contentBlock = htmlToDraft(this.props.html);
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            this.setState({
                editorState: EditorState.createWithContent(contentState)
            });
        } else {
            this.setState({
                editorState: EditorState.createEmpty()
            });
        }
        this.update = debounce((html) => {
            this.props.onChange(html);
        }, 1000);
    }

    onEditorStateChange = (editorState) => {
        this.setState({
            editorState
        });
        const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
        this.update.cancel();
        this.update(html);
    };

    render() {
        const { editorState } = this.state;
        const { toolbar = {}, className } = this.props;
        return (
            <div className={className}>
                {(!this.props.readOnly && this.state.enableEditing) ? <Editor
                    editorState={editorState}
                    toolbarOnFocus
                    readOnly={this.props.readOnly}
                    placeholder={this.props.placeholder}
                    toolbarStyle={{ }}
                    toolbar={{
                        options: [ 'fontFamily', 'blockType', 'inline', 'textAlign', 'colorPicker', 'remove' ],
                        fontFamily: {
                            options: ['inherit', 'Arial', 'Georgia', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana'],
                            className: undefined,
                            component: undefined,
                            dropdownClassName: undefined
                        },
                        link: {
                            inDropdown: false,
                            className: undefined,
                            component: undefined,
                            popupClassName: undefined,
                            dropdownClassName: undefined,
                            showOpenOptionOnHover: true,
                            defaultTargetOption: '_self',
                            options: ['link', 'unlink'],
                            link: { icon: undefined, className: undefined },
                            unlink: { icon: undefined, className: undefined },
                            linkCallback: undefined
                        },
                        blockType: {
                            inDropdown: true,
                            options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'],
                            className: undefined,
                            component: undefined,
                            dropdownClassName: undefined
                        },
                        inline: {
                            options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'],
                            bold: { className: `${className}-toolbar-btn` },
                            italic: { className: `${className}-toolbar-btn` },
                            underline: { className: `${className}-toolbar-btn` },
                            strikethrough: { className: `${className}-toolbar-btn` },
                            code: { className: `${className}-toolbar-btn` }
                        },
                        textAlign: {
                            left: { className: `${className}-toolbar-btn` },
                            center: { className: `${className}-toolbar-btn` },
                            right: { className: `${className}-toolbar-btn` },
                            justify: { className: `${className}-toolbar-btn` }
                        },
                        colorPicker: { className: `${className}-toolbar-btn` },
                        remove: { className: `${className}-toolbar-btn` },
                        ...toolbar
                    }}
                    toolbarClassName={`${className}-toolbar`}
                    wrapperClassName={`${className}-wrapper`}
                    editorClassName={`${className}-main`}
                    stripPastedStyles
                    onEditorStateChange={this.onEditorStateChange}
                    onBlur={() => this.setState({ enableEditing: false })}/>
                    : <div onClick={() => {
                        this.setState({ enableEditing: true });
                    }} dangerouslySetInnerHTML={{__html: this.props.html }} />}
            </div>
        );
    }
}

export default TextEditor;
