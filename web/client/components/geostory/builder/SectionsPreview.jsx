/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import capitalize from "lodash/capitalize";
import get from 'lodash/get';
import ContainerDimensions from 'react-container-dimensions';
import { Glyphicon } from 'react-bootstrap';
import Toolbar from '../../misc/toolbar/Toolbar';

import SideGrid from '../../misc/cardgrids/SideGrid';
import SideCard from '../../misc/cardgrids/SideCard';
import draggableContainer from '../../misc/enhancers/draggableContainer';
import draggableComponent from '../../misc/enhancers/draggableComponent';

const DraggableSideCard = draggableComponent(SideCard);
const DraggableSideGrid = draggableContainer(SideGrid);

/**
 * Renders icon for the Section or content provided
 * @param {object} content content or section of the type of the icon you want to render
 */
const Icon = ({ type } = {}) => {
    const glyphs = {
        text: 'sheet',
        image: 'picture',
        map: '1-map',
        columnleft: 'align-left',
        columnright: 'align-right',
        columncenter: 'align-center'
    };
    /*<Glyphicon glyph={glyphs[type] || 'picture'} />*/
    return <img src={'https://demo.geo-solutions.it/mockups/mapstore2/geostory/assets/img/stsci-h-p1821a-m-1699x2000.jpg'}/>;
};

/**
 * Preview view for a geostory-content
 * @param {object} [content={}] content that have to render preview
 */
const Preview = ({ width, content } = {}) => {
    const res = 1080 / 1920;
    const height = width * res;
    const type = get(content, 'background.type');
    const thumbnail = get(content, 'background.thumbnail');
    return (
        <div className="ms-section-preview" style={{ width, height }}>
            <div className="ms-section-preview-icon">
                {thumbnail && <img src={thumbnail}/>
                    || <Icon type={type}/>}
            </div>
        </div>
    );
};

const previewContents = {
    title: ({ contents, cardPreviewEnabled }) =>
        cardPreviewEnabled
        ? (<ContainerDimensions>
            <Preview content={contents && contents[0]} />
        </ContainerDimensions>)
        : null,
    paragraph: ({ id, contents, cardPreviewEnabled, scrollTo }) => (
            <div style={{ position: 'relative' }}>
            <DraggableSideGrid
                containerId={id}
                isDraggable
                /*onSort={(sortIdFrom, sortIdTo, itemDataFrom, itemDataTo) => {
                    console.log('CONTENTS', itemDataFrom, itemDataTo);
                }}*/
                cardComponent={DraggableSideCard}
                items={contents.map((content) => {
                    const contentType = content.type === 'column'
                        ? `${content.type}${content.align || 'center'}`
                        : content.type;
                    const PreviewContents = previewContents[content.type];
                    return {
                        id: content.id,
                        preview: <Icon type={contentType} />,
                        tools: <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md no-border'
                            }}
                            buttons={[
                                {
                                    glyph: 'zoom-to',
                                    tooltipId: "geostory.zoomToContent",
                                    onClick: () => scrollTo(content.id)
                                }
                            ]} />,
                        title: capitalize(content.type),
                        description: `type: ${content.type}`,
                        body: PreviewContents
                            && <PreviewContents
                                scrollTo={scrollTo}
                                cardPreviewEnabled={cardPreviewEnabled}
                                contents={content.contents}/>/*cardPreviewEnabled ? (
                            <ContainerDimensions>
                                <Preview content={content} />
                            </ContainerDimensions>
                        ) : null*/
                    };
                })} />
        </div>
        ),
    column: ({ id, contents, cardPreviewEnabled, scrollTo }) => (
        <div style={{ position: 'relative' }}>
            <DraggableSideGrid
                containerId={id}
                isDraggable
                cardComponent={DraggableSideCard}
                items={contents.map((content) => {
                    const contentType = content.type === 'column'
                        ? `${content.type}${content.align || 'center'}`
                        : content.type;
                    const PreviewContents = previewContents[content.type];
                    return {
                        id: content.id,
                        preview: <Icon type={contentType} />,
                        tools: <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md no-border'
                            }}
                            buttons={[
                                {
                                    glyph: 'zoom-to',
                                    tooltipId: "geostory.zoomToContent",
                                    onClick: () => scrollTo(content.id)
                                }
                            ]} />,
                        title: capitalize(content.type),
                        description: `type: ${content.type}`,
                        body: cardPreviewEnabled && PreviewContents
                            && <PreviewContents />
                    };
                })} />
        </div>
    ),
    immersive: ({ id, contents, cardPreviewEnabled, scrollTo }) => (
        <div style={{ position: 'relative' }}>
            <DraggableSideGrid
                containerId={id}
                isDraggable
                /*onSort={(sortIdFrom, sortIdTo, itemDataFrom, itemDataTo) => {
                    console.log('CONTENTS', itemDataFrom, itemDataTo);
                }}*/
                cardComponent={DraggableSideCard}
                items={contents.map((content) => {
                    const contentType = content.type === 'column'
                        ? `${content.type}${content.align || 'center'}`
                        : content.type;
                    const PreviewContents = previewContents[content.type];
                    return {
                        id: content.id,
                        preview: <Icon type={contentType} />,
                        tools: <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md no-border'
                            }}
                            buttons={[
                                {
                                    glyph: 'zoom-to',
                                    tooltipId: "geostory.zoomToContent",
                                    onClick: () => scrollTo(content.id)
                                }
                            ]} />,
                        title: capitalize(content.type),
                        description: `type: ${content.type}`,
                        body: PreviewContents
                            && <PreviewContents
                                scrollTo={scrollTo}
                                cardPreviewEnabled={cardPreviewEnabled}
                                contents={content.contents}/>/*cardPreviewEnabled ? (
                            <ContainerDimensions>
                                <Preview content={content} />
                            </ContainerDimensions>
                        ) : null*/
                    };
                })} />
        </div>
    )
};

