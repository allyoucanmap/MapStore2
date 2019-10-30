/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { setControlProperty } from '../../actions/controls';
import BorderLayout from '../../components/layout/BorderLayout';
import { createPlugin }  from '../../utils/PluginsUtils';
import Filter from '../../components/misc/Filter';
import Toolbar from '../../components/misc/toolbar/Toolbar';
import emptyState from '../../components/misc/enhancers/emptyState';
import { CardList as List } from '../../components/misc/cardgrids/SideGrid';
import ResizableModal from '../../components/misc/ResizableModal';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import { Controlled as Codemirror } from 'react-codemirror2';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/lib/codemirror.css';
import tooltip from '../../components/misc/enhancers/tooltip';
import { ConfigureTemplatesPlugin } from './ConfigureTemplates';

const Button = tooltip(ButtonRB);

const CardList = emptyState(({ items }) => items.length === 0, ({ emptyStateProps = {} }) => ({ ...emptyStateProps }))(List);

class ConfigurePluginsPlugin extends React.Component {

    static propTypes = {
        selectedPlugins: PropTypes.array,
        onUpdate: PropTypes.func
    };

    static defaultProps = {
        selectedPlugins: [],
        onUpdate: () => {}
    };

    state = {
        availablePlugins: [
            {
                name: 'TOC',
                label: 'List of layers',
                children: [
                    {
                        name: 'TOCItemSettings',
                        label: 'Layer settings'
                    },
                    {
                        name: 'FeaturesGrid',
                        label: 'Attribute Table'
                    }
                ]
            },
            {
                name: 'MapTemplates',
                label: 'Map Templates',
                templateTools: true
            },
            {
                name: 'Catalog',
                label: 'Catalog'
            },
            {
                name: 'Scale',
                label: 'Scale'
            },
            {
                name: 'ZoomIn',
                label: 'Zoom In'
            },
            {
                name: 'ZoomOut',
                label: 'Zoom Out'
            }
        ],
        selectedPlugins: [],
        selected: [],
        editing: '',
        configuration: {},
        selectedList: ''
    };

    componentWillMount() {
        this.setState({
            selectedPlugins: this.props.selectedPlugins
        });
    }

    componentWillUpdate(newProps, newState) {
        if (newState.selectedPlugins && newState.selectedPlugins.length !== this.state.selectedPlugins.length) {
            this.props.onUpdate(newState.selectedPlugins);
        }
    }

