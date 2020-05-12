/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import get from 'lodash/get';
import Toolbar from '../../misc/toolbar/Toolbar';
import Message from '../../I18N/Message';
import DockablePanel from '../../misc/panels/DockablePanel';
/* const DockablePanel = require('../../misc/panels/DockablePanel');
*/
import GeocodeViewer from './GeocodeViewer';
import ResizableModal from '../../misc/ResizableModal';
import Portal from '../../misc/Portal';
import Coordinate from './coordinates/Coordinate';
import { responseValidForEdit } from '../../../utils/IdentifyUtils';
import Select from 'react-select';
import BorderLayout from '../../layout/BorderLayout';

const mockState = {
    'gs:us_states__5': 'State of US',
    'gs:observatories__6': 'observatories'
};

/**
 * Component for rendering Identify Container inside a Dockable container
 * @memberof components.data.identify
 * @name IdentifyContainer
 * @class
 * @prop {dock} dock switch between Dockable Panel and Resizable Modal, default true (DockPanel)
 * @prop {function} viewer component that will be used as viewer of Identify
 * @prop {object} viewerOptions options to use with the viewer, eg { header: MyHeader, container: MyContainer }
 * @prop {function} getToolButtons must return an array of object representing the toolbar buttons, eg (props) => [{ glyph: 'info-sign', tooltip: 'hello!'}]
 * @prop {function} getNavigationButtons must return an array of navigation buttons, eg (props) => [{ glyph: 'info-sign', tooltip: 'hello!'}]
 */
