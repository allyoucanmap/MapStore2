/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {Row, Col, Nav, NavItem, Glyphicon} = require('react-bootstrap');
const ModalOrDockContainer = require('../misc/ModalOrDockContainer');
const Toolbar = require('../misc/toolbar/Toolbar');
const tooltip = require('../misc/enhancers/tooltip');
const NavItemT = tooltip(NavItem);
const ResizableModal = require('../misc/ResizableModal');
const Portal = require('../misc/Portal');
const {head, isObject} = require('lodash');
const Message = require('../I18N/Message');

module.exports = props => {
    const {
        className = '',
        activeTab = 'general',
        currentLocale = 'en-US',
        generalInfoFormat = 'text/plain',
        width = 500,
        groups = [],
        element = {},
        settings = {},
        chartStyle = {},
        getTabs = () => [],
        getDimension = () => {},
        onSave = () => {},
        onClose = () => {},
        onHideSettings = () => {},
        onSetTab = () => {},
        onUpdateParams = () => {},
        onRetrieveLayerData = () => {},
        onShowAlertModal = () => {},
        realtimeUpdate = true,
        showElevationChart = true,
        alertModal = false,
        showEditor = false,
        onShowEditor = () => {},
        onSelectCardItem = () => {},
        selectedCardItems = () => {},
        pageStep = 0,
        onChangeStep = () => {},
        dockStyle = {},
        asPanel = true,
        showFullscreen,
        draggable,
        position = 'left'
    } = props;
    const elevationDim = getDimension(element.dimensions, 'elevation');
    const tabs = getTabs(props);
    return (
        <span>
            <ModalOrDockContainer
                open={settings.expanded}
                glyph="wrench"
                title={element.title && isObject(element.title) && (element.title[currentLocale] || element.title.default) || element.title || ''}
                className={className}
                onClose={onClose ? () => { onClose(); } : onHideSettings}
                size={width}
                style={dockStyle}
                showFullscreen={showFullscreen}
                asPanel={asPanel}
                draggable={draggable}
                position={position}
                header={[
                    <Row key="ms-toc-settings-toolbar" className="text-center">
                        <Col xs={12}>
                            <Toolbar
                                btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                                buttons={[{
                                    glyph: 'floppy-disk',
                                    tooltipId: 'save',
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
                                        tooltip={<Message msgId={tab.tooltipId}/> }
                                        eventKey={tab.id}
                                        onClick={() => onSetTab(tab.id)}>
                                        <Glyphicon glyph={tab.glyph}/>
                                    </NavItemT>
                                )}
                            </Nav>
                        </Col>
                    </Row>] : [])
                ]}>
            {tabs.filter(tab => tab.id && tab.id === activeTab).filter(tab => tab.Component).map(tab => (
                <tab.Component
                    key={'ms-tab-settings-body-' + tab.id}
                    opacityText={<Message msgId="opacity"/>}
                    label= {<Message msgId="layerProperties.featureInfoFormatLbl"/>}
                    elevationText={<Message msgId="elevation"/>}
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
                    onSelectCardItem={onSelectCardItem}
                    selectedCardItems={selectedCardItems}
                    pageStep={pageStep}
                    onChangeStep={onChangeStep}
                    onChange={(key, value) => onUpdateParams({[key]: value}, realtimeUpdate)}/>
            ))}
        </ModalOrDockContainer>
        <Portal>
            <ResizableModal
                fade
                show={alertModal}
                title={<Message msgId="layerProperties.Changed Settings"/>}
                size="xs"
                onClose={() => onShowAlertModal(false)}
                buttons={[
                    {
                        bsStyle: 'primary',
                        text: <Message msgId="close"/>,
                        onClick: () => onClose(true)
                    },
                    {
                        bsStyle: 'primary',
                        text: <Message msgId="save"/>,
                        onClick: onSave
                    }
                ]}>
                <div className="ms-alert">
                    <div className="ms-alert-center">
                        <Message msgId="layerProperties.You are closing the settings panel without save your changes."/>
                    </div>
                </div>
            </ResizableModal>
        </Portal>
    </span>
    );
};
