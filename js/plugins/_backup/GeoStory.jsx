/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { max, min, head } from 'lodash';
import ContainerDimensions from 'react-container-dimensions';
import ContentEditable from "react-contenteditable";
import { ButtonToolbar } from 'react-bootstrap';
import uuidv1 from 'uuid/v1';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import stickybits from 'stickybits';

import BorderLayout from '@mapstore/components/layout/BorderLayout';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import InfoPopover from '@mapstore/components/widgets/widget/InfoPopover';
import MapView from '@mapstore/components/widgets/widget/MapView';

import withScrollSpy from './mapstore/withScrollSpy';
import { Parallax, ParallaxLayer } from './spring/Parallax';

import mapConfig from './data/mapConfig';
import stories from './data/mockupStory';

import Builder from './Builder';

/*
const Parallax = shouldUpdate((props, nextProps) => {
    return props.pages !== nextProps.pages
    || !isEqual(props.config, nextProps.config)
    || !isEqual(props.children, nextProps.children);
})(ParallaxRS);*/

/*
Parallax.StickyLayer = class extends React.Component {

    static contextTypes = { parallax: PropTypes.object }

    static propTypes = {
        factor: PropTypes.number,
        offset: PropTypes.number,
        speed: PropTypes.number,
        length: PropTypes.number
    }
    static defaultProps = {
        factor: 1,
        offset: 0,
        speed: 0,
        length: 1
    }

    constructor(props, context) {
        super(props, context);
        const parallax = context.parallax;
        const targetScroll = Math.floor(props.offset) * parallax.space;
        const offset = parallax.space * props.offset + targetScroll * props.speed;
        const toValue = parseFloat(-(parallax.current * props.speed) + offset);
        this.animatedTranslate = new Animated.Value(toValue);
        this.animatedSpace = new Animated.Value(parallax.space * props.factor);
    }

    componentDidMount() {
        const parent = this.context.parallax;
        if (parent) {
            parent.layers = parent.layers.concat(this);
            parent.update();
        }
    }

    componentWillUnmount() {
        const parent = this.context.parallax;
        if (parent) {
            parent.layers = parent.layers.filter(layer => layer !== this);
            parent.update();
        }
    }

    setPosition(height, scrollTop, immediate = false) {
        const page = Math.floor(this.context.parallax.current / this.context.parallax.space);
        const getValue = (currrentOffset) => {
            const targetScroll = Math.floor(currrentOffset) * height;
            const offset = height * currrentOffset + targetScroll * this.props.speed;
            return parseFloat(-(scrollTop * this.props.speed) + offset);
        };
        if (page < this.props.offset) {
            this.isSticky = false;
            if (this.div) this.div.style.top = undefined;
            const toValue = getValue(this.props.offset);
            if (!immediate) this.context.parallax.props.effect(this.animatedTranslate, toValue).start();
            else this.animatedTranslate.setValue(toValue);
        } else if (page >= this.props.offset && page < this.props.offset + this.props.length) {
            this.isSticky = true;
            this.animatedTranslate.setValue(scrollTop);
        } else {
            this.isSticky = false;
            if (this.div) this.div.style.top = undefined;
            const toValue = getValue(this.props.offset + this.props.length);
            if (!immediate) this.context.parallax.props.effect(this.animatedTranslate, toValue).start();
            else this.animatedTranslate.setValue(toValue);
        }
    }

    setHeight(height, immediate = false) {
        const toValue = parseFloat(height * this.props.factor);
        if (!immediate) this.context.parallax.props.effect(this.animatedSpace, toValue).start();
        else this.animatedSpace.setValue(toValue);
    }

    render() {
        const { style, children, offset, speed, factor, className, ...props } = this.props;
        const horizontal = this.context.parallax.props.horizontal;
        const translate3d = this.animatedTranslate.interpolate({
            inputRange: [0, 1],
            outputRange: horizontal ? ['0px,0,0', '1px,0,0'] : ['0,0px,0', '0,1px,0']
        });

        return (
            <Animated.div
                {...props}
                ref="layer"
                className={className}
                style={{
                    position: 'absolute',
                    backgroundSize: 'auto',
                    backgroundRepeat: 'no-repeat',
                    willChange: 'transform',
                    [horizontal ? 'height' : 'width']: '100%',
                    [horizontal ? 'width' : 'height']: this.animatedSpace,
                    WebkitTransform: [{ translate3d }],
                    MsTransform: [{ translate3d }],
                    transform: [{ translate3d }],
                    ...style
                }}>
                {children}
            </Animated.div>
        );
    }
};*/

