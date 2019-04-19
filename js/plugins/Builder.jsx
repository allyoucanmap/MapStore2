
import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, FormControl, ControlLabel, Glyphicon, Checkbox } from 'react-bootstrap';
import { capitalize, head } from 'lodash';
import ContainerDimensions from 'react-container-dimensions';
import ContentEditable from 'react-contenteditable';

import BorderLayout from '@mapstore/components/layout/BorderLayout';
import SideGrid from '@mapstore/components/misc/cardgrids/SideGrid';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import emptyState from '@mapstore/components/misc/enhancers/emptyState';

import draggableContainer from './mapstore/draggableContainer';
import draggableComponent from './mapstore/draggableComponent';
import SideCard from './mapstore/SideCard';
import MediaSource from './MediaSource';

const DraggableSideCard = draggableComponent(SideCard);
const DraggableSideGrid = emptyState(({ readOnly }) => readOnly, {
    glyph: 'story',
    title: 'GeoStory Editor'
})(draggableContainer(SideGrid));

const Icon = ({ type }) => {
    const glyphs = {
        cover: 'font',
        title: 'font',
        paragraph: 'sheet',
        immersive: 'picture',
        columnleft: 'align-left',
        columncenter: 'align-center',
        columnright: 'align-right'
    };
    return <Glyphicon glyph={glyphs[type] || 'question-sign'}/>;
};

const getMediaPropsFromContent = (content = {}) => {
    if (content.background) {
        const { type, src, cover } = content.background;
        return {
            type,
            src,
            cover
        };
    }
    if (content.foreground && content.foreground.mediaType && content.foreground.mediaSrc) {
        return {
            type: content.foreground.mediaType,
            src: content.foreground.mediaSrc,
            cover: content.foreground.mediaCover
        };
    }
    return null;
};

