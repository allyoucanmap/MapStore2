/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {Glyphicon, Row, Col, Nav, NavItem} = require('react-bootstrap');
const tooltip = require('../../misc/enhancers/tooltip');
const NavItemT = tooltip(NavItem);
const Toolbar = require('../../misc/toolbar/Toolbar');
const ResizableModal = require('../../misc/ResizableModal');
const Portal = require('../../misc/Portal');
const Message = require('../../I18N/Message');
const MapInfoUtils = require('../../../utils/MapInfoUtils');
const ModalOrDockContainer = require('../../misc/ModalOrDockContainer');

module.exports = props => {
    const {
        // onPrevious = () => {},
        // onNext = () => {},
        // swipable = true,
        // showRevGeocode,
        latlng,
        tabs = [],
        enableRevGeocode,
        enabled,
        requests,
        activeTab,
        onChange,
        onClose,
        showModalReverse,
        hideRevGeocode,
        revGeocodeDisplayName,
        responses = [],
        index,
        viewerOptions,
        format,
        missingResponses,
        setIndex,
        asPanel,
        position,
        size,
        fluid,
        validator = MapInfoUtils.getValidator,
        viewer,
        getButtons
    } = props;

    let lngCorrected = null;
    if (latlng) {
        /* lngCorrected is the converted longitude in order to have the value between
        the range (-180 / +180).*/
        lngCorrected = latlng && Math.round(latlng.lng * 100000) / 100000;
        /* the following formula apply the converion */
        lngCorrected = lngCorrected - 360 * Math.floor(lngCorrected / 360 + 0.5);
    }

    const validatorFormat = validator(format);
    const validResponses = validatorFormat.getValidResponses(responses);
    const isCustomViewer = validResponses[index] && validResponses[index].layerMetadata && (validResponses[index].layerMetadata.rowViewer || validResponses[index].layerMetadata.viewer && validResponses[index].layerMetadata.viewer.type) ? true : false;
    const Viewer = viewer;
    const buttons = getButtons({...props, lngCorrected, validResponses});
    return (
        <span>
            <ModalOrDockContainer
                bsStyle="primary"
                glyph="map-marker"
                title={!viewerOptions.header ? validResponses[index] && validResponses[index].layerMetadata && validResponses[index].layerMetadata.title || '' : <Message msgId="identifyTitle" />}
                open={enabled && requests.length !== 0}
                size={size}
                fluid={fluid}
                position={position}
                draggable
                onClose={onClose}
                asPanel={asPanel}
                header={[
                    !viewerOptions.header || enableRevGeocode ?
                    <Row key="ms-geocode-coords" className={!isCustomViewer && !viewerOptions.header ? 'text-center' : ''}>
                        <Col xs={!isCustomViewer && !viewerOptions.header ? 12 : 6}>
                            <div>{latlng ? 'Lat: ' + (Math.round(latlng.lat * 100000) / 100000) + '- Long: ' + lngCorrected : null}</div>
                        </Col>
                        {buttons.length > 0 && <Col xs={!isCustomViewer && !viewerOptions.header ? 12 : 6}>
                            <Toolbar
                                btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                                buttons={buttons}/>
                        </Col>}
                    </Row> : null,
                    validResponses.length > 0 && !viewerOptions.header && !isCustomViewer && tabs.length > 1 ?
                    <Row key="ms-gfi-tabs" className="ms-row-tab">
                        <Col xs={12}>
                            <Nav bsStyle="tabs" activeKey={activeTab} justified>
                                {tabs.map(tab =>
                                    <NavItemT
                                        tooltip={tab.tooltip}
                                        eventKey={tab.id}
                                        onClick={() => { onChange(tab.id); }}>
                                        <Glyphicon glyph={tab.glyph}/>
                                    </NavItemT>
                                )}
                            </Nav>
                        </Col>
                    </Row> : null].filter(headRow => headRow)}>
                {!isCustomViewer && validResponses.length > 0 ?
                    tabs.filter(tab => tab.id === activeTab).map(tab =>
                        <tab.el
                            index={index}
                            format={format}
                            data={validResponses && validResponses[index]}
                            missingResponses={missingResponses}
                            responses={responses}
                            identifyProps={props}
                            {...viewerOptions}
                            setIndex={idx => setIndex(idx)}/>
                        )
                        : <Viewer format={format} missingResponses={missingResponses} responses={responses} {...viewerOptions}/>}
            </ModalOrDockContainer>
            {enableRevGeocode && <Portal>
                <ResizableModal
                    fade
                    title={<span><Glyphicon glyph="map-marker"/>&nbsp;<Message msgId="identifyRevGeocodeModalTitle" /></span>}
                    size="xs"
                    show={showModalReverse}
                    onClose={hideRevGeocode}
                    buttons={[{
                        text: <Message msgId="close"/>,
                        onClick: hideRevGeocode,
                        bsStyle: 'primary'
                    }]}>
                    <div className="ms-alert" style={{padding: 15}}>
                        <div className="ms-alert-center text-center">
                            <div>{revGeocodeDisplayName}</div>
                        </div>
                    </div>
                </ResizableModal>
            </Portal>}
        </span>
    );
};