const BackgroundMedia = ({ id, src, type, cover, invert }) => {
    const mediaRef = useRef(null);
    return (
        <div className={`ms-background${cover ? ' cover' : ''}${invert ? ` ms-invert` : ''}`}>
            {type === 'image' && <img src={src} />}
            {type === 'map' && <MapView
                id={id}
                options={{
                    style: {
                        width: '100%',
                        height: '100%'
                    }
                }}
                { ...src } />}
            {type === 'video' && <video
                src={src}
                ref={videoRef => {
                    mediaRef.current = videoRef;
                }}
                onClick={() => {
                    if (mediaRef.current) {
                        if (mediaRef.current.paused) {
                            mediaRef.current.play();
                        } else {
                            mediaRef.current.pause();
                        }
                    }
                }} />}
        </div>
    );
};

const Container = ({
    id,
    children,
    transparent,
    type,
    height,
    width,
    contentCentered,
    textStyle,
    ...props
}) => {

    const styles = {
        fixed: {
            width,
            height
        },
        stretch: {
            minHeight: height
        },
        auto: {
            width: '100%'
        }
    };

    const style = styles[type] || {};

    return (
        <div
            {...props}
            className="ms-cascade-field"
            data-field-id={id}
            data-type="field"
            style={{
                ...style,
                backgroundColor: transparent ? 'transparent' : undefined
            }}>
            {children}
            {contentCentered &&
                <div className="ms-cascade-field-centered">
                    <div>
                        {textStyle
                            ? <div className={`text-${textStyle.align || 'center'} ms-cascade-field-text${textStyle.position ? ` ms-${textStyle.position}` : ''}${textStyle.size ? ` ms-${textStyle.size}` : ''}${textStyle.invert ? ` ms-invert` : ''}${textStyle.transparent ? ` ms-transparent` : ''}`}>
                                {contentCentered}
                            </div>
                            : contentCentered
                        }
                    </div>
                </div>}
        </div>
    );
};

const fields = {
    cover: (props) => {
        return (
            <Container
                type="stretch"
                id={props.id}
                width={props.width}
                height={props.height}
                transparent
                textStyle={{
                    size: props.textContainerSize,
                    position: props.textContainerPosition,
                    transparent: props.textContainerTransparent,
                    invert: props.textStyleInvert,
                    align: props.textAlign
                }}
                contentCentered={[
                    <ContentEditable
                        key="title"
                        tagName="h1"
                        className="ms-cascade-title"
                        html={props.title}
                        disabled={!props.edit}
                        onChange={(event) => props.onChange('title', event.target.value)} />,
                    <ContentEditable
                        key="description"
                        tagName="h3"
                        className="ms-cascade-description"
                        html={props.description}
                        disabled={!props.edit}
                        onChange={(event) => props.onChange('description', event.target.value)} />
                ]
                }>
                {props.mediaSrc && <BackgroundMedia id={props.id} type={props.mediaType} cover={props.mediaCover} src={props.mediaSrc} />}
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
                textStyle={{
                    size: props.textContainerSize,
                    position: props.textContainerPosition,
                    transparent: props.textContainerTransparent,
                    invert: props.textStyleInvert,
                    align: props.textAlign
                }}
                contentCentered={
                    <ContentEditable
                        key="title"
                        tagName="h1"
                        className="ms-cascade-title"
                        html={props.title}
                        disabled={!props.edit}
                        onChange={(event) => props.onChange('title', event.target.value)} />
                }>
                {props.mediaSrc && <BackgroundMedia id={props.id} type={props.mediaType} cover={props.mediaCover} src={props.mediaSrc} />}
            </Container>
        );
    },
    paragraph: (props) => {
        return (
            <Container
                type="auto"
                id={props.id}
                width={props.width}
                height={props.height}>
                <ContentEditable
                    tagName="p"
                    html={props.text}
                    disabled={!props.edit}
                    onChange={(event) => props.onChange('text', event.target.value)} />
                <div style={{
                    maxWidth: 800,
                    margin: 'auto',
                    width: '100%',
                    height: 200,
                    position: 'relative',
                    pointerEvents: 'auto'
                }}>
                    <BackgroundMedia
                        type="map"
                        src={mapConfig({
                            center: {
                                x: -155.47333333,
                                y: 19.82444444,
                                crs: 'EPSG:4326'
                            }
                        })}/>
                </div>
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
                textStyle={{
                    size: props.textContainerSize || 'medium',
                    position: props.textContainerPosition || 'left',
                    transparent: props.textContainerTransparent,
                    invert: props.textStyleInvert,
                    align: props.textAlign || 'left'
                }}
                contentCentered={
                    <ContentEditable
                        tagName="p"
                        html={props.text}
                        disabled={!props.edit}
                        onChange={(event) => props.onChange('text', event.target.value)} />
                } />
        );
    }/*,
    image: ({ cover, src, width, height }) => {
        return (
            <div
                className="ms-cascade-field ms-cascade-field-image"
                style={{ width, height }}>
                <BackgroundMedia cover={cover} src={src} />
            </div>
        );
    },
    empty: () => {
        return (
            <div className="ms-cascade-field ms-cascade-field-image">

            </div>
        );
    },
    video: () => {
        return (
            <div className="ms-cascade-field ms-cascade-field-image">
                <VideoCover videoOptions={{ src: 'http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4' }} />
            </div>
        );
    },
    map: ({ cover, src }) => {
        return (
            <div className="ms-cascade-field ms-cascade-field-image">
                <BackgroundMedia cover={cover} src={src} />
            </div>
        );
    },
    media: () => {
        return null;
    }*/
};