    render() {
        const { availablePlugins, selectedPlugins, selected } = this.state;
        return (
            <div
                className="ms-transfer-list"
                style={{
                    position: 'relative',
                    padding: 8,
                    width: 1000,
                    display: 'flex',
                    border: '1px solid #ddd',
                    height: 'calc(100% - 16px)',
                    margin: '8px auto'
                }}>
                <BorderLayout
                    header={
                        <div style={{ padding: 8 }}>
                            <h4 style={{ display: 'flex' }}>
                                <div style={{ flex: 1 }}>Available Plugins</div>
                                <Button
                                    bsStyle="primary"
                                    className="square-button-md"
                                    tooltip="Upload new plugin">
                                    <Glyphicon glyph="upload"/>
                                </Button>
                            </h4>
                            <Filter
                                filterPlaceholder="Filter plugin by name..."/>
                        </div>
                    }>
                    <CardList
                        size="sm"
                        emptyStateProps={{
                            glyph: 'wrench',
                            title: 'Enabled all available plugins'
                        }}
                        items={[ ...availablePlugins]
                            .sort((a, b) => a.name > b.name ? 1 : -1)
                            .filter(({ name }) => !this.state.selectedPlugins.find((plugin) => plugin.name === name))
                            .map((plugin) => ({
                                id: plugin.name,
                                title: plugin.label || plugin.name,
                                description: 'plugin name: ' + plugin.name,
                                selected: selected.indexOf(plugin.name) !== -1,
                                onClick: (item, event) => {

                                    const selectedList = 'availablePlugins';

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
                                },
                                body: plugin.children &&
                                    <List
                                        size="sm"
                                        items={[ ...plugin.children ]
                                            .sort((a, b) => a.name > b.name ? 1 : -1)
                                            .map((child) => ({
                                                id: child.name,
                                                title: child.label || child.name,
                                                description: 'plugin name: ' + child.name
                                            }))}/>
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
                        disabled={this.state.availablePlugins.length === this.state.selectedPlugins.length}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedPlugins: [ ...this.state.availablePlugins ]
                            });
                        }}>
                        {'>>'}
                    </Button>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Enable selected plugins"
                        disabled={this.state.selected.length === 0 || this.state.selectedList !== 'availablePlugins'}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedPlugins: [
                                    ...this.state.selectedPlugins,
                                    ...this.state.availablePlugins.filter(({ name }) => this.state.selected.indexOf(name) !== -1)
                                ]
                            });
                        }}>
                        {'>'}
                    </Button>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Disable selected plugins"
                        disabled={this.state.selected.length === 0 || this.state.selectedList !== 'selectedPlugins'}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedPlugins: this.state.selectedPlugins.filter(({ name }) => this.state.selected.indexOf(name) === -1)
                            });
                        }}>
                        {'<'}
                    </Button>
                    <Button
                        bsStyle="primary"
                        className="square-button-md"
                        // tooltip="Disable all plugins"
                        disabled={this.state.selectedPlugins.length === 0}
                        onClick={() => {
                            this.setState({
                                selected: [],
                                selectedPlugins: [ ]
                            });
                        }}>
                        {'<<'}
                    </Button>
                </div>
                <BorderLayout
                    header={
                        <div style={{ padding: 8 }}>
                            <h4>Enabled Plugins</h4>
                            <Filter
                                filterPlaceholder="Filter plugin by name..."/>
                        </div>
                    }>
                    <CardList
                        size="sm"
                        emptyStateProps={{
                            glyph: 'wrench',
                            title: 'Add plugins to configuration from list of available plugins'
                        }}
                        items={[ ...selectedPlugins ]
                            .sort((a, b) => a.name > b.name ? 1 : -1)
                            .map((plugin) => ({
                                id: plugin.name,
                                title: plugin.label || plugin.name,
                                description: 'plugin name: ' + plugin.name,
                                selected: selected.indexOf(plugin.name) !== -1,
                                onClick: (item, event) => {
                                    const selectedList = 'selectedPlugins';
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
                                },
                                tools: <Toolbar
                                    btnDefaultProps={{
                                        className: 'square-button-md no-border'
                                    }}
                                    buttons={[
                                        {
                                            visible: !!plugin.templateTools,
                                            glyph: '1-map',
                                            tooltip: 'Configure templates',
                                            onClick: (event) => {
                                                event.stopPropagation();
                                                this.setState({
                                                    showTemplateTools: plugin.name
                                                });
                                            }
                                        },
                                        {
                                            glyph: '1-user-mod',
                                            tooltip: (this.state.configuration[plugin.name] || {}).userMod
                                                ? 'Disable selection of current plugin for user'
                                                : 'Enable selection of current plugin for user',
                                            active: !!(this.state.configuration[plugin.name] || {}).userMod,
                                            bsStyle: (this.state.configuration[plugin.name] || {}).userMod
                                                ? 'success'
                                                : undefined,
                                            onClick: (event) => {
                                                event.stopPropagation();
                                                this.setState({
                                                    configuration: {
                                                        ...this.state.configuration,
                                                        [plugin.name]: {
                                                            ...(this.state.configuration[plugin.name] || {}),
                                                            userMod: !(this.state.configuration[plugin.name] || {}).userMod
                                                        }
                                                    }
                                                });
                                            }
                                        },
                                        {
                                            glyph: 'wrench',
                                            tooltip: 'Change plugin configuration',
                                            active: plugin.name === this.state.editing,
                                            onClick: (event) => {
                                                event.stopPropagation();
                                                this.setState({
                                                    editing: plugin.name === this.state.editing
                                                        ? ''
                                                        : plugin.name
                                                });
                                            }
                                        }
                                    ]}/>,
                                body: <>
                                    {this.state.editing === plugin.name
                                        ? <div
                                            style={{ position: 'relative', width: '100%', height: 200, overflow: 'auto' }}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                            }}>
                                            <Codemirror
                                                value={this.state.configuration[plugin.name] && this.state.configuration[plugin.name].cgf || `{ }`}
                                                onBeforeChange={(editor, data, cgf) => {
                                                    this.setState({
                                                        configuration: {
                                                            ...this.state.configuration,
                                                            [plugin.name]: {
                                                                ...(this.state.configuration[plugin.name] || {}),
                                                                cgf
                                                            }
                                                        }
                                                    });
                                                }}
                                                options={{
                                                    theme: 'lesser-dark',
                                                    mode: 'application/json',
                                                    lineNumbers: true,
                                                    styleSelectedText: true,
                                                    indentUnit: 2,
                                                    tabSize: 2
                                                }} />
                                        </div>
                                        : null}
                                    {plugin.children &&
                                    <>
                                        <small style={{ padding: '0 8px', fontStyle: 'italic' }}>children:</small>
                                        <List
                                            size="sm"
                                            items={[ ...plugin.children ]
                                                .sort((a, b) => a.name > b.name ? 1 : -1)
                                                .map((child) => ({
                                                    id: child.name,
                                                    style: {
                                                        opacity: (this.state.configuration[child.name] || {}).disabled ? 0.5 : 1.0
                                                    },
                                                    preview: <Button
                                                        className="square-button-md no-border"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            this.setState({
                                                                configuration: {
                                                                    ...this.state.configuration,
                                                                    [child.name]: {
                                                                        ...(this.state.configuration[child.name] || {}),
                                                                        disabled: !(this.state.configuration[child.name] || {}).disabled
                                                                    }
                                                                }
                                                            });
                                                        }}>
                                                        <Glyphicon glyph={(this.state.configuration[child.name] || {}).disabled ? 'unchecked' : 'check'}/>
                                                    </Button>,
                                                    title: child.label || child.name,
                                                    description: 'plugin name: ' + child.name,
                                                    tools: <Toolbar
                                                        btnDefaultProps={{
                                                            className: 'square-button-md no-border'
                                                        }}
                                                        buttons={[
                                                            {
                                                                glyph: '1-user-mod',
                                                                tooltip: (this.state.configuration[child.name] || {}).userMod
                                                                    ? 'Disable selection of current plugin for user'
                                                                    : 'Enable selection of current plugin for user',
                                                                active: !!(this.state.configuration[child.name] || {}).userMod,
                                                                bsStyle: (this.state.configuration[child.name] || {}).userMod
                                                                    ? 'success'
                                                                    : undefined,
                                                                onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    event.stopPropagation();
                                                                    this.setState({
                                                                        configuration: {
                                                                            ...this.state.configuration,
                                                                            [child.name]: {
                                                                                ...(this.state.configuration[child.name] || {}),
                                                                                userMod: !(this.state.configuration[child.name] || {}).userMod
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            },
                                                            {
                                                                glyph: 'wrench',
                                                                onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    this.setState({
                                                                        editing: child.name === this.state.editing
                                                                            ? ''
                                                                            : child.name
                                                                    });
                                                                }
                                                            }
                                                        ]}/>,
                                                    body: this.state.editing === child.name
                                                        ? <div
                                                            style={{ position: 'relative', width: '100%', maxHeight: 200, overflow: 'auto' }}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                            }}>
                                                            <Codemirror
                                                                value={this.state.configuration[child.name] && this.state.configuration[child.name].cfg || `{ }`}
                                                                onBeforeChange={(editor, data, cfg) => {
                                                                    this.setState({
                                                                        configuration: {
                                                                            ...this.state.configuration,
                                                                            [child.name]: {
                                                                                ...(this.state.configuration[child.name] || {}),
                                                                                cfg
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                options={{
                                                                    theme: 'lesser-dark',
                                                                    mode: 'application/json',
                                                                    lineNumbers: true,
                                                                    styleSelectedText: true,
                                                                    indentUnit: 2,
                                                                    tabSize: 2
                                                                }} />
                                                        </div>
                                                        : null
                                                }))}/>
                                    </>}
                                </>
                            }))}/>
                </BorderLayout>
                <ResizableModal
                    showFullscreen
                    title="Configure Templates"
                    fullscreenType="vertical"
                    clickOutEnabled={false}
                    size="lg"
                    show={this.state.showTemplateTools}
                    onClose={() => {
                        this.setState({
                            showTemplateTools: false
                        });
                    }}>
                    <ConfigureTemplatesPlugin
                        selectedTemplates={this.state.configuration[this.state.showTemplateTool]
                            && this.state.configuration[this.state.showTemplateTool].selectedTemplates}
                        onUpdate={(selectedTemplates) => {
                            const name = this.state.showTemplateTool;
                            this.setState({configuration: {
                                ...this.state.configuration,
                                [name]: {
                                    ...(this.state.configuration[name] || {}),
                                    selectedTemplates
                                }
                            }});
                        }}/>
                </ResizableModal>
            </div>
        );
    }
}

export default createPlugin('ConfigurePlugins', {
    component: connect((state) => ({
        selectedPlugins: get(state, 'controls.configure-plugins.selectedPlugins') || []
    }), {
        onUpdate: setControlProperty.bind(null, 'configure-plugins', 'selectedPlugins')
    })(ConfigurePluginsPlugin),
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
