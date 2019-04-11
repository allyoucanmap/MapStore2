/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { get, capitalize } from 'lodash';
import BorderLayout from '@mapstore/components/layout/BorderLayout';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import ResizableModal from '@mapstore/components/misc/ResizableModal';
import stories from './data/mockupStory';
import Builder from './Builder';
import Cascade from './Cascade';
import Slides from './Slides';
import SideGrid from '@mapstore/components/misc/cardgrids/SideGrid';

import cascadeImage from '../../assets/icons/cascade.svg';
import slidesImage from '../../assets/icons/slides.svg';

const Layout = {
    Cascade,
    Slides
};

class GeoStory extends React.Component {

    static propTypes = {
        layoutType: PropTypes.string,
        readOnly: PropTypes.bool
    };

    state = {
        page: 0,
        space: 0,
        current: 0,
        sections: []
    };

    componentWillMount() {
        if (this.props.layoutType) {
            this.setState({
                sections: stories[0].sections,
                layoutType: capitalize(this.props.layoutType),
                readOnly: this.props.readOnly
            });
        }
    }

    render() {
        const SelectedLayout = Layout[this.state.layoutType];
        return (
            <BorderLayout
                className="ms-geostory"
                columns={!this.state.readOnly ? [
                    <div
                        key="left-column"
                        className="ms-geostory-left-panel"
                        style={{ order: -1 }}>
                        <Builder
                            sections={this.state.sections}
                            readOnly={this.state.readOnly || !SelectedLayout}
                            onPreview={() => this.setState({ readOnly: !this.state.readOnly })}
                            onRemove={(removeId) => {
                                this.setState({
                                    sections: this.state.sections
                                        .filter(section => removeId !== section.id)
                                        .map(section => ({ ...section, _needsUpdate: (section._needsUpdate || 0) + 1 }))
                                });
                            }}
                            onSort={(sections) =>
                                this.setState({
                                    sections: sections.map(section => ({ ...section, _needsUpdate: (section._needsUpdate || 0) + 1 }))
                                })
                            } />
                    </div>
                ] : undefined}>
                {!SelectedLayout && <div style={{ backgroundColor: '#ddd', position: 'absolute', width: '100%', height: '100%' }}></div>}
                {SelectedLayout && <div
                    style={{
                        position: 'relative',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    {this.state.readOnly && <div style={{ backgroundColor: '#ddd', height: 4 }}>
                        <div style={{
                            backgroundColor: '#078aa3',
                            height: 4,
                            width: `${(this.state.page + 1) / this.state.pages * 100}%`,
                            transition: 'width 0.3s'
                        }} ></div>
                    </div>}
                    {this.state.readOnly && <div
                        style={{
                            padding: 4,
                            backgroundColor: '#ffffff',
                            borderBottom: '1px solid #ddd'
                        }}>
                        <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md no-border',
                                bsStyle: 'default',
                                tooltipPosition: 'bottom'
                            }}
                            buttons={[
                                {
                                    glyph: 'pencil',
                                    tooltip: 'Edit story',
                                    onClick: () => this.setState({ readOnly: !this.state.readOnly })
                                },
                                {
                                    glyph: '1-full-screen',
                                    tooltip: 'Show story in fullscreen'
                                }
                            ]}/>
                    </div>}
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%'
                            }}>
                            <SelectedLayout
                                sections={this.state.sections}
                                readOnly={this.state.readOnly}
                                onUpdate={({ page, pages }) => this.setState({ page, pages })}
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
                                                contents
                                            };
                                        }
                                        return section;
                                    });
                                    this.setState({
                                        sections: sections.map(section => ({ ...section, _needsUpdate: (section._needsUpdate || 0) + 1 }))
                                    });
                                }}
                                onAdd={(data) => {
                                    const sections = this.state.sections.reduce((newSections, section) => {
                                        if (section.id === data.id) {
                                            return [
                                                ...newSections,
                                                section,
                                                data.section
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
                    </div>
                </div>}
                <ResizableModal
                    className="ms-geostory-layout"
                    onClose={null}
                    fitContent
                    show={!this.state.layoutType}
                    title="Create a New Story">
                    <SideGrid
                        onItemClick={({ title }) => this.setState({
                            layoutType: title,
                            sections: [ stories[0].sections[0] ]
                        })}
                        items={[
                            {
                                preview: <img src={cascadeImage}/>,
                                title: 'Cascade',
                                description: 'Show your story in a scrollable page',
                                caption: 'desktop'
                            },
                            {
                                preview: <img src={slidesImage}/>,
                                title: 'Slides',
                                description: 'Show your story with slides',
                                caption: 'desktop'
                            }
                        ]}/>
                </ResizableModal>
            </BorderLayout>
        );
    }
}

export const GeoStoryPlugin = connect(
    createSelector(
        [
            state => get(state, 'controls.geostory.layout'),
            state => get(state, 'controls.geostory.readOnly')
        ],
        (layoutType, readOnly) => ({
            layoutType,
            readOnly
        })
    )
)(GeoStory);