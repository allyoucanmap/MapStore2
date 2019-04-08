import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from "react-contenteditable";
import { Glyphicon, DropdownButton as DropdownButtonRB, MenuItem } from 'react-bootstrap';

import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import tooltip from '@mapstore/components/misc/enhancers/tooltip';

import Container from './Container';
import Media from './Media';
import ToolbarPopover from './ToolbarPopover';
import TextEditor from './TextEditor';

const DropdownButton = tooltip(DropdownButtonRB);

const TextWrapper = (props) => {
    const alignClass = ` text-${props.align || 'center'}`;
    const positionClass = `${props.position ? ` ms-${props.position}` : ''}`;
    const sizeClass = `${props.size ? ` ms-${props.size}` : ''}`;
    const invertClass = `${props.invert ? ` ms-invert` : ''}`;
    const transparentClass = `${props.transparent ? ` ms-transparent` : ''}`;
    return (
        <div
            className={`ms-cascade-field-text${positionClass}${sizeClass}${invertClass}${transparentClass}${alignClass}`}
            style={props.style || {}}>
            {props.children}
        </div>
    );
};

const PageWrapper = (props) => {
    return (
        <div className="ms-cascade-wrapper">
            {props.children}
        </div>
    );
};


class MediaEditor extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        text: PropTypes.array,
        size: PropTypes.string,
        position: PropTypes.string,
        onChange: PropTypes.func,
        readOnly: PropTypes.bool
    };

    render() {
        return (
            <TextWrapper
                size="medium"
                position={this.props.position || 'center'}
                size={this.props.size || 'medium'}
                style={{
                    padding: 0,
                    boxShadow: 'none'
                }}>
                <Media
                    id={this.props.id}
                    type="image"
                    src={'assets/img/stsci-h-p1821a-m-1699x2000.png'}
                    style={{
                        minHeight: 200,
                        position: 'relative'
                    }}/>
            </TextWrapper>
        );
    }
}

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
                    type: 'text',
                    html: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                }
            ]
        });
    }

    render() {
        return (
            <div>
                {this.state.text.map((atom, idx) => {
                    return (
                        <div>
                            {!this.props.readOnly && <div className="text-right" style={{paddingBottom: 8}}>
                                <Toolbar
                                    btnDefaultProps={{
                                        className: 'square-button-md no-border'
                                    }}
                                    buttons={atom.type === 'media' ? [
                                        {
                                            glyph: 'trash',
                                            tooltip: 'Remove content',
                                            visible: this.state.text.length > 1 ? true : false,
                                            onClick: () => this.removeContent(atom.id)
                                        },
                                        {
                                            Element: () => {
                                                const items = [
                                                    {
                                                        key: 'small',
                                                        label: 'Small'
                                                    },
                                                    {
                                                        key: 'medium',
                                                        label: 'Medium'
                                                    },
                                                    {
                                                        key: 'large',
                                                        label: 'Large'
                                                    }
                                                ];
                                                return (
                                                    <DropdownButton
                                                        noCaret
                                                        tooltip="Change size"
                                                        className="square-button-md no-border"
                                                        pullRight
                                                        title={<Glyphicon glyph="resize-horizontal"/>}>
                                                        {items.filter(item => item.key !== atom.size).map((item) => (
                                                            <MenuItem
                                                                key={item.key}
                                                                onClick={() => {
                                                                    this.updateContent(atom.id, 'size', item.key);
                                                                }}>
                                                                {item.label}
                                                            </MenuItem>
                                                        ))}
                                                    </DropdownButton>
                                                );
                                            }
                                        },
                                        {
                                            Element: () => {
                                                const items = [
                                                    {
                                                        key: 'left',
                                                        label: 'Align left',
                                                        glyph: 'align-left'
                                                    },
                                                    {
                                                        key: 'center',
                                                        label: 'Align center',
                                                        glyph: 'align-center'
                                                    },
                                                    {
                                                        key: 'right',
                                                        label: 'Align right',
                                                        glyph: 'align-right'
                                                    }
                                                ];
                                                return (
                                                    <DropdownButton
                                                        noCaret
                                                        disabled={!!(atom.size === 'large')}
                                                        tooltip="Align content"
                                                        className="square-button-md no-border"
                                                        pullRight
                                                        title={<Glyphicon glyph={`align-${atom.position || 'center'}`}/>}>
                                                        {items.filter(item => item.key !== atom.position).map((item) => (
                                                            <MenuItem
                                                                key={item.key}
                                                                onClick={() => {
                                                                    this.updateContent(atom.id, 'position', item.key);
                                                                }}>
                                                                <Glyphicon glyph={`align-${item.key}`}/> {item.label}
                                                            </MenuItem>
                                                        ))}
                                                    </DropdownButton>
                                                );
                                            }
                                        },
                                        {
                                            tooltip: 'Edit media content',
                                            glyph: 'cog'
                                        }

                                    ] : [
                                        {
                                            glyph: 'trash',
                                            tooltip: 'Remove content',
                                            visible: this.state.text.length > 1 ? true : false,
                                            onClick: () => this.removeContent(atom.id)
                                        }
                                    ]}/>
                            </div>}
                            {atom.type === 'text' &&
                                <TextEditor
                                    key={atom.id}
                                    html={atom.html}
                                    readOnly={this.props.readOnly}
                                    onChange={(value) => this.updateContent(atom.id, 'html', value)} />}
                            {atom.type === 'media' &&
                                <MediaEditor
                                    id={`${this.props.id}_${atom.id}`}
                                    key={atom.id}
                                    position={atom.position}
                                    readOnly={this.props.readOnly}
                                    size={atom.size}/>}
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
                                                            type: 'text',
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
                                                            type: 'media',
                                                            position: 'center',
                                                            size: 'medium'
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

    updateContent = (id, key, value) => {
        const text = this.state.text.map(atom => {
            if (atom.id === id) {
                return {
                    ...atom,
                    [key]: value
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
                {props.mediaSrc && <Media id={props.id} type={props.mediaType} cover={props.mediaCover} src={props.mediaSrc} />}
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
                {props.mediaSrc && <Media id={props.id} type={props.mediaType} cover={props.mediaCover} src={props.mediaSrc} />}
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
