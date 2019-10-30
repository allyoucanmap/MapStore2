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
import { setControlProperty } from '../../actions/controls';
import BorderLayout from '../../components/layout/BorderLayout';
import { createPlugin }  from '../../utils/PluginsUtils';
import Filter from '../../components/misc/Filter';
import emptyState from '../../components/misc/enhancers/emptyState';
import { CardList as List } from '../../components/misc/cardgrids/SideGrid';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import tooltip from '../../components/misc/enhancers/tooltip';
const Button = tooltip(ButtonRB);

const CardList = emptyState(({ items }) => items.length === 0, ({ emptyStateProps = {} }) => ({ ...emptyStateProps }))(List);

export class ConfigureTemplatesPlugin extends React.Component {

    static propTypes = {
        selectedTemplates: PropTypes.array,
        onUpdate: PropTypes.func
    };

    static defaultProps = {
        selectedTemplates: [],
        onUpdate: () => {}
    };

    state = {
        availableTemplates: [
            {
                name: 'BaseMap',
                title: 'Base Map',
                description: 'Simple base map',
                caption: 'id: base-map'
            },
            {
                name: 'NaturalEarth',
                title: 'Natural Earth',
                description: 'A collection of layers from Natural Earth',
                caption: 'id: natural-earth'
            },
            {
                name: 'Administrative',
                title: 'Administrative Boundaries',
                description: 'Global boundaries',
                caption: 'id: administrative'
            },
            {
                name: 'POIs',
                title: 'POIs Layers',
                description: 'Point of interest',
                caption: 'id: poi'

            }
        ],
        selectedTemplates: [],
        selected: [],
        editing: '',
        configuration: {},
        selectedList: ''
    };

    componentWillMount() {
        this.setState({
            selectedTemplates: this.props.selectedTemplates
        });
    }

    componentWillUpdate(newProps, newState) {
        if (newState.selectedTemplates && newState.selectedTemplates.length !== this.state.selectedTemplates.length) {
            this.props.onUpdate(newState.selectedTemplates);
        }
    }