class Background extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        sections: PropTypes.array,
        sectionsData: PropTypes.object,
        parallax: PropTypes.object
    };

    static defaultProps = {
        width: 0,
        height: 0,
        sections: [],
        sectionsData: {}
    };

    state = {
        page: 0
    };

    componentDidMount() {
        this._stickybits = stickybits('.ms-cascade-bg-container');
    }

    componentWillUnmount() {
        this._stickybits.cleanup();
    }

    render() {
        return (
            <ScrollLayer
                className="ms-cascade-bg-container"
                querySelector="#ms-parallax-container"
                onScroll={() => {
                    const parallax = this.props.parallax;
                    if (parallax) {
                        const page = parallax.current / parallax.space;
                        if (page !== this.state.page) {
                            this.setState({ page });
                        }
                    }
                }}
                style={{
                    width: this.props.width,
                    height: this.props.height,
                    overflow: 'hidden'
                }}>
                {this.props.sections.map(({ id: sectionId, contents }) => {
                    const sectionData = this.props.sectionsData[sectionId] && this.props.sectionsData[sectionId];
                    if (!sectionData) return null;
                    const fieldsData = sectionData && sectionData.fieldsData || {};
                    const offset = sectionData.offset || 0;
                    const top = this.props.height * offset - this.state.page * this.props.height;
                    const relativePage = this.state.page - offset;
                    const page = relativePage < 0 ? 0 : relativePage;
                    const backgrounds = contents
                        .map(({ id, background: bg }) => {
                            const bgData = fieldsData[id] || { offset: 0, factor: 1 };
                            return bg ? { id, ...bg, ...bgData } : null;
                        })
                        .filter(val => val);
                    return (
                        <div
                            key={sectionId}
                            className="ms-cascade-bg"
                            style={
                                {
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    top: top < 0 ? 0 : top
                                }
                            }>
                            <CSSTransitionGroup
                                transitionName="ms-cascade-bg"
                                transitionEnterTimeout={300}
                                transitionLeaveTimeout={300}>
                                {backgrounds
                                    .filter((bg) =>
                                        page >= bg.offset - 0.5 && page < bg.offset + bg.factor - 0.5
                                        || backgrounds.length === 1
                                    )
                                    .map(({ cover, src, id: bgId, type, invert }) => {
                                        return (
                                            <BackgroundMedia
                                                key={bgId}
                                                id={bgId}
                                                type={type}
                                                cover={cover}
                                                src={src}
                                                invert={invert} />
                                        );
                                    }
                                    )}
                            </CSSTransitionGroup>
                        </div>
                    );
                })}
            </ScrollLayer>
        );
    }

}