const IdentifyContainer = props => {
    const {
        enabled,
        requests = [],
        onClose,
        responses = [],
        index,
        viewerOptions = {},
        format,
        dock = true,
        position,
        size,
        fluid,
        validResponses = [],
        viewer = () => null,
        getToolButtons = () => [],
        getNavigationButtons = () => [],
        showFullscreen,
        reverseGeocodeData = {},
        point,
        dockStyle = {},
        draggable,
        setIndex,
        warning,
        clearWarning,
        zIndex,
        showEmptyMessageGFI,
        showEdit,
        isEditingAllowed,
        onEdit = () => { },
        // coord editor props
        enabledCoordEditorButton,
        showCoordinateEditor,
        onSubmitClickPoint,
        onChangeFormat,
        formatCoord
    } = props;

    const latlng = point && point.latlng || null;
    const { layer } = responses[index] || {};

    let lngCorrected = null;
    if (latlng) {
        /* lngCorrected is the converted longitude in order to have the value between
         * the range (-180 / +180).
         * Precision has to be >= than the coordinate editor precision
         * especially in the case of aeronautical degree edito which is 12
        */
        lngCorrected = latlng && Math.round(latlng.lng * 100000000000000000) / 100000000000000000;
        /* the following formula apply the converion */
        lngCorrected = lngCorrected - 360 * Math.floor(lngCorrected / 360 + 0.5);
    }
    const Viewer = viewer;
    // TODO: put all the header (Toolbar, navigation, coordinate editor) outside the container
    const toolButtons = getToolButtons({
        ...props,
        lngCorrected,
        validResponses,
        latlng,
        showEdit: showEdit && isEditingAllowed && !!responses[index] && responseValidForEdit(responses[index]),
        onEdit: onEdit.bind(null, layer && {
            id: layer.id,
            name: layer.name,
            url: get(layer, 'search.url')
        })
    });
    const missingResponses = requests.length - responses.length;

    const showEditAllowed = showEdit && isEditingAllowed && !!responses[index] && responseValidForEdit(responses[index]);

    const revGeocodeDisplayName = reverseGeocodeData.error ? <Message msgId="identifyRevGeocodeError" /> : reverseGeocodeData.display_name;
    return (
        <DockablePanel
            bsStyle="primary"
            glyph="map-marker"
            // title={!viewerOptions.header ? validResponses[index] && validResponses[index].layerMetadata && validResponses[index].layerMetadata.title || '' : <Message msgId="identifyTitle" />}
            open={enabled && requests.length !== 0}
            size={size}
            fluid={fluid}
            position={position}
            draggable={draggable}
            onClose={onClose}
            dock={dock}
            style={dockStyle}
            showFullscreen={showFullscreen}
            zIndex={zIndex}>
            <div
                id="identify-container"
                className={enabled && requests.length !== 0 ? "identify-active" : ""}
                style={{ position: 'relative', right: 0, width: '100%', height: '100%', backgroundColor: '#fff', zIndex: 200000 }}>
                <BorderLayout
                    header={<>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 8px 0 8px',
                                zIndex: 10
                            }}>
                            <Glyphicon glyph="1-layer" style={{ paddingRight: 8 }} />
                            <div style={{ flex: 1, marginRight: 8 }}>
                                <Select
                                    disabled={!!(missingResponses === 0 && validResponses.length === 0)}
                                    clearable={false}
                                    value={{
                                        value: requests?.[index]?.request?.id,
                                        label: mockState[requests?.[index]?.request?.id] || requests?.[index]?.request?.id
                                    }}
                                    options={[...requests].map((request, idx) => ({
                                        value: request?.request?.id,
                                        label: mockState[request?.request?.id] || request?.request?.id,
                                        index: idx
                                    })).reverse()}
                                    onChange={(selected) => {
                                        setIndex(selected.index);
                                    }}/>
                            </div>
                            <Toolbar
                                btnDefaultProps={{
                                    className: 'square-button-md',
                                    bsStyle: 'primary'
                                }}
                                buttons={[
                                    {
                                        glyph: 'map-filter',
                                        visible: props.showHighlightFeatureButton,
                                        tooltipId: props.highlight ? "identifyStopHighlightingFeatures" : "identifyHighlightFeatures",
                                        bsStyle: props.highlight ? "success" : "primary",
                                        onClick: () => props.toggleHighlightFeature(!props.highlight)
                                    }, {
                                        glyph: 'zoom-to',
                                        visible:
                                            !!(props.highlight
                                            && !!props.currentFeature
                                            && props.currentFeature.length > 0
                                            // has at least 1 geometry
                                            && props.currentFeature.reduce((hasGeometries, { geometry } = {}) => hasGeometries || !!geometry, false)),
                                        tooltipId: "identifyZoomToFeature",
                                        onClick: props.zoomToFeature
                                    }, {
                                        glyph: 'pencil',
                                        visible: showEditAllowed,
                                        tooltipId: "identifyEdit",
                                        onClick: () => onEdit(layer && {
                                            id: layer.id,
                                            name: layer.name,
                                            url: get(layer, 'search.url')
                                        })
                                    }
                                ]}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: 8,
                                marginTop: 8,
                                borderTop: '1px solid #ddd',
                                borderBottom: '1px solid #ddd'
                            }}>
                            <Glyphicon glyph="point" style={{ paddingRight: 8 }} />
                            <div style={{ flex: 1, marginRight: 8, fontFamily: 'monospace' }}>
                                <Coordinate
                                    key="coordinate-editor"
                                    formatCoord={formatCoord}
                                    enabledCoordEditorButton={enabledCoordEditorButton}
                                    onSubmit={onSubmitClickPoint}
                                    onChangeFormat={onChangeFormat}
                                    edit={showCoordinateEditor}
                                    coordinate={{
                                        lat: latlng && latlng.lat,
                                        lon: lngCorrected
                                    }}
                                />
                            </div>
                            <Toolbar
                                btnDefaultProps={{
                                    className: 'square-button-md',
                                    bsStyle: 'primary'
                                }}
                                buttons={[
                                    {
                                        glyph: 'info-sign',
                                        tooltipId: 'identifyRevGeocodeSubmitText',
                                        visible: latlng && props.enableRevGeocode && lngCorrected,
                                        onClick: () => {
                                            props.showRevGeocode({lat: latlng.lat, lng: lngCorrected});
                                        }
                                    },
                                    {
                                        glyph: 'search-coords',
                                        tooltipId: props.showCoordinateEditor ? 'identifyHideCoordinateEditor' : 'identifyShowCoordinateEditor',
                                        visible: props.enabledCoordEditorButton,
                                        bsStyle: (props.showCoordinateEditor) ? "success" : "primary",
                                        onClick: () => {
                                            props.onToggleShowCoordinateEditor(props.showCoordinateEditor);
                                        }
                                    }
                                ]}
                            />
                        </div>
                        <GeocodeViewer latlng={latlng} revGeocodeDisplayName={revGeocodeDisplayName} {...props}/>
                    </>}>
                    <Viewer
                        index={index}
                        setIndex={setIndex}
                        format={format}
                        missingResponses={missingResponses}
                        responses={responses}
                        showEmptyMessageGFI={showEmptyMessageGFI}
                        {...viewerOptions} />
                </BorderLayout>
                <Portal>
                    <ResizableModal
                        fade
                        title={<Message msgId="warning"/>}
                        size="xs"
                        show={warning}
                        onClose={clearWarning}
                        buttons={[{
                            text: <Message msgId="close"/>,
                            onClick: clearWarning,
                            bsStyle: 'primary'
                        }]}>
                        <div className="ms-alert" style={{padding: 15}}>
                            <div className="ms-alert-center text-center">
                                <Message msgId="identifyNoQueryableLayers"/>
                            </div>
                        </div>
                    </ResizableModal>
                </Portal>


                {/* <DockablePanel
                bsStyle="primary"
                glyph="map-marker"
                title={!viewerOptions.header ? validResponses[index] && validResponses[index].layerMetadata && validResponses[index].layerMetadata.title || '' : <Message msgId="identifyTitle" />}
                open={enabled && requests.length !== 0}
                size={size}
                fluid={fluid}
                position={position}
                draggable={draggable}
                onClose={onClose}
                dock={dock}
                style={dockStyle}
                showFullscreen={showFullscreen}
                zIndex={zIndex}
                header={[
                    <Coordinate
                        key="coordinate-editor"
                        formatCoord={formatCoord}
                        enabledCoordEditorButton={enabledCoordEditorButton}
                        onSubmit={onSubmitClickPoint}
                        onChangeFormat={onChangeFormat}
                        edit={showCoordinateEditor}
                        coordinate={{
                            lat: latlng && latlng.lat,
                            lon: lngCorrected
                        }}
                    />,
                    <GeocodeViewer latlng={latlng} revGeocodeDisplayName={revGeocodeDisplayName} {...props}/>,
                    <Row key="button-row" className="text-center" style={{position: 'relative'}}>
                        <Col key="tools" xs={12}>
                            <Toolbar
                                btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                                buttons={toolButtons}
                                transitionProps={null
                                    // transitions was causing a bad rendering of toolbar present in the identify panel
                                    // for this reason they ahve been disabled
                                }/>
                        </Col>
                        <div key="navigation" style={{
                            zIndex: 1,
                            position: "absolute",
                            right: 0,
                            top: 0,
                            margin: "0 10px"
                        }}>
                            <Toolbar
                                btnDefaultProps={{ bsStyle: 'primary', className: 'square-button-md' }}
                                buttons={getNavigationButtons(props)}
                                transitionProps={null
                                    // same here
                                }
                            />
                        </div>
                    </Row>
                ].filter(headRow => headRow)}>
                <Viewer
                    index={index}
                    setIndex={setIndex}
                    format={format}
                    missingResponses={missingResponses}
                    responses={responses}
                    showEmptyMessageGFI={showEmptyMessageGFI}
                    {...viewerOptions}/>
            </DockablePanel>
            <Portal>
                <ResizableModal
                    fade
                    title={<Message msgId="warning"/>}
                    size="xs"
                    show={warning}
                    onClose={clearWarning}
                    buttons={[{
                        text: <Message msgId="close"/>,
                        onClick: clearWarning,
                        bsStyle: 'primary'
                    }]}>
                    <div className="ms-alert" style={{padding: 15}}>
                        <div className="ms-alert-center text-center">
                            <Message msgId="identifyNoQueryableLayers"/>
                        </div>
                    </div>
                </ResizableModal>
                </Portal>*/}
            </div>
        </DockablePanel>
    );
};


export default IdentifyContainer;
