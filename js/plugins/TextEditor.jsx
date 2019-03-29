
import React from 'react';
import PropTypes from 'prop-types';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

class TextEditor extends React.Component {

    static propTypes = {
        html: PropTypes.string,
        toolbar: PropTypes.object,
        placeholder: PropTypes.string,
        className: PropTypes.string,
        onChange: PropTypes.func
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
    }

    onEditorStateChange = (editorState) => {
        this.setState({
            editorState
        });
        const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
        this.props.onChange(html);
    };

    render() {
        const { editorState } = this.state;
        const { toolbar = {}, className } = this.props;
        return (
            <div className={className}>
                <Editor
                    editorState={editorState}
                    toolbarOnFocus
                    placeholder={this.props.placeholder}
                    toolbarStyle={{ }}
                    toolbar={{
                        options: [ 'inline', 'textAlign', 'colorPicker', 'remove' ],
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
                    onEditorStateChange={this.onEditorStateChange}/>
            </div>
        );
    }
}

export default TextEditor;