const ScrollLayer = withScrollSpy({
    querySelector: '#ms-parallax-container'
})(
    (_props) => {
        const { children, querySelector, ...props } = _props;
        return (
            <div {...props}>
                {children}
            </div>
        );
    }
);


class StickyLayer extends React.Component {

    state = {
        position: 0,
        isSticky: false
    }

    onScroll = (container) => {
        const div = ReactDOM.findDOMNode(this);
        const parent = div && div.parentNode;
        if (parent && container) {
            const { top: parentTop, height: parentHeight } = parent.getBoundingClientRect();
            const { top: containerTop } = container.getBoundingClientRect();
            const { height: layerHeight } = div.getBoundingClientRect();
            const topAndHeight = containerTop - parentTop + layerHeight;
            const position = topAndHeight > parentHeight ? parentHeight - layerHeight : containerTop - parentTop;
            if (position !== this.state.position) {
                this.setState({
                    position,
                    isSticky: topAndHeight < parentHeight && parentTop < 0
                });
            }
        }
    };

    render() {
        return (
            <ScrollLayer
                onScroll={(container) => this.onScroll(container)}
                closest
                style={{
                    position: 'absolute',
                    width: '100%',
                    top: this.state.position < 0 ? 0 : this.state.position,
                    opacity: this.state.isSticky ? 0 : 1
                }}>
                {this.props.children}
            </ScrollLayer>
        );
    }
}

class Section extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        type: PropTypes.string,
        viewHeight: PropTypes.number,
        onUpdate: PropTypes.func,
        excludeClassName: PropTypes.string,
        needsUpdate: PropTypes.number,
        onAdd: PropTypes.func
    };

    static defaultProps = {
        id: '',
        viewHeight: 0,
        onUpdate: () => { },
        excludeClassName: 'ms-cascade-section-exclude',
        needsUpdate: -1,
        onAdd: () => { }
    };

    state = {
        height: 0
    };

    componentDidMount() {
        const data = this.getData();
        this.setState({ ...data });
        this.props.onUpdate(data);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.viewHeight !== this.props.viewHeight
            || prevProps.needsUpdate !== this.props.needsUpdate) {
            const data = this.getData();
            this.setState({ ...data });
            this.props.onUpdate(data);
        }
    }

    getData = () => {
        const div = ReactDOM.findDOMNode(this);
        if (div && div.parentNode && div.parentNode.parentNode && div.children) {
            const children = [...div.children]
                .filter((child) => (child.getAttribute('class') || '').indexOf(this.props.excludeClassName) === -1);

            const minTop = min(children.map(child => {
                const { top } = child.getBoundingClientRect();
                return top;
            }));
            // CHECK ON RESIZE
            // const { top: containerTop } = this.div.parentNode.parentNode.getBoundingClientRect();
            const height = max(children.map(child => {
                const { top, height: childHeight } = child.getBoundingClientRect();
                return top + childHeight - minTop; // - containerTop;
            })) || 0;

            const chieldrenFields = div.querySelectorAll('[data-type=\'field\']') || [];

            const fieldsData = [...chieldrenFields].reduce((newFieldsData, childFild) => {
                const fieldId = childFild.getAttribute('data-field-id');
                const { top: fieldTop, height: fieldHeight } = childFild.getBoundingClientRect();
                const offset = (fieldTop - minTop) / this.props.viewHeight;
                const factor = fieldHeight / this.props.viewHeight;
                return {
                    ...newFieldsData,
                    [fieldId]: {
                        offset,
                        factor
                    }
                };
            }, {});

            return {
                id: this.props.id,
                height,
                factor: height / this.props.viewHeight,
                fieldsData
            };
        }
        return 0;
    };

    render() {
        return (
            <div
                className={`ms-cascade-section${this.props.type ? ` ms-${this.props.type}` : ''}`}
                style={{
                    position: 'relative',
                    height: this.state.height,
                    transform: 'translate3d(0px, 0px, 0px)'
                }}>
                {this.props.children}
                <div
                    className={`${this.props.excludeClassName || ''} ms-cascade-edit-tools text-center`}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        backgroundColor: '#ffffff',
                        width: '100%',
                        padding: 8,
                        zIndex: 2,
                        pointerEvents: 'auto'
                    }}>
                    <InfoPopover
                        trigger={['click']}
                        glyph="plus"
                        placement="top"
                        bsStyle="primary"
                        text={
                            <Toolbar
                                btnDefaultProps={{
                                    className: 'square-button btn-tray'
                                }}
                                buttons={[
                                    {
                                        glyph: 'font',
                                        tooltip: 'Add title section',
                                        onClick: () => {
                                            this.props.onAdd({
                                                id: this.props.id,
                                                template: {
                                                    type: 'title',
                                                    id: uuidv1(),
                                                    contents: [
                                                        {
                                                            id: uuidv1(),
                                                            type: 'title',
                                                            factor: 1,
                                                            offset: 0,
                                                            foreground: {
                                                                cover: true,
                                                                mediaSrc: 'assets/img/map.png',
                                                                title: 'Title'
                                                            }
                                                        }
                                                    ]
                                                }
                                            });
                                        }
                                    },
                                    {
                                        glyph: 'sheet',
                                        tooltip: 'Add paragraph section',
                                        onClick: () => {
                                            this.props.onAdd({
                                                id: this.props.id,
                                                template: {
                                                    type: 'paragraph',
                                                    id: uuidv1(),
                                                    pages: 1,
                                                    contents: [
                                                        {
                                                            id: uuidv1(),
                                                            type: 'paragraph',
                                                            factor: 0,
                                                            offset: 0,
                                                            speed: 0,
                                                            foreground: {
                                                                text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                                                            }
                                                        }
                                                    ]
                                                }
                                            });
                                        }
                                    },
                                    {
                                        glyph: 'picture',
                                        tooltip: 'Add immersive section'
                                    }
                                ]} />
                        } />
                </div>
            </div>
        );
    }
}

