/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const DockPanel = require('../components/misc/panels/DockPanel');
const Toolbar = require('../components/misc/toolbar/Toolbar');
const {Row, Col, Nav, NavItem, Glyphicon} = require('react-bootstrap');
const tooltip = require('../components/misc/enhancers/tooltip');
const NavItemT = tooltip(NavItem);
const {layerSettingSelector, layersSelector, groupsSelector} = require('../selectors/layers');
const {head, isArray, isNil, isObject, isEqual} = require('lodash');
const General = require('../components/TOC/fragments/settings/General');
const Display = require('../components/TOC/fragments/settings/Display');
const WMSStyle = require('../components/TOC/fragments/settings/WMSStyle');
const Elevation = require('../components/TOC/fragments/settings/Elevation');
const FeatureInfoFormat = require('../components/TOC/fragments/settings/FeatureInfoFormatAccordion');
const LayersUtils = require('../utils/LayersUtils');
const {withState, withHandlers, compose, lifecycle} = require('recompose');
const ResizableModal = require('../components/misc/ResizableModal');
const Portal = require('../components/misc/Portal');

const getSettingsTabs = props => [
    {
        id: 'general',
        title: 'General',
        tooltip: 'General',
        glyph: 'wrench',
        visible: true,
        Component: General
    },
    {
        id: 'display',
        title: 'Display',
        tooltip: 'Display',
        glyph: 'eye-open',
        visible: props.settings.nodeType === 'layers',
        Component: Display
    },
    {
        id: 'style',
        title: 'Style',
        tooltip: 'Style',
        glyph: 'dropper',
        visible: props.settings.nodeType === 'layers' && props.element.type === "wms",
        Component: WMSStyle
    },
    {
        id: 'feature',
        title: 'Feature Info',
        tooltip: 'Feature Info',
        glyph: 'map-marker',
        visible: props.settings.nodeType === 'layers' && !(props.element.featureInfo && props.element.featureInfo.viewer),
        Component: FeatureInfoFormat,
        toolbar: [
            {
                glyph: 'pencil',
                visible: !props.showEditor && props.element && props.element.featureInfo && props.element.featureInfo.format === 'CUSTOM' || false,
                onClick: () => props.onShowEditor && props.onShowEditor(!props.showEditor)
            },
            {
                glyph: 'stats',
                visible: true,
                onClick: () => {}
            }
        ]
    },
    {
        id: 'elevation',
        title: 'Elevation',
        tooltip: 'Elevation',
        glyph: '1-vector',
        visible: props.settings.nodeType === 'layers' && props.element.type === "wms" && props.element.dimensions && props.elevationDim,
        Component: Elevation
    }
].filter(tab => tab.visible);