    render() {
        const { availableTemplates, selectedTemplates, selected } = this.state;
        return (
            <div
                className="ms-transfer-list"
                style={{
                    position: 'relative',
                    padding: 8,
                    width: '100%',
                    display: 'flex',
                    height: 'calc(100% - 16px)',
                    margin: '8px auto'
                }}>
                <BorderLayout
                    header={
                        <div style={{ padding: 8 }}>
                            <h4 style={{ display: 'flex' }}>
                                <div style={{ flex: 1 }}>Available Templates</div>
                                <Button
                                    bsStyle="primary"
                                    className="square-button-md"
                                    tooltip="Upload new map context">
                                    <Glyphicon glyph="upload"/>
                                </Button>
                            </h4>
                            <Filter
                                filterPlaceholder="Filter templates..."/>
                        </div>
                    }>
                    <CardList
                        emptyStateProps={{
                            glyph: '1-map',
                            title: 'Enabled all available plugins'
                        }}
                        items={[ ...availableTemplates]
                            .sort((a, b) => a.name > b.name ? 1 : -1)
                            .filter(({ name }) => !this.state.selectedTemplates.find((plugin) => plugin.name === name))
                            .map((plugin) => ({
                                id: plugin.name,
                                preview: <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#ddd', display: 'flex' }}><Glyphicon glyph="1-map" style={{ fontSize: 48, margin: 'auto', color: '#ffffff' }}/></div>,
                                title: plugin.title || plugin.name,
                                description: plugin.description,
                                caption: plugin.caption,
                                selected: selected.indexOf(plugin.name) !== -1,
                                onClick: (item, event) => {

                                    const selectedList = 'availableTemplates';

                                    if (this.state.selectedList !== selectedList) {
                                        return this.setState({
                                            selectedList,
                                            selected: [ plugin.name ]
                                        });
                                    }

                                    if (selected.indexOf(plugin.name) !== -1) {
                                        return this.setState({
                                            selectedList,
                                            selected: this.state.selected.filter(pluginName => pluginName !== plugin.name)
                                        });
                                    }

                                    const newSelected = event.ctrlKey
                                        ? [ ...this.state.selected, plugin.name ]
                                        : [ plugin.name ];
                                    return this.setState({
                                        selectedList,
                                        selected: newSelected
                                    });
                                }
                            }))}/>
                </BorderLayout>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                    borderLeft: '1px solid #ddd',
                    borderRight: '1px solid #ddd'
                }}>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Enable all plugins"
                        disabled={this.state.availableTemplates.length === this.state.selectedTemplates.length}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedTemplates: [ ...this.state.availableTemplates ]
                            });
                        }}>
                        {'>>'}
                    </Button>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Enable selected plugins"
                        disabled={this.state.selected.length === 0 || this.state.selectedList !== 'availableTemplates'}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedTemplates: [
                                    ...this.state.selectedTemplates,
                                    ...this.state.availableTemplates.filter(({ name }) => this.state.selected.indexOf(name) !== -1)
                                ]
                            });
                        }}>
                        {'>'}
                    </Button>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Disable selected plugins"
                        disabled={this.state.selected.length === 0 || this.state.selectedList !== 'selectedTemplates'}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedTemplates: this.state.selectedTemplates.filter(({ name }) => this.state.selected.indexOf(name) === -1)
                            });
                        }}>
                        {'<'}
                    </Button>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Disable all plugins"
                        disabled={this.state.selectedTemplates.length === 0}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedTemplates: [ ]
                            });
                        }}>
                        {'<<'}
                    </Button>
                </div>
                <BorderLayout
                    header={
                        <div style={{ padding: 8 }}>
                            <h4 style={{ minHeight: 32 }}>Enabled Templates</h4>
                            <Filter
                                filterPlaceholder="Filter templates..."/>
                        </div>
                    }>
                    <CardList
                        emptyStateProps={{
                            glyph: '1-map',
                            title: 'Add templates to configuration from list of available templates'
                        }}
                        items={[ ...selectedTemplates ]
                            .sort((a, b) => a.name > b.name ? 1 : -1)
                            .map((plugin) => ({
                                preview: <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#ddd', display: 'flex' }}><Glyphicon glyph="1-map" style={{ fontSize: 48, margin: 'auto', color: '#ffffff' }}/></div>,
                                id: plugin.name,
                                title: plugin.title || plugin.name,
                                description: plugin.description,
                                caption: plugin.caption,
                                selected: selected.indexOf(plugin.name) !== -1,
                                onClick: (item, event) => {
                                    const selectedList = 'selectedTemplates';
                                    if (this.state.selectedList !== selectedList) {
                                        return this.setState({
                                            selectedList,
                                            selected: [ plugin.name ]
                                        });
                                    }

                                    if (selected.indexOf(plugin.name) !== -1) {
                                        return this.setState({
                                            selectedList,
                                            selected: this.state.selected.filter(pluginName => pluginName !== plugin.name)
                                        });
                                    }

                                    const newSelected = event.ctrlKey
                                        ? [ ...this.state.selected, plugin.name ]
                                        : [ plugin.name ];
                                    return this.setState({
                                        selectedList,
                                        selected: newSelected
                                    });
                                }
                            }))}/>
                </BorderLayout>
            </div>
        );
    }
}

export default createPlugin('ConfigureTemplates', {
    component: connect(() => ({}), {
        onUpdate: setControlProperty.bind(null, 'configure-plugins', 'selectedTemplates')
    })(ConfigureTemplatesPlugin),
    containers: {
        Layout: {
            priority: 1,
            glyph: 'wrench',
            position: 1,
            size: 'auto',
            container: 'left-menu'
        }
    }
});
