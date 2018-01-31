/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const DockPanel = require('../components/misc/panels/DockPanel');
const Toolbar = require('../components/misc/toolbar/Toolbar');
const {Row, Col, Nav, NavItem, Glyphicon} = require('react-bootstrap');
const tooltip = require('../components/misc/enhancers/tooltip');
const NavItemT = tooltip(NavItem);
const {layerSettingSelector, layersSelector, groupsSelector} = require('../selectors/layers');
const {head, isArray, isNil, isObject} = require('lodash');

const assign = require('object-assign');

const General = require('../components/TOC/fragments/settings/General');
const Display = require('../components/TOC/fragments/settings/Display');
const WMSStyle = require('../components/TOC/fragments/settings/WMSStyle');
const Elevation = require('../components/TOC/fragments/settings/Elevation');
const FeatureInfoFormat = require('../components/TOC/fragments/settings/FeatureInfoFormatAccordion');
const LayersUtils = require('../utils/LayersUtils');
const ResizableModal = require('../components/misc/ResizableModal');
const Portal = require('../components/misc/Portal');

class TOCSettings extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        element: PropTypes.object,
        groups: PropTypes.array,
        settings: PropTypes.object,
        retrieveLayerData: PropTypes.func,
        generalInfoFormat: PropTypes.string,
        updateNode: PropTypes.func,
        updateSettings: PropTypes.func,
        hideSettings: PropTypes.func,
        realtimeUpdate: PropTypes.bool,
        currentLocale: PropTypes.string,
        width: PropTypes.number,
        showElevationChart: PropTypes.bool,
        chartStyle: PropTypes.object,
        getDimension: PropTypes.func
    };

    static defaultProps = {
        className: '',
        element: {},
        groups: [],
        settings: {},
        retrieveLayerData: () => {},
        generalInfoFormat: 'text/plain',
        updateNode: () => {},
        updateSettings: () => {},
        hideSettings: () => {},
        realtimeUpdate: true,
        currentLocale: 'en-US',
        width: 500,
        showElevationChart: true,
        chartStyle: {},
        getDimension: LayersUtils.getDimension
    };

    state = {
        initialState: {},
        originalSettings: {},
        activeTab: 'General'
    };

    componentWillMount() {
        this.setState({
            initialState: {...this.props.element},
            originalSettings: {...this.props.element}
        });
    }

    componentWillReceiveProps(newProps) {
        // an empty description does not trigger the single layer getCapabilites,
        // it does only for missing description
        if (!this.props.settings.expanded && newProps.settings.expanded && isNil(newProps.element.description) && newProps.element.type === "wms") {
            this.props.retrieveLayerData(newProps.element);
        }
    }

    componentWillUpdate(newProps, newState) {
        if (this.props.settings.expanded && !newProps.settings.expanded && !newState.save) {
            this.props.updateNode(
                this.props.settings.node,
                this.props.settings.nodeType,
                assign({}, this.props.settings.options, this.state.originalSettings)
            );
        }

        if (!this.props.settings.expanded && newProps.settings.expanded) {
            // update initial and original settings
            this.setState({
                initialState: {...this.props.element},
                originalSettings: {...this.props.element},
                activeTab: 'General'
            });
        }
    }

    onClose = () => {
        this.setState({save: false});
        this.props.hideSettings();
    };

    render() {
        const elevationDim = this.props.getDimension(this.props.element.dimensions, 'elevation');
        const tabs = [
            {
                title: 'General',
                tooltip: 'General',
                glyph: 'wrench',
                visible: true,
                el: <General
                    key="general"
                    element={this.props.element}
                    groups={this.props.groups}
                    nodeType={this.props.settings.nodeType}
                    updateSettings={this.updateParams}/>
            },
            {
                title: 'Display',
                tooltip: 'Display',
                glyph: 'eye-open',
                visible: this.props.settings.nodeType === 'layers',
                el: <Display
                    key="display"
                    opacityText={'TExt'}
                    element={this.props.element}
                    settings={this.props.settings}
                    onChange={(key, value) => this.updateParams({[key]: value}, this.props.realtimeUpdate)} />
            },
            {
                title: 'Style',
                tooltip: 'Style',
                glyph: 'dropper',
                visible: this.props.settings.nodeType === 'layers' && this.props.element.type === "wms",
                el: <WMSStyle
                    key="style"
                    element={this.props.element}
                    retrieveLayerData={this.props.retrieveLayerData}
                    updateSettings={this.updateParams}/>
            },
            {
                title: 'Feature Info',
                tooltip: 'Feature Info',
                glyph: 'map-marker',
                visible: this.props.settings.nodeType === 'layers' && !(this.props.element.featureInfo && this.props.element.featureInfo.viewer),
                toolbar: [
                    {
                        glyph: 'stats'
                    },
                    {
                        glyph: 'list'
                    },
                    {
                        glyph: 'pencil',
                        visible: this.props.element.featureInfo && this.props.element.featureInfo.format === 'CUSTOM' || false
                    }
                ],
                el: <FeatureInfoFormat
                    label= {'ok'}
                    element={this.props.element}
                    generalInfoFormat={this.props.generalInfoFormat}
                    onInfoFormatChange={(key, value) => this.updateParams({[key]: value}, this.props.realtimeUpdate)} />
            },
            {
                title: 'Elevation',
                tooltip: 'Elevation',
                glyph: '1-vector',
                visible: this.props.settings.nodeType === 'layers' && this.props.element.type === "wms" && this.props.element.dimensions && elevationDim,
                el: <Elevation
                    elevationText={'Op'}
                    chartStyle={{height: 200, width: this.props.width - 30, ...this.props.chartStyle}}
                    showElevationChart={this.props.showElevationChart}
                    element={this.props.element}
                    elevations={elevationDim}
                    appState={this.state || {}}
                    onChange={(key, value) => this.updateParams({[key]: value}, this.props.realtimeUpdate)} />
            }
        ].filter(tab => tab.visible);

        return (
            <span>
                <DockPanel
                    open={this.props.settings.expanded}
                    glyph="wrench"
                    title={this.props.element.title && isObject(this.props.element.title) && (this.props.element.title[this.props.currentLocale] || this.props.element.title.default) || this.props.element.title || ''}
                    className={this.props.className}
                    onClose={this.onClose}
                    width={this.props.width}
                    header={[
                        <Row key="ms-toc-settings-title" className="text-center">
                            <Col xs={12}>
                                <h4><strong>{this.state.activeTab}</strong></h4>
                            </Col>
                        </Row>,
                        ...(tabs.length > 1 ? [<Row key="ms-toc-settings-navbar">
                            <Col xs={12}>
                                <Nav bsStyle="tabs" activeKey={this.state.activeTab} justified>
                                    {tabs.map(tab => <NavItemT
                                        tooltip={tab.tooltip}
                                        eventKey={tab.title}
                                        onClick={() => { this.setState({activeTab: tab.title}); }}>
                                        <Glyphicon glyph={tab.glyph}/>
                                    </NavItemT>)}
                                </Nav>
                            </Col>
                        </Row>] : []),
                        <Row key="ms-toc-settings-toolbar" className="text-center">
                            <Col xs={12}>
                                <Toolbar
                                    btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                                    buttons={[{
                                        glyph: 'floppy-disk',
                                        tooltip: 'Save',
                                        onClick: () => {
                                            this.updateParams(this.props.settings.options.opacity, true);
                                            this.props.hideSettings();
                                            this.setState({save: true});
                                        }
                                    },
                                    ...(head(tabs.filter(tab => tab.title === this.state.activeTab && tab.toolbar).map(tab => tab.toolbar)) || [])]}/>
                            </Col>
                        </Row>
                    ]}>
                    {tabs.filter(tab => tab.title === this.state.activeTab).map(tab => tab.el)}
                </DockPanel>
                <Portal>
                    <ResizableModal
                        fade
                        show={false}
                        title={<span>test</span>}
                        size="sm">
                        gg
                    </ResizableModal>
                </Portal>
            </span>);
    }

    updateParams = (newParams, updateNode = true) => {
        let originalSettings = assign({}, this.state.originalSettings);
        // TODO one level only storage of original settings for the moment
        Object.keys(newParams).forEach((key) => {
            originalSettings[key] = this.state.initialState[key];
        });
        this.setState({originalSettings});
        this.props.updateSettings(newParams);
        if (updateNode) {
            this.props.updateNode(
                this.props.settings.node,
                this.props.settings.nodeType,
                assign({}, this.props.settings.options, newParams)
            );
        }
    };
}