class BlockLayer extends React.Component {
    render() {
        return (
            <div
                style={{
                    width: '100%'
                }}>
                {this.props.children}
            </div>
        );
    }
}


const Layer = {
    parallax: ParallaxLayer,
    sticky: StickyLayer,
    block: BlockLayer
};

class Cascade extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        sections: PropTypes.array,
        onEdit: PropTypes.func,
        onAdd: PropTypes.func
    };

    static defaultProps = {
        width: 0,
        height: 0,
        sections: [],
        onEdit: () => { },
        onAdd: () => { }
    };

    state = {
        pages: 0
    };

    componentWillMount() {
        this._sectionsData = {};
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.update && this.state.update) {
            const height = Object.keys(this._sectionsData).map((key) => this._sectionsData[key].height || 0).reduce((previous, current) => previous + current);
            if (this.parallax) this.setState({ pages: height / this.parallax.space });
            this.setState({ update: false });
        }
    }

    getOffset = (id) => {
        const sectionIdx = head(this.props.sections
            .map((data, idx) => data.id === id ? idx : null).filter(val => val)) || 0;
        return sectionIdx === 0 ? 0 : this.props.sections
            .filter((data, idx) => idx < sectionIdx)
            .map((data) => this._sectionsData && this._sectionsData[data.id] && this._sectionsData[data.id].factor)
            .reduce((previous, current) => previous + current);
    }

    getSectionData = (data) => {
        const sectionsData = {
            ...this._sectionsData,
            [data.id]: data
        };
        this._sectionsData = Object.keys(sectionsData)
            .reduce((newSectionsData, id) => {
                return {
                    ...newSectionsData,
                    [id]: {
                        ...sectionsData[id],
                        offset: this.getOffset(id)
                    }
                };
            }, {});
    };

    render() {
        return (
            <BorderLayout
                className="ms-cascade-story"
                header={
                    <ButtonToolbar className="ms-cascade-story-header">
                        {this.props.sections.map(({ type, id: sectionId, contents }) => {
                            const { offset, fieldsData = {} } = this._sectionsData[sectionId] || {};
                            return (
                                <Toolbar
                                    buttons={[
                                        {
                                            text: type,
                                            bsSize: 'xs',
                                            bsStyle: 'primary',
                                            onClick: () => this.scrollTo(offset)
                                        },
                                        ...contents.map(({ id: contentId, type: fieldType }) => {
                                            const { offset: fieldOffset } = fieldsData[contentId] || {};
                                            return {
                                                text: fieldType,
                                                bsSize: 'xs',
                                                onClick: () => this.scrollTo(offset + fieldOffset)
                                            };
                                        })
                                    ]} />
                            );
                        })}
                    </ButtonToolbar>
                }>
                <ContainerDimensions>
                    {({ width, height }) =>
                        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                            <Parallax
                                id="ms-parallax-container"
                                className="ms-parallax-container"
                                ref={ref => this.parallax = ref}
                                pages={this.state.pages}
                                background={
                                    <Background
                                        height={height}
                                        width={width}
                                        sections={this.props.sections}
                                        sectionsData={this._sectionsData}
                                        parallax={this.parallax} />
                                }>
                                {this.props.sections.map(({ contents = [], id: sectionId, type: sectionType, _needsUpdate }) => {
                                    return (
                                        <Section
                                            key={sectionId}
                                            id={sectionId}
                                            viewHeight={height}
                                            needsUpdate={_needsUpdate}
                                            type={sectionType}
                                            onAdd={(data) => this.props.onAdd(data)}
                                            onUpdate={(data) => {
                                                this.getSectionData(data);
                                                this.setState({ update: true });
                                            }}>
                                            {contents.map(({ id: contentId, type, layer, factor = 1, speed = 0, offset, foreground }, jdx) => {
                                                const Field = fields[type];
                                                const Wrapper = Layer[layer] || Layer.parallax;
                                                return Field
                                                    ? <Wrapper
                                                        key={jdx}
                                                        factor={factor}
                                                        offset={offset}
                                                        speed={speed}
                                                        style={{ height: 'auto' }}>
                                                        <Field
                                                            {...foreground}
                                                            id={contentId}
                                                            edit
                                                            height={height}
                                                            width={width}
                                                            onChange={(key, value) => this.props.onEdit({ sectionId, contentId, key, value })} />
                                                    </Wrapper>
                                                    : null;
                                            })}
                                        </Section>
                                    );
                                })}
                            </Parallax>
                        </div>}
                </ContainerDimensions>
            </BorderLayout>
        );
    }

    scrollTo = (offset) => {
        if (this.parallax) {
            this.parallax.scrollTo(offset);
        }
    }
}

const Layout = {
    Cascade
};

class GeoStory extends React.Component {

    static propTypes = {
        // sections: PropTypes.array
    };

    static defaultProps = {
        // sections: stories[0].sections
    };

    state = {
        page: 0,
        space: 0,
        current: 0,
        sections: stories[0].sections
    };

    render() {
        return (
            <BorderLayout
                columns={[
                    <div
                        key="left-column"
                        className="ms-geostory-left-panel"
                        style={{ order: -1 }}>
                        <Builder
                            sections={this.state.sections}
                            onSort={(sections) =>
                                this.setState({
                                    sections: sections.map(section => ({ ...section, _needsUpdate: (section._needsUpdate || 0) + 1 }))
                                })
                            } />
                    </div>
                ]}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Layout.Cascade
                        sections={this.state.sections}
                        onEdit={(data) => {
                            const { sectionId, contentId, key, value } = data;
                            const sections = this.state.sections.map(section => {
                                if (section.id === sectionId) {
                                    const contents = (section.contents || [])
                                        .map((content) => {
                                            if (content.id === contentId) {
                                                // CHANGES FROM FOREGROUND, NEEDS BACKGROUND ALSO
                                                return {
                                                    ...(content || {}),
                                                    foreground: {
                                                        ...(content.foreground || {}),
                                                        [key]: value
                                                    }
                                                };
                                            }
                                            return content;
                                        });
                                    return {
                                        ...section,
                                        _needsUpdate: (section._needsUpdate || 0) + 1,
                                        contents
                                    };
                                }
                                return section;
                            });
                            this.setState({ sections });
                        }}
                        onAdd={(data) => {
                            const sections = this.state.sections.reduce((newSections, section) => {
                                if (section.id === data.id) {
                                    return [
                                        ...newSections,
                                        section,
                                        data.template
                                    ];
                                }
                                return [
                                    ...newSections,
                                    section
                                ];
                            }, []);
                            this.setState({
                                sections: sections.map(section => ({ ...section, _needsUpdate: (section._needsUpdate || 0) + 1 }))
                            });
                        }} />
                </div>
            </BorderLayout>
        );
    }
}

export const GeoStoryPlugin = GeoStory;