const Preview = ({ width, content = {} }) => {
    const res = 1080 / 1920;
    const height = width * res;
    const mediaProps = getMediaPropsFromContent(content);

    return mediaProps ? (
        <div style={{ position: 'relative', width, height }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#dddddd', display: 'flex' }}>
                {mediaProps && mediaProps.type !== 'map' && <MediaSource {...mediaProps} cover />}
                {mediaProps && mediaProps.type === 'map' && <Glyphicon glyph="1-map" style={{ fontSize: height / 2, margin: 'auto' }}/>}
            </div>
        </div>
    ) : null;
};

const mapSectionsToItems = ({
    contents,
    type,
    title,
    id,
    selected,
    onSort = () => {},
    onSelect = () => {},
    onChange = () => {},
    onZoomTo = () => {},
    compactCards,
    currentSlide = {}
}) => {
    return {
        id: id,
        selected: id === selected,
        preview: <Icon type={type}/>,
        tools: <Toolbar
            btnDefaultProps={{
                className: 'square-button-md no-border'
            }}
            buttons={[
                {
                    glyph: 'zoom-to',
                    visible: contents.length === 1,
                    tooltip: 'Zoom to content',
                    onClick: (event) => {
                        event.stopPropagation();
                        onZoomTo({
                            sectionId: id
                        });
                    }
                }
            ]}/>,
        title: <ContentEditable
            key="title"
            tagName="span"
            html={title}
            style={{
                minHeight: 20,
                display: 'block'
            }}
            onChange={(event) => {
                onChange({
                    title: event.target.value
                });
            }} />,
        description: `type: ${type}`,
        onClick: (data, event) => {
            event.stopPropagation();
            onSelect(id);
        },
        style: {
            borderTop: currentSlide.sectionId === id ? 'none' : '2px solid #333333',
            outline: currentSlide.sectionId === id ? '2px solid #09b3d4' : 'none'
        },
        body: contents && contents.length > 1
            ? <div style={{ position: 'relative' }}>
                <DraggableSideGrid
                    containerId={id}
                    isDraggable
                    cardComponent={DraggableSideCard}
                    onItemClick={(item) => {
                        onSelect(item.id);
                    }}
                    onSort={(moveTo, moveFrom) => onSort(moveTo, moveFrom)}
                    items={contents.map((content) => {
                        const foreground = content && content.foreground || {};
                        return {
                            id: content.id,
                            selected: content.id === selected,
                            onClick: (data, event) => {
                                event.stopPropagation();
                                onSelect(content.id);
                            },
                            preview: <Icon type={content.type + (foreground.textContainerPosition || '')}/>,
                            tools: <Toolbar
                                btnDefaultProps={{
                                    className: 'square-button-md no-border'
                                }}
                                buttons={[
                                    {
                                        glyph: 'zoom-to',
                                        tooltip: 'Zoom to content',
                                        onClick: (event) => {
                                            event.stopPropagation();
                                            onZoomTo({
                                                sectionId: id,
                                                contentId: content.id
                                            });
                                        }
                                    }
                                ]}/>,
                            title: capitalize(content.type),
                            description: `type: ${content.type}`,
                            style: {
                                outline: currentSlide.contentId === content.id ? '2px solid #09b3d4' : 'none'
                            },
                            body: compactCards ? null : (
                                <ContainerDimensions>
                                    <Preview content={content}/>
                                </ContainerDimensions>
                            )
                        };
                    })}/>
            </div>
            : compactCards ? null :
            <ContainerDimensions>
                <Preview content={contents[0]}/>
            </ContainerDimensions>
    };
};

// Same structure as MediaForm
const Settings = ({
    onBack = () => {},
    // onChange = () => {},
    // onSave = () => {},
    form = [
        {
            placeholder: 'Enter title',
            type: 'text',
            id: 'title',
            label: 'Title'
        },
        {
            placeholder: 'Enter logo src (image format)',
            type: 'text',
            id: 'logo',
            label: 'Logo'
        },
        {
            type: 'checkbox',
            id: 'autoplay',
            placeholder: 'Enable autoplay',
            label: 'Autoplay'
        },
        {
            type: 'checkbox',
            id: 'navbar',
            placeholder: 'Show navbar',
            label: 'Navbar'
        }
    ]
}) => {
    // const [ properties, setProperties ] = useState(media);

    return (
        <BorderLayout
            className="ms-geostory-builder"
            header={
                <div
                    className="text-center"
                    key="toolbar"
                    style={{
                        borderBottom: '1px solid #ddd',
                        padding: 8
                    }}>
                    <Toolbar
                        btnGroupProps={{
                            style: {
                                marginBottom: 8
                            }
                        }}
                        btnDefaultProps={{
                            bsStyle: 'primary',
                            className: 'square-button-md'
                        }}
                        buttons={[{
                            glyph: 'arrow-left',
                            tooltip: 'Back to builder',
                            onClick: () => onBack()
                        }, {
                            tooltip: 'Save settings',
                            glyph: 'floppy-disk'
                        }]}/>
                    <h4>Story Settings</h4>
                </div>
            }>
            <Form style={{ padding: 8 }}>
                {form.map((field) => field.type === 'checkbox'
                ? (
                    <FormGroup key={field.id}>
                        {field.label && <ControlLabel>
                            {field.label}
                        </ControlLabel>}
                        <Checkbox>
                            {field.placeholder}
                        </Checkbox>
                    </FormGroup>
                )
                : (
                    <FormGroup key={field.id}>
                        {field.label && <ControlLabel>
                            {field.label}
                        </ControlLabel>}
                        <FormControl
                            type={field.type}
                            placeholder={field.placeholder} />
                    </FormGroup>
                ))}
            </Form>
        </BorderLayout>
    );
};

class Builder extends React.Component {

    static propTypes = {
        sections: PropTypes.array,
        currentSlide: PropTypes.object,
        // selected: PropTypes.string,
        onSort: PropTypes.func,
        onRemove: PropTypes.func,
        onPreview: PropTypes.func,
        readOnly: PropTypes.bool,
        onChange: PropTypes.func,
        onZoomTo: PropTypes.func
    };

    static defaultProps = {
        sections: [ ],
        onSort: () => {},
        onPreview: () => {},
        onChange: () => {},
        onZoomTo: () => {}
    };

    state = {
        compactCards: true
    };

    render() {
        return ( this.state.status === 'settings' ?
            <Settings
                onBack={() => this.setState({ status: '' })}/>
            : <BorderLayout
                className="ms-geostory-builder"
                header={
                    <div
                        className="text-center"
                        style={{
                            padding: '8px 16px',
                            borderBottom: '1px solid #ddd'
                        }}>
                        <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md',
                                bsStyle: 'primary'
                            }}
                            buttons={[
                                {
                                    glyph: 'trash',
                                    tooltip: 'Remove selected section',
                                    disabled: !this.state.selected || this.props.sections.length === 1 || this.props.readOnly,
                                    onClick: () => {
                                        this.props.onRemove(this.state.selected);
                                    }
                                },
                                {
                                    glyph: 'eye-open',
                                    tooltip: 'Show preview',
                                    disabled: this.props.readOnly,
                                    onClick: () => this.props.onPreview()
                                },
                                {
                                    tooltip: 'Settings',
                                    disabled: this.props.readOnly,
                                    glyph: 'cog',
                                    onClick: () => this.setState({ status: 'settings' })
                                },
                                {
                                    tooltip: this.state.compactCards ? 'Show preview in cards' : 'Hide preview in cards',
                                    disabled: this.props.readOnly,
                                    bsStyle: this.state.compactCards ? 'primary' : 'success',
                                    active: !this.state.compactCards,
                                    glyph: 'list-alt',
                                    onClick: () => this.setState({ compactCards: !this.state.compactCards })
                                }
                                /*,
                                {
                                    tooltip: 'Share this story',
                                    disabled: this.props.readOnly,
                                    glyph: 'share'
                                }
                                */
                            ]}/>
                    </div>
                }>
                <div
                    style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex' }}>
                    <DraggableSideGrid
                        isDraggable
                        readOnly={this.props.readOnly}
                        containerId="ms-story-builder"
                        cardComponent={DraggableSideCard}
                        size="sm"
                        onSort={(moveTo, moveFrom) => {
                            if (moveTo.containerId === moveFrom.containerId && moveFrom.containerId === 'ms-story-builder') {
                                this.props.onSort(this.sortItems(this.props.sections, moveTo, moveFrom));
                            }
                        }}
                        items={
                            this.props.sections.map((item) => mapSectionsToItems({
                                ...item,
                                compactCards: this.state.compactCards,
                                selected: this.state.selected,
                                onZoomTo: this.props.onZoomTo,
                                currentSlide: this.props.currentSlide,
                                onChange: (value) => this.props.onChange({
                                    sectionId: item.id,
                                    ...value
                                }),
                                onSelect: (selectedId) => {
                                    const selected = selectedId === this.state.selected ? null : selectedId;
                                    this.setState({ selected });
                                },
                                onSort: (moveTo, moveFrom) => {
                                    if (moveTo.containerId === moveFrom.containerId && moveFrom.containerId === item.id) {
                                        const sections = this.props.sections.map((section) => {
                                            if (section.id === item.id) {
                                                const contents = this.sortItems(section.contents, moveTo, moveFrom);
                                                return {
                                                    ...section,
                                                    contents
                                                };
                                            }
                                            return section;
                                        });
                                        this.props.onSort(sections);
                                    }
                                }
                            }))
                        }/>
                </div>
            </BorderLayout>
        );
    }
    sortItems = (items, moveTo, moveFrom) => {
        const moved = head(items.filter(({ id }) => id === moveFrom.id));
        const isBelow = moveFrom.sortId < moveTo.sortId;
        return items
            .reduce((sertedItems, item, sortId) => {
                if (sortId === moveFrom.sortId) {
                    return sertedItems;
                }
                if (sortId === moveTo.sortId) {
                    return [
                        ...sertedItems,
                        ...(
                            isBelow ? [ item, moved ] : [ moved, item ]
                        )
                    ];
                }
                return [ ...sertedItems, item ];
            }, []);
    }
}

export default Builder;
