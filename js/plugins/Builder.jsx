
import React from 'react';
import PropTypes from 'prop-types';
import { Glyphicon } from 'react-bootstrap';
import { capitalize, head } from 'lodash';
import ContainerDimensions from 'react-container-dimensions';

import BorderLayout from '@mapstore/components/layout/BorderLayout';
import SideGrid from '@mapstore/components/misc/cardgrids/SideGrid';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import emptyState from '@mapstore/components/misc/enhancers/emptyState';

import draggableContainer from './mapstore/draggableContainer';
import draggableComponent from './mapstore/draggableComponent';
import SideCard from './mapstore/SideCard';
import Media from './Media';

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
    if (content.background) return content.background;
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
                {mediaProps && mediaProps.type !== 'map' && <Media {...mediaProps} cover={false}/>}
                {mediaProps && mediaProps.type === 'map' && <Glyphicon glyph="1-map" style={{ fontSize: height / 2, margin: 'auto' }}/>}
            </div>
        </div>
    ) : null;
};

const mapSectionsToItems = ({
    contents,
    type,
    id,
    selected,
    onSort = () => {},
    onSelect = () => {}
}) => {
    // const { title, text } = contents && contents.length === 1 && contents[0].foreground || {};
    return {
        id: id,
        selected: id === selected,
        preview: <Icon type={type}/>,
        title: /*title || text ||*/ capitalize(type) + ' Section',
        description: `type: ${type}`,
        onClick: (data, event) => {
            event.stopPropagation();
            onSelect(id);
        },
        style: {
            borderTop: '2px solid #333333'
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
                            title: capitalize(content.type),
                            description: `type: ${content.type}`,
                            body: (
                                <ContainerDimensions>
                                    <Preview content={content}/>
                                </ContainerDimensions>
                            )
                        };
                    })}/>
            </div>
            :
            <ContainerDimensions>
                <Preview content={contents[0]}/>
            </ContainerDimensions>
    };
};

class Builder extends React.Component {

    static propTypes = {
        sections: PropTypes.array,
        // selected: PropTypes.string,
        onSort: PropTypes.func,
        onRemove: PropTypes.func,
        onPreview: PropTypes.func,
        readOnly: PropTypes.bool
    };

    static defaultProps = {
        sections: [ ],
        onSort: () => {},
        onPreview: () => {}
    };

    state = {};

    render() {
        return (
            <BorderLayout
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
                                    glyph: 'cog'
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
                                selected: this.state.selected,
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