/**
 * Transforms a geostory section into a SideGrid item.
 * @param {object} section the section to transform
 */
const sectionToItem = ({scrollTo, cardPreviewEnabled = false, currentPage}) => ({
    contents,
    type,
    title,
    id
}) => {
    const PreviewContents = previewContents[type];
    return {
        id: id,
        preview: <Icon type={type} />,
        className: currentPage && currentPage.sectionId === id
            ? 'ms-highlight'
            : '',
        tools: <Toolbar
            btnDefaultProps={{
                className: 'square-button-md no-border'
            }}
            buttons={[
                {
                    onClick: () => scrollTo(id),
                    glyph: 'zoom-to',
                    // visible: type !== 'immersive',
                    tooltipId: "geostory.zoomToContent"
                }
            ]} />,
        title,
        description: `type: ${type}`,
        body: !cardPreviewEnabled ?
        PreviewContents &&
            <PreviewContents
                scrollTo={scrollTo}
                cardPreviewEnabled={cardPreviewEnabled}
                contents={contents}/>
        : null
    };

};

/**
 * Shows a preview list of the slides/sections of a story
 * @SectionsPreview
 * @param {object[]} [sections=[]] Array of sections to display
 */
export default ({ sections = [], scrollTo, cardPreviewEnabled, currentPage, onSort }) => (<DraggableSideGrid
    isDraggable
    onSort={(sortIdTo, sortIdFrom, itemDataTo, itemDataFrom) => {
        if (itemDataTo.containerId === 'story-sections'
        && itemDataFrom.containerId === 'story-sections') {
            const source = `sections[{ "id": "${itemDataFrom.id}" }]`;
            const target = `sections`;
            const position = sortIdTo > sortIdFrom
                ? sortIdTo + 1
                : sortIdTo;
            onSort(source, target, position);
        }
    }}
    containerId="story-sections"
    cardComponent={DraggableSideCard}
    size="sm"
    items={
        sections.map(sectionToItem({ currentPage, cardPreviewEnabled, scrollTo }))
} />);
