import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from "react-contenteditable";
import { Glyphicon } from 'react-bootstrap';

import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';

import Container from './Container';
import Media from './Media';
import ToolbarPopover from './ToolbarPopover';
import TextEditor from './TextEditor';
import TextWrapper from './TextWrapper';
import MediaEditor from './MediaEditor';

import { camelCase, mapKeys } from 'lodash';

const PageWrapper = (props) => {
    return (
        <div className="ms-cascade-wrapper">
            {props.children}
        </div>
    );
};

class ContentEditor extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        text: PropTypes.array,
        onChange: PropTypes.func,
        readOnly: PropTypes.bool
    };

    state = {};

    componentWillMount() {
        this.setState({
            text: [
                {
                    id: 0,
                    field: 'text',
                    html: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                }
            ]
        });
    }

    render() {
        return (
            <div className={`ms-content-editor${this.props.readOnly ? ' ms-read-only' : ''}`}>
                {this.state.text.map((atom, idx) => {
                    return (
                        <div>
                            {!this.props.readOnly && <div className="text-right" style={{paddingBottom: 8}}>
                                <Toolbar
                                    btnDefaultProps={{
                                        className: 'square-button-md no-border'
                                    }}
                                    buttons={[
                                        {
                                            glyph: 'trash',
                                            tooltip: 'Remove content',
                                            visible: this.state.text.length > 1 ? true : false,
                                            onClick: () => this.removeContent(atom.id)
                                        }
                                    ]}/>
                            </div>}
                            {atom.field === 'text' &&
                                <TextEditor
                                    key={atom.id}
                                    html={atom.html}
                                    readOnly={this.props.readOnly}
                                    onChange={(html) => this.updateContent(atom.id, { html })} />}
                            {atom.field === 'media' &&
                                <MediaEditor
                                    id={`${this.props.id}_${atom.id}`}
                                    key={atom.id}
                                    position={atom.position}
                                    readOnly={this.props.readOnly}
                                    type={atom.type || 'image'}
                                    src={atom.src}
                                    size={atom.size}
                                    onChange={(value) => this.updateContent(atom.id, value)}/>}
                            {!this.props.readOnly && <div
                                className="text-center"
                                style={{ width: '100%' }}>
                                <ToolbarPopover
                                    glyph="plus"
                                    container={document.querySelector('#ms-parallax-container')}
                                    placement="top"
                                    content={
                                        <Toolbar
                                            btnDefaultProps={{
                                                className: 'square-button btn-tray'
                                            }}
                                            buttons={[
                                                {
                                                    glyph: 'align-justify',
                                                    tooltip: 'Add text content',
                                                    onClick: () => {
                                                        this.addContent(idx, {
                                                            id: this.state.text.length,
                                                            field: 'text',
                                                            html: ''
                                                        });
                                                    }
                                                },
                                                {
                                                    glyph: 'screenshot',
                                                    tooltip: 'Add media content',
                                                    onClick: () => {
                                                        this.addContent(idx, {
                                                            id: this.state.text.length,
                                                            field: 'media',
                                                            position: 'center',
                                                            size: 'full'
                                                        });
                                                    }
                                                }
                                            ]} />
                                    } >
                                    <Glyphicon glyph="plus"/>
                                </ToolbarPopover>
                            </div>}
                        </div>
                    );
                })}
            </div>
        );
    }

    addContent = (idx, content) => {
        const text = this.state.text
            .reduce((newText, atom, orderId) => {
                return [
                    ...newText,
                    atom,
                    ...(orderId === idx
                        ? [ content ]
                        : [ ])
                ];
            }, []);
        this.setState({ text });
        this.props.onChange(text);
    }

    removeContent = (id) => {
        const text = this.state.text.filter(atom => atom.id !== id);
        this.setState({ text });
        this.props.onChange(text);
    }

    updateContent = (id, value) => {
        const text = this.state.text.map(atom => {
            if (atom.id === id) {
                return {
                    ...atom,
                    ...value
                };
            }
            return atom;
        });
        this.props.onChange(text);
        this.setState({ text });
    }
}

const fields = {
    cover: (props) => {
        return (
            <Container
                type="stretch"
                id={props.id}
                width={props.width}
                height={props.height}
                transparent
                contentCentered={
                    <TextWrapper
                        size={props.textContainerSize || 'auto'}
                        position={props.textContainerPosition}
                        transparent={props.textContainerTransparent}
                        invert={props.textStyleInvert}
                        align={props.textAlign}>
                        <ContentEditable
                            key="title"
                            tagName="h1"
                            className="ms-cascade-title"
                            html={props.title}
                            disabled={props.readOnly}
                            onChange={(event) => {
                                props.onChange('title', event.target.value);
                            }} />
                        <ContentEditable
                            key="description"
                            tagName="h3"
                            className="ms-cascade-description"
                            html={props.description}
                            disabled={props.readOnly}
                            onChange={(event) => props.onChange('description', event.target.value)} />
                    </TextWrapper>
                }>
                {props.mediaSrc && <Media
                    id={props.id}
                    type={props.mediaType}
                    cover={props.mediaCover}
                    src={props.mediaSrc}
                    readOnly={props.readOnly}
                    onChange={(changedValue) => {
                        const newValues = mapKeys(changedValue, (value, key) => {
                            return camelCase(`media-${key}`);
                        });
                        props.onChange(undefined, newValues);
                    }} />}
            </Container>
        );
    },
    title: (props) => {
        return (
            <Container
                type="auto"
                id={props.id}
                width={props.width}
                height={props.height}
                contentCentered={
                    <TextWrapper
                        size={props.textContainerSize || 'auto'}
                        position={props.textContainerPosition}
                        transparent={props.textContainerTransparent}
                        invert={props.textStyleInvert}
                        align={props.textAlign}>
                        <ContentEditable
                            key="title"
                            tagName="h1"
                            className="ms-cascade-title"
                            html={props.title}
                            disabled={props.readOnly}
                            onChange={(event) => props.onChange('title', event.target.value)} />
                    </TextWrapper>
                }>
                {props.mediaSrc && <Media
                    id={props.id}
                    type={props.mediaType}
                    cover={props.mediaCover}
                    src={props.mediaSrc}
                    readOnly={props.readOnly}
                    onChange={(changedValue) => {
                        const newValues = mapKeys(changedValue, (value, key) => {
                            return camelCase(`media-${key}`);
                        });
                        props.onChange(undefined, newValues);
                    }} />}
            </Container>
        );
    },
    paragraph: (props) => {
        return (
            <Container
                type="auto"
                id={props.id}
                width={props.width}
                height={props.height}
                transparent={props.transparent}>
                <PageWrapper>
                    <ContentEditor
                        id={props.id}
                        text={props.text}
                        readOnly={props.readOnly}
                        onChange={(value) => props.onChange('text', value)}/>
                </PageWrapper>
            </Container>
        );
    },
    column: (props) => {
        return (
            <Container
                type="stretch"
                id={props.id}
                width={props.width}
                height={props.height}
                transparent
                contentCentered={
                    <TextWrapper
                        size={props.textContainerSize || 'medium'}
                        position={props.textContainerPosition || 'left'}
                        transparent={props.textContainerTransparent}
                        invert={props.textStyleInvert}
                        align={props.textAlign || 'left'}>
                        <ContentEditor
                            id={props.id}
                            text={props.text}
                            readOnly={props.readOnly}
                            onChange={(value) => props.onChange('text', value)}/>
                    </TextWrapper>
                } />
        );
    },
    media: () => {
        return null;
    }
};

export default fields;
