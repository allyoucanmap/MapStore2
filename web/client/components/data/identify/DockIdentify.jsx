
const React = require('react');
const {Grid, Glyphicon, Row, Col, Nav, NavItem} = require('react-bootstrap');
const tooltip = require('../../misc/enhancers/tooltip');
const NavItemT = tooltip(NavItem);
const DockPanel = require('../../misc/panels/DockPanel');
const Toolbar = require('../../misc/toolbar/Toolbar');
const ResizableModal = require('../../misc/ResizableModal');
const Portal = require('../../misc/Portal');
const Message = require('../../I18N/Message');

module.exports = ({
    latlng,
    tabs = [],
    enableRevGeocode,
    enabled, requests,
    activeTab, onChange,
    onClose, showModalReverse,
    hideRevGeocode,
    showRevGeocode,
    revGeocodeDisplayName,
    onPrevious = () => {},
    onNext = () => {},
    swipable = true,
    responses = [],
    index,
    viewerOptions,
    format,
    missingResponses,
    setIndex
}) => {

    let lngCorrected = null;
    if (latlng) {
        /* lngCorrected is the converted longitude in order to have the value between
        the range (-180 / +180).*/
        lngCorrected = latlng && Math.round(latlng.lng * 100000) / 100000;
        /* the following formula apply the converion */
        lngCorrected = lngCorrected - 360 * Math.floor(lngCorrected / 360 + 0.5);
    }

    return (
        <span>
            <DockPanel
                bsStyle="primary"
                glyph="map-marker"
                title={<Message msgId="identifyTitle" />}
                open={enabled && requests.length !== 0}
                width={660}
                position="right"
                onClose={onClose}
                header={[
                    <Row key="ms-gfi-layer-title" className="text-center">
                        <Col xs={12}>
                            <strong>{responses[index] && responses[index].layerMetadata && responses[index].layerMetadata.title || ' '}</strong>
                        </Col>
                    </Row>,
                    latlng && enableRevGeocode && lngCorrected ?
                    <Row key="ms-geocode-coords" className="text-center">
                        <Col xs={12}>
                            Lat: {Math.round(latlng.lat * 100000) / 100000 } - Long: { lngCorrected }
                        </Col>
                    </Row> : null,
                    tabs.length > 1 ?
                    <Row key="ms-gfi-tabs">
                        <Col xs={12}>
                            <Nav bsStyle="tabs" activeKey={activeTab} justified>
                                {tabs.map(tab =>
                                    <NavItemT
                                        tooltip={tab.tooltip}
                                        eventKey={tab.title}
                                        onClick={() => { onChange(tab.title); }}>
                                        <Glyphicon glyph={tab.glyph}/>
                                    </NavItemT>
                                )}
                            </Nav>
                        </Col>
                    </Row> : null,
                    <Row key="ms-gfi-toolbar" className="text-center">
                        <Col xs={12}>
                            <Toolbar
                                btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                                buttons={[
                                    {
                                        glyph: 'arrow-left',
                                        visible: swipable && responses.length > 1 && index > 0,
                                        onClick: () => {
                                            onPrevious();
                                        }
                                    },
                                    {
                                        glyph: 'info-sign',
                                        tooltip: 'OK',
                                        visible: latlng && enableRevGeocode && lngCorrected,
                                        onClick: () => {
                                            showRevGeocode({lat: latlng.lat, lng: lngCorrected});
                                        }
                                    },
                                    {
                                        glyph: 'arrow-right',
                                        visible: swipable && responses.length > 1 && index < responses.length - 1,
                                        onClick: () => {
                                            onNext();
                                        }
                                    }
                                ]}/>
                        </Col>
                    </Row>].filter(headRow => headRow)}>
                {tabs.filter(tab => tab.title === activeTab).map(tab => <tab.el
                    isDockPanel
                    index={index}
                    format={format}
                    missingResponses={missingResponses}
                    responses={responses}
                    {...viewerOptions}
                    setIndex={idx => setIndex(idx)}
                    header={null} />)}
            </DockPanel>
            <Portal>
                <ResizableModal
                    fade
                    title={<span><Glyphicon glyph="map-marker"/>&nbsp;<Message msgId="identifyRevGeocodeModalTitle" /></span>}
                    size="sm"
                    show={showModalReverse}
                    onClose={hideRevGeocode}
                    buttons={[{
                        text: <Message msgId="close"/>,
                        onClick: hideRevGeocode,
                        bsStyle: 'primary'
                    }]}>
                    <Grid fluid style={{paddingTop: 15, paddingBottom: 15}}>
                        <Row>
                            <Col xs={12}>
                                {revGeocodeDisplayName}
                            </Col>
                        </Row>
                    </Grid>
                </ResizableModal>
            </Portal>
        </span>
    );
};