const DockSettings = ({
    className = '',
    activeTab = 'general',
    currentLocale = 'en-US',
    generalInfoFormat = 'text/plain',
    width = 500,
    groups = [],
    element = {},
    settings = {},
    chartStyle = {},
    getTabs = getSettingsTabs,
    getDimension = LayersUtils.getDimension,
    onSave,
    onClose,
    onHideSettings,
    onSetTab = () => {},
    onUpdateParams = () => {},
    onRetrieveLayerData = () => {},
    onShowAlertModal = () => {},
    realtimeUpdate = true,
    showElevationChart = true,
    alertModal = false,
    showEditor = false,
    onShowEditor = () => {}
}) => {
    const elevationDim = getDimension(element.dimensions, 'elevation');
    const tabs = getTabs({element, settings, elevationDim, onShowEditor, showEditor});
    return (
        <span>
            <DockPanel
            open={settings.expanded}
            glyph="wrench"
            title={element.title && isObject(element.title) && (element.title[currentLocale] || element.title.default) || element.title || ''}
            className={className}
            onClose={onClose ? () => { onClose(); } : onHideSettings}
            size={width}
            header={[
                <Row key="ms-toc-settings-toolbar" className="text-center">
                    <Col xs={12}>
                        <Toolbar
                            btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                            buttons={[{
                                glyph: 'floppy-disk',
                                tooltip: 'Save',
                                visible: !!onSave,
                                onClick: onSave
                            },
                            ...(head(tabs.filter(tab => tab.id === activeTab && tab.toolbar).map(tab => tab.toolbar)) || [])]}/>
                    </Col>
                </Row>,
                ...(tabs.length > 1 ? [<Row key="ms-toc-settings-navbar" className="ms-row-tab">
                    <Col xs={12}>
                        <Nav bsStyle="tabs" activeKey={activeTab} justified>
                            {tabs.map(tab =>
                                <NavItemT
                                    key={'ms-tab-settings-' + tab.id}
                                    tooltip={tab.tooltip}
                                    eventKey={tab.id}
                                    onClick={() => onSetTab(tab.id)}>
                                    <Glyphicon glyph={tab.glyph}/>
                                </NavItemT>
                            )}
                        </Nav>
                    </Col>
                </Row>] : [])
            ]}>
            {tabs.filter(tab => tab.id && tab.id === activeTab).map(tab => tab.Component ? (
                <tab.Component
                    key={'ms-tab-settings-body-' + tab.id}
                    opacityText={'TExt'}
                    label= {'ok'}
                    elevationText={'Op'}
                    groups={groups}
                    showEditor={showEditor}
                    nodeType={settings.nodeType}
                    settings={settings}
                    retrieveLayerData={onRetrieveLayerData}
                    element={element}
                    generalInfoFormat={generalInfoFormat}
                    chartStyle={{height: 200, width: width - 30, ...chartStyle}}
                    showElevationChart={showElevationChart}
                    elevations={elevationDim}
                    updateSettings={onUpdateParams}
                    onShowEditor={onShowEditor}
                    onChange={(key, value) => onUpdateParams({[key]: value}, realtimeUpdate)}/>
            ) : null)}
        </DockPanel>
        <Portal>
            <ResizableModal
                fade
                show={alertModal}
                title={'Changed Settings'}
                size="xs"
                onClose={() => onShowAlertModal(false)}
                buttons={[
                    {
                        bsStyle: 'primary',
                        text: 'Close',
                        onClick: () => onClose(true)
                    },
                    {
                        bsStyle: 'primary',
                        text: 'Save',
                        onClick: onSave
                    }
                ]}>
                <div className="ms-alert">
                    <div className="ms-alert-center">
                        You are closing the settings panel without save your changes.
                    </div>
                </div>
            </ResizableModal>
        </Portal>
    </span>
    );
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

const updateSettingsLifecycle = compose(
    withState('originalSettings', 'onUpdateOriginalSettings', {}),
    withState('initialSettings', 'onUpdateInitialSettings', {}),
    withState('alertModal', 'onShowAlertModal', false),
    withState('showEditor', 'onShowEditor', false),
    withHandlers({
        onUpdateParams: props => (newParams, update = true) => {
            let originalSettings = {...props.originalSettings};
            // TODO one level only storage of original settings for the moment
            Object.keys(newParams).forEach((key) => {
                originalSettings[key] = props.initialSettings[key];
            });
            props.onUpdateOriginalSettings(originalSettings);
            props.onUpdateSettings(newParams);
            if (update) {
                props.onUpdateNode(
                    props.settings.node,
                    props.settings.nodeType,
                    {...props.settings.options, ...newParams}
                );
            }
        },
        onClose: ({onUpdateNode, originalSettings, settings, onHideSettings, onShowAlertModal}) => forceClose => {
            const originalOptions = Object.keys(settings.options).reduce((options, key) => ({...options, [key]: key === 'opacity' && !originalSettings[key] && 1.0 || originalSettings[key]}), {});
            if (!isEqual(originalOptions, settings.options) && !forceClose) {
                onShowAlertModal(true);
            } else {
                onUpdateNode(
                    settings.node,
                    settings.nodeType,
                    {...settings.options, ...originalSettings}
                );
                onHideSettings();
                onShowAlertModal(false);
            }
        },
        onSave: ({onHideSettings, onShowAlertModal}) => () => {
            onHideSettings();
            onShowAlertModal(false);
        }
    }),
    lifecycle({
        componentWillMount() {
            this.props.onUpdateOriginalSettings({...this.props.element});
            this.props.onUpdateInitialSettings({...this.props.element});
        },
        componentWillReceiveProps(newProps) {
            // an empty description does not trigger the single layer getCapabilites,
            // it does only for missing description
            if (!this.props.settings.expanded && newProps.settings.expanded && isNil(newProps.element.description) && newProps.element.type === "wms") {
                this.props.onRetrieveLayerData(newProps.element);
            }
        },
        componentWillUpdate(newProps) {
            if (!this.props.settings.expanded && newProps.settings.expanded) {
                // update initial and original settings
                this.props.onUpdateOriginalSettings({...newProps.element});
                this.props.onUpdateInitialSettings({...newProps.element});
                this.props.onSetTab('general');
            }
        }
    })
);

const TOCSettingsPlugin = compose(
    connect(tocSettingsSelector, {
        onHideSettings: hideSettings,
        onUpdateSettings: updateSettings,
        onUpdateNode: updateNode,
        onRetrieveLayerData: getLayerCapabilities
    }),
    withState('activeTab', 'onSetTab', 'general'),
    updateSettingsLifecycle
)(DockSettings);

module.exports = {
    TOCSettingsPlugin
};
