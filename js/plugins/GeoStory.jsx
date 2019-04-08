/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import BorderLayout from '@mapstore/components/layout/BorderLayout';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import stories from './data/mockupStory';
import Builder from './Builder';
import Cascade from './Cascade';

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
                className="ms-geostory"
                style={{
                    position: 'fixed'
                }}
                columns={[
                    <div
                        key="left-column"
                        className="ms-geostory-left-panel"
                        style={{ order: -1 }}>
                        <Builder
                            sections={this.state.sections}
                            readOnly={this.state.readOnly}
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
                ]}>
                <div
                    style={{
                        position: this.state.readOnly ? 'fixed' : 'relative',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: this.state.readOnly ? 20 : 'unset',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    {this.state.readOnly && <div
                        style={{
                            padding: 4,
                            backgroundColor: '#ffffff'
                        }}>
                        <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md no-border',
                                bsStyle: 'default'
                            }}
                            buttons={[
                                {
                                    glyph: 'arrow-left',
                                    tooltip: 'Back to edit',
                                    tooltipPosition: 'bottom',
                                    onClick: () => this.setState({ readOnly: !this.state.readOnly })
                                }
                            ]}/>
                    </div>}
                    {this.state.readOnly && <div style={{ backgroundColor: '#ddd', height: 4 }}>
                        <div style={{
                            backgroundColor: '#078aa3',
                            height: 4,
                            width: `${(this.state.page + 1) / this.state.pages * 100}%`,
                            transition: 'width 0.3s'
                        }} ></div>
                    </div>}
                    <div style={{ flex: 1 }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <Layout.Cascade
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
                </div>
            </BorderLayout>
        );
    }
}

export const GeoStoryPlugin = GeoStory;
