/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { head } from 'lodash';
import ContainerDimensions from 'react-container-dimensions';
import BorderLayout from '@mapstore/components/layout/BorderLayout';
import Section from './Section';
import Background from './Background';
import { Parallax, ParallaxLayer } from './spring/Parallax';
import StickyLayer from './StickyLayer';
import fields from './fileds';

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
        onAdd: PropTypes.func,
        readOnly: PropTypes.bool,
        onUpdate: PropTypes.func,
        slidePosition: PropTypes.Object
    };

    static defaultProps = {
        width: 0,
        height: 0,
        sections: [],
        onEdit: () => { },
        onAdd: () => { },
        onUpdate: () => { }
    };

    state = {
        pages: 0
    };

    componentWillMount() {
        this._sectionsData = {};
    }

    componentDidUpdate(prevProps, prevState) {
        if (!prevState.update && this.state.update) {
            const height = this.props.sections.map(({id: key}) => this._sectionsData[key].height || 0).reduce((previous, current) => previous + current);
            const pages = height / this.parallax.space;
            if (this.parallax) {
                this.setState({ pages});
                const page = this.parallax.current / this.parallax.space;
                const currentSlide = this.getCurrentSlide();
                this.props.onUpdate({
                    page,
                    pages,
                    currentSlide
                });
            }
            this.setState({ update: false });
        }

        if (this.props.slidePosition
        && (!prevProps.slidePosition
            || this.props.slidePosition.sectionId !== prevProps.slidePosition.sectionId
            || this.props.slidePosition.contentId !== prevProps.slidePosition.contentId)) {
            const { offset, fieldsData = {} } = this._sectionsData[this.props.slidePosition.sectionId] || {};
            const { offset: fieldOffset } = this.props.slidePosition.contentId
                && fieldsData[this.props.slidePosition.contentId] || { offset: 0 };
            this.scrollTo(offset + fieldOffset);
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

    getCurrentSlide = () => {
        const currentOffset = this.parallax.current / this.parallax.space;
        const plainOffset = Object.keys(this._sectionsData)
            .reduce((sectionsAcc, sectionId) => {
                const { fieldsData, offset: sectionOffset } = this._sectionsData[sectionId];
                return [
                    ...sectionsAcc,
                    ...Object.keys(fieldsData)
                        .reduce((contentsAcc, contentId) => {
                            const { offset: contentOffset } = fieldsData[contentId];
                            return [
                                ...contentsAcc,
                                {
                                    contentId,
                                    sectionId,
                                    offset: sectionOffset + contentOffset
                                }
                            ];
                        }, [ ])
                ];
            }, [])
            .sort((a, b) => a.offset > b.offset ? 1 : -1);
        const currentSlide = plainOffset.filter(({ offset }) => offset <= currentOffset + 0.1);
        return currentSlide[currentSlide.length - 1] || plainOffset[0];
    };

    render() {
        return (
            <BorderLayout className="ms-cascade-story">
                <ContainerDimensions>
                    {({ width, height }) =>
                        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                            <Parallax
                                id="ms-parallax-container"
                                className="ms-parallax-container"
                                ref={ref => this.parallax = ref}
                                pages={this.state.pages}
                                onScroll={() => {
                                    if (this.parallax) {
                                        const page = Math.round(this.parallax.current / this.parallax.space);
                                        const currentSlide = this.getCurrentSlide();
                                        if (page !== this.state.page) {
                                            this.props.onUpdate({
                                                page,
                                                pages: Math.round(this.state.pages),
                                                currentSlide
                                            });
                                            this.setState({ page });
                                        } else {
                                            this.props.onUpdate({
                                                currentSlide
                                            });
                                        }
                                    }
                                }}
                                background={
                                    <Background
                                        height={height}
                                        width={width}
                                        readOnly={this.props.readOnly}
                                        sections={this.props.sections}
                                        sectionsData={this._sectionsData}
                                        parallax={this.parallax}
                                        onChange={(value) => this.props.onEdit(value)} />
                                }>
                                {this.props.sections.map(({ contents = [], id: sectionId, type: sectionType, _needsUpdate }) => {
                                    return (
                                        <Section
                                            key={sectionId}
                                            id={sectionId}
                                            viewHeight={height}
                                            needsUpdate={_needsUpdate}
                                            type={sectionType}
                                            readOnly={this.props.readOnly}
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
                                                            height={height}
                                                            width={width}
                                                            readOnly={this.props.readOnly}
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

export default Cascade;