const getSettingsTabs = props => [
    {
        title: 'General',
        tooltip: 'General',
        glyph: 'wrench',
        visible: true,
        Component: General
    },
    {
        title: 'Display',
        tooltip: 'Display',
        glyph: 'eye-open',
        visible: props.settings.nodeType === 'layers',
        Component: Display
    },
    {
        title: 'Style',
        tooltip: 'Style',
        glyph: 'dropper',
        visible: props.settings.nodeType === 'layers' && props.element.type === "wms",
        Component: WMSStyle
    },
    {
        title: 'Feature Info',
        tooltip: 'Feature Info',
        glyph: 'map-marker',
        visible: props.settings.nodeType === 'layers' && !(props.element.featureInfo && props.element.featureInfo.viewer),
        Component: FeatureInfoFormat
    },
    {
        title: 'Elevation',
        tooltip: 'Elevation',
        glyph: '1-vector',
        visible: props.settings.nodeType === 'layers' && props.element.type === "wms" && props.element.dimensions && props.elevationDim,
        Component: Elevation
    }
].filter(tab => tab.visible);


const DockSettings = ({
    className,
    element,
    settings,
    currentLocale,
    width,
    onClose,
    activeTab,
    onSetTab,
    onSave,
    onUpdateParams,
    onRetrieveLayerData,
    getDimension = () => {},
    getTabs = getSettingsTabs,
    groups,
    realtimeUpdate,
    generalInfoFormat,
    chartStyle,
    showElevationChart
}) => {
    const elevationDim = getDimension(element.dimensions, 'elevation');
    const tabs = getTabs({element, settings, elevationDim});
    return (<DockPanel
        open={settings.expanded}
        glyph="wrench"
        title={element.title && isObject(element.title) && (element.title[currentLocale] || element.title.default) || element.title || ''}
        className={className}
        onClose={onClose}
        width={width}
        header={[
            <Row key="ms-toc-settings-title" className="text-center">
                <Col xs={12}>
                    <h4><strong>{activeTab}</strong></h4>
                </Col>
            </Row>,
            ...(tabs.length > 1 ? [<Row key="ms-toc-settings-navbar">
                <Col xs={12}>
                    <Nav bsStyle="tabs" activeKey={activeTab} justified>
                        {tabs.map(tab =>
                            <NavItemT
                                tooltip={tab.tooltip}
                                eventKey={tab.id}
                                onClick={() => onSetTab(tab.id)}>
                                <Glyphicon glyph={tab.glyph}/>
                            </NavItemT>
                        )}
                    </Nav>
                </Col>
            </Row>] : []),
            <Row key="ms-toc-settings-toolbar" className="text-center">
                <Col xs={12}>
                    <Toolbar
                        btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                        buttons={[{
                            glyph: 'floppy-disk',
                            tooltip: 'Save',
                            onClick: () => {
                                onSave();
                            }
                        },
                        ...(head(tabs.filter(tab => tab.id === activeTab && tab.toolbar).map(tab => tab.toolbar)) || [])]}/>
                </Col>
            </Row>
        ]}>
        {tabs.filter(tab => tab.id === activeTab).map(tab => (
            <tab.Component
                key={tab.id}
                opacityText={'TExt'}
                label= {'ok'}
                elevationText={'Op'}
                groups={groups}
                nodeType={settings.nodeType}
                settings={settings}
                retrieveLayerData={onRetrieveLayerData}
                element={element}
                generalInfoFormat={generalInfoFormat}
                chartStyle={{height: 200, width: width - 30, ...chartStyle}}
                showElevationChart={showElevationChart}
                elevations={elevationDim}
                updateSettings={onUpdateParams}
                onChange={(key, value) => onUpdateParams({[key]: value}, realtimeUpdate)}
                onInfoFormatChange={(key, value) => onUpdateParams({[key]: value}, realtimeUpdate)}/>
        ))}
    </DockPanel>);
};

const {hideSettings, updateSettings, updateNode} = require('../actions/layers');
const {getLayerCapabilities} = require('../actions/layerCapabilities');
const {currentLocaleSelector} = require('../selectors/locale');
const {generalInfoFormatSelector} = require("../selectors/mapinfo");

const tocSettingsSelector = createSelector([
    layerSettingSelector,
    layersSelector,
    groupsSelector,
    currentLocaleSelector,
    generalInfoFormatSelector,
    state => state.browser && state.browser.mobile
], (settings, layers, groups, currentLocale, generalInfoFormat, isMobile) => ({
    settings,
    element: settings.nodeType === 'layers' && isArray(layers) && head(layers.filter(layer => layer.id === settings.node)) ||
    settings.nodeType === 'groups' && isArray(groups) && head(groups.filter(group => group.id === settings.node)) || {},
    groups,
    currentLocale,
    generalInfoFormat,
    width: isMobile ? 300 : 500
}));
const TOCSettingsPlugin = connect(tocSettingsSelector, {
    hideSettings,
    updateSettings,
    updateNode,
    retrieveLayerData: getLayerCapabilities
})(DockSettings);

module.exports = {
    TOCSettingsPlugin
};
