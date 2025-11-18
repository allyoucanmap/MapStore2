/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import {compose, withProps} from 'recompose';

import Message from '../../../../I18N/Message';
import emptyState from '../../../../misc/enhancers/emptyState';
import localizeStringMap from '../../../../misc/enhancers/localizeStringMap';
import StepHeader from '../../../../misc/wizard/StepHeader';
import nodeEditor from './enhancers/nodeEditor';
import NodeEditorComp from './NodeEditor';
import TOCComp from './TOC';
import { Glyphicon, Tab, Tabs } from 'react-bootstrap';
import FlexBox from '../../../../layout/FlexBox';
import Text from '../../../../layout/Text';
import Button from '../../../../layout/Button';
import tooltip from '../../../../misc/enhancers/tooltip';
import { createPortal } from 'react-dom';

const GlyphiconTooltip = tooltip(Glyphicon);

const TOC = emptyState(
    ({ map = {} } = {}) => !map.layers || (map.layers || []).filter(l => l.group !== 'background').length === 0,
    () => ({
        glyph: "1-layer",
        title: <Message msgId="widgets.selectMap.TOC.noLayerTitle" />,
        description: <Message msgId="widgets.selectMap.TOC.noLayerDescription" />
    })
)(TOCComp);

const Editor = nodeEditor(NodeEditorComp);
const EditorTitle = compose(
    nodeEditor,
    withProps(({selectedNode: layer}) => ({
        title: layer && layer.title
    })),
    localizeStringMap('title')
)(StepHeader);


export default ({ preview, data, map: mapProp = {}, widgets, onChange = () => { }, selectedNodes = [], onNodeSelect = () => { }, editNode, closeNodeEditor = () => { }, isLocalizedLayerStylesEnabled }) => {

    const [overStyle, setOverStyle] = useState();
    const widgetsViewNode = document.querySelector('.ms-widgets-view');
    const widgetsViewNodeStyle = widgetsViewNode?.getBoundingClientRect() || { };
    const _selectedStyle = document.querySelector(`#widget-text-${data.id}`)?.getBoundingClientRect() || { };
    const selectedStyle = { width: _selectedStyle.width, height: _selectedStyle.height, left: _selectedStyle.left - widgetsViewNodeStyle.left, top: _selectedStyle.top - widgetsViewNodeStyle.top}
    const handlePointerOver = (id) => {
        const { left, top, width, height } = document.querySelector(id)?.getBoundingClientRect() || { };
        setOverStyle({ left: left - widgetsViewNodeStyle.left, top: top - widgetsViewNodeStyle.top, width, height });
    };
    return (<div>
        <StepHeader title={<Message msgId={`widgets.builder.wizard.configureMapOptions`} />} />
        <div key="sample" style={{marginTop: 10}}>
            <StepHeader title={<Message msgId={`widgets.builder.wizard.preview`} />} />
            <div style={{ width: "100%", height: "200px"}}>
                {preview}
            </div>
        </div>
        {editNode
            ? <><EditorTitle map={mapProp} editNode={editNode} />
                <Editor
                    closeNodeEditor={closeNodeEditor}
                    editNode={editNode}
                    map={mapProp}
                    onChange={onChange}
                    isLocalizedLayerStylesEnabled={isLocalizedLayerStylesEnabled} />
            </> : <>
                <Tabs>
                    <Tab eventKey="layers" title={'layers'}>
                        <TOC
                            selectedNodes={selectedNodes}
                            onSelect={onNodeSelect}
                            onChange={onChange}
                            map={mapProp} />
                    </Tab>
                    <Tab eventKey="interactions" title={'Interactions'}>
                        <FlexBox className="ms-interactions-container" component="ul" column gap="sm">
                            <FlexBox component="li" gap="xs" column>
                                <FlexBox className="ms-interactions-event"gap="sm" centerChildrenVertically ><Button borderTransparent style={{ padding: 0, background: 'transparent' }}><Glyphicon glyph="bottom" /></Button><Glyphicon glyph="viewport-filter" /><Text fontSize="md">Viewport filter</Text></FlexBox>
                                <FlexBox className="ms-interactions-targets" component="ul" column gap="sm" >
                                    {widgets.filter(({ widgetType, id }) => !['legend', 'text'].includes(widgetType) && data.id !== id).map((widget) => {
                                        // if (widget.widgetType === 'map') {
                                        //     if (widget.maps.length === 1) {
                                        //         const map = widget.maps[0];
                                        //         return (
                                        //             <FlexBox className="ms-interaction-target" component="li" gap="xs" key={widget.id} column onPointerOver={() => handlePointerOver(`#widget-text-${widget.id}`)}>
                                        //                 <FlexBox key={map.mapId} gap="xs" column>
                                        //                     <FlexBox gap="xs" className="ms-connection-row" ><Glyphicon glyph={'1-map'}/> {map.name || widget.title}</FlexBox>
                                        //                     <FlexBox component="ul" column gap="xs">
                                        //                         {map.layers.filter(l => l.group !== 'background').map((l) => {
                                        //                             return (
                                        //                                 <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                        //                                     <Glyphicon glyph={'1-layer'}/>
                                        //                                     <FlexBox.Fill>{l.title || l.name}</FlexBox.Fill>
                                        //                                     <GlyphiconTooltip glyph="dataset" tooltip={'Compatible dataset with the widget datasource'}/>
                                        //                                     <Button borderTransparent>
                                        //                                         <Glyphicon glyph="unplug" />
                                        //                                     </Button>
                                        //                                 </FlexBox>
                                        //                             );
                                        //                         })}
                                        //                     </FlexBox>
                                        //                 </FlexBox>
                                        //             </FlexBox>
                                        //         );
                                        //     }

                                        //     return (
                                        //         <FlexBox className="ms-interaction-target" component="li" gap="xs" key={widget.id} column>
                                        //             <FlexBox className="ms-connection-row" centerChildrenVertically gap="xs">
                                        //                 <Glyphicon glyph={'1-map'}/>
                                        //                 <FlexBox.Fill>{widget.title}</FlexBox.Fill>
                                        //             </FlexBox>
                                        //             <FlexBox component="ul" column gap="xs">
                                        //                 {widget.maps.map((map) => {
                                        //                     return (
                                        //                         <FlexBox key={map.mapId} component="li" gap="xs" column>
                                        //                             <FlexBox gap="xs" className="ms-connection-row" ><Glyphicon glyph={'1-map'}/> {map.name || widget.title}</FlexBox>
                                        //                             <FlexBox component="ul" column gap="xs">
                                        //                                 {map.layers.filter(l => l.group !== 'background').map((l) => {
                                        //                                     return (
                                        //                                         <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                        //                                             <Glyphicon glyph={'1-layer'}/>
                                        //                                             <FlexBox.Fill>{l.title || l.name}</FlexBox.Fill>
                                        //                                             <Glyphicon glyph="dataset" />
                                        //                                             <Button borderTransparent>
                                        //                                                 <Glyphicon glyph="unplug" />
                                        //                                             </Button>
                                        //                                         </FlexBox>
                                        //                                     );
                                        //                                 })}
                                        //                             </FlexBox>
                                        //                         </FlexBox>
                                        //                     );
                                        //                 })}
                                        //             </FlexBox>
                                        //         </FlexBox>
                                        //     );
                                        // }
                                        if (widget.widgetType === 'chart') {

                                            if (widget.charts.length === 1) {
                                                const chart = widget.charts[0];
                                                return (
                                                    <FlexBox className="ms-interaction-target" key={chart.chartId} component="li" gap="xs" column onPointerOver={() => handlePointerOver(`#widget-chart-${widget.id}`)}>
                                                        <FlexBox gap="xs" className="ms-connection-row"><Glyphicon glyph={'chart'}/> {chart.name}</FlexBox>
                                                        <FlexBox component="ul" column gap="xs">
                                                            {chart.traces.map((trace) => {
                                                                if (trace.type === 'pie') {
                                                                    return (
                                                                        <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                                                            <Glyphicon glyph={'pie-chart'}/>
                                                                            <FlexBox.Fill>{trace.name || trace.options.aggregationAttribute}</FlexBox.Fill>
                                                                            <Glyphicon glyph="dataset" />
                                                                            <Button borderTransparent>
                                                                                <Glyphicon glyph="unplug" />
                                                                            </Button>
                                                                        </FlexBox>);
                                                                }
                                                                if (trace.type === 'line') {
                                                                    return (
                                                                        <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                                                            <Glyphicon glyph={'line'}/>
                                                                            <FlexBox.Fill>{trace.name || trace.options.aggregationAttribute}</FlexBox.Fill>
                                                                            <Glyphicon glyph="dataset" />
                                                                            <Button borderTransparent>
                                                                                <Glyphicon glyph="unplug" />
                                                                            </Button>
                                                                        </FlexBox>
                                                                    );
                                                                }
                                                                if (trace.type === 'bar') {
                                                                    return (
                                                                        <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                                                            <Glyphicon glyph={'bar-chart'}/>
                                                                            <FlexBox.Fill>{trace.name || trace.options.aggregationAttribute}</FlexBox.Fill>
                                                                            <Glyphicon glyph="dataset" />
                                                                            <Button borderTransparent>
                                                                                <Glyphicon glyph="unplug" />
                                                                            </Button>
                                                                        </FlexBox>);
                                                                }
                                                                return null;
                                                            })}
                                                        </FlexBox>
                                                    </FlexBox>
                                                );
                                            }

                                            return (
                                                <FlexBox className="ms-interaction-target" component="li" gap="xs" key={widget.id} column onPointerOver={() => handlePointerOver(`#widget-chart-${widget.id}`)}>
                                                    <FlexBox gap="xs" className="ms-connection-row"><Glyphicon glyph={'widgets'}/> {widget.title}</FlexBox>
                                                    <FlexBox component="ul" column gap="xs">
                                                        {widget.charts.map((chart) => {
                                                            return (
                                                                <FlexBox key={chart.chartId} component="li" gap="xs" column>
                                                                    <FlexBox gap="xs" className="ms-connection-row"><Glyphicon glyph={'chart'}/> {chart.name}</FlexBox>
                                                                    <FlexBox component="ul" column gap="xs">
                                                                        {chart.traces.map((trace) => {
                                                                            if (trace.type === 'pie') {
                                                                                return (
                                                                                    <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                                                                        <Glyphicon glyph={'pie-chart'}/>
                                                                                        <FlexBox.Fill>{trace.name || trace.options.aggregationAttribute}</FlexBox.Fill>
                                                                                        <Glyphicon glyph="dataset" />
                                                                                        <Button borderTransparent>
                                                                                            <Glyphicon glyph="unplug" />
                                                                                        </Button>
                                                                                    </FlexBox>);
                                                                            }
                                                                            if (trace.type === 'line') {
                                                                                return (
                                                                                    <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                                                                        <Glyphicon glyph={'line'}/>
                                                                                        <FlexBox.Fill>{trace.name || trace.options.aggregationAttribute}</FlexBox.Fill>
                                                                                        <Glyphicon glyph="dataset" />
                                                                                        <Button borderTransparent>
                                                                                            <Glyphicon glyph="unplug" />
                                                                                        </Button>
                                                                                    </FlexBox>
                                                                                );
                                                                            }
                                                                            if (trace.type === 'bar') {
                                                                                return (
                                                                                    <FlexBox component="li" className="ms-connection-row" gap="xs" centerChildrenVertically>
                                                                                        <Glyphicon glyph={'bar-chart'}/>
                                                                                        <FlexBox.Fill>{trace.name || trace.options.aggregationAttribute}</FlexBox.Fill>
                                                                                        <Glyphicon glyph="dataset" />
                                                                                        <Button borderTransparent>
                                                                                            <Glyphicon glyph="unplug" />
                                                                                        </Button>
                                                                                    </FlexBox>);
                                                                            }
                                                                            return null;
                                                                        })}
                                                                    </FlexBox>
                                                                </FlexBox>
                                                            );
                                                        })}
                                                    </FlexBox>
                                                </FlexBox>
                                            );
                                        }
                                        if (widget.widgetType === 'counter') {
                                            return (
                                                <FlexBox className="ms-interaction-target ms-connection-row" component="li" centerChildrenVertically gap="xs" key={widget.id} onPointerOver={() => handlePointerOver(`#widget-chart-${widget.id}`)}>
                                                    <Glyphicon glyph={'counter'}/>
                                                    <FlexBox.Fill>{widget.title}</FlexBox.Fill>
                                                    <Button borderTransparent>
                                                        <Glyphicon glyph="unplug" />
                                                    </Button>
                                                </FlexBox>
                                            );
                                        }
                                        if (widget.widgetType === 'table') {
                                            return (
                                                <FlexBox className="ms-interaction-target ms-connection-row" component="li" gap="xs" key={widget.id} centerChildrenVertically onPointerOver={() => handlePointerOver(`#widget-chart-${widget.id}`)}>
                                                    <Glyphicon glyph={'features-grid'}/>
                                                    <FlexBox.Fill>{widget.title}</FlexBox.Fill>
                                                    <Button borderTransparent>
                                                        <Glyphicon glyph="unplug" />
                                                    </Button>
                                                </FlexBox>
                                            );
                                        }
                                        return null;
                                    })}
                                </FlexBox>
                            </FlexBox>
                            <FlexBox component="li" gap="xs" column>
                                <FlexBox className="ms-interactions-event"gap="sm" centerChildrenVertically ><Button borderTransparent style={{ padding: 0, background: 'transparent' }}><Glyphicon glyph="bottom" /></Button><Glyphicon glyph="map-synch" /><Text fontSize="md">Synchronize center and zoom</Text></FlexBox>
                                <FlexBox className="ms-interactions-targets" component="ul" column gap="sm">
                                    {widgets.filter(({ widgetType, id }) => !['legend', 'text'].includes(widgetType) && data.id !== id).map((widget) => {
                                        if (widget.widgetType === 'map') {
                                            if (widget.maps.length === 1) {
                                                const map = widget.maps[0];
                                                return (
                                                    <FlexBox className="ms-interaction-target" component="li" gap="xs" key={widget.id} column>
                                                        <FlexBox key={map.mapId} gap="xs" column>
                                                            <FlexBox gap="xs" className="ms-connection-row" centerChildrenVertically>
                                                                <Glyphicon glyph={'1-map'}/>
                                                                <FlexBox.Fill>{map.name || widget.title}</FlexBox.Fill>
                                                                <Button borderTransparent>
                                                                    <Glyphicon glyph="unplug" />
                                                                </Button>
                                                            </FlexBox>
                                                        </FlexBox>
                                                    </FlexBox>
                                                );
                                            }

                                            return (
                                                <FlexBox className="ms-interaction-target" component="li" gap="xs" key={widget.id} column>
                                                    <FlexBox className="ms-connection-row" centerChildrenVertically gap="xs">
                                                        <Glyphicon glyph={'1-map'}/>
                                                        <FlexBox.Fill>{widget.title}</FlexBox.Fill>
                                                    </FlexBox>
                                                    <FlexBox component="ul" column gap="xs">
                                                        {widget.maps.map((map) => {
                                                            return (
                                                                <FlexBox key={map.mapId} component="li" gap="xs" column>
                                                                    <FlexBox gap="xs" className="ms-connection-row" centerChildrenVertically><Glyphicon glyph={'1-map'}/> {map.name || widget.title}</FlexBox>
                                                                </FlexBox>
                                                            );
                                                        })}
                                                    </FlexBox>
                                                </FlexBox>
                                            );
                                        }
                                        return null;
                                    })}
                                </FlexBox>
                            </FlexBox>
                        </FlexBox>
                        {createPortal(
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }}>

                                <rect x={selectedStyle.left} y={selectedStyle.top} width={selectedStyle.width} height={selectedStyle.height} stroke="#6298fa" strokeWidth={4} fill="transparent" />
                                {overStyle ?
                                    <>
                                        <rect x={overStyle.left} y={overStyle.top} width={overStyle.width} height={overStyle.height} strokeDasharray="8" fill="transparent" stroke="#0075ff" strokeWidth={4} />
                                        <line
                                            x1={selectedStyle.left + selectedStyle.width / 2}
                                            y1={selectedStyle.top + selectedStyle.height / 2}
                                            x2={overStyle.left + overStyle.width / 2}
                                            y2={overStyle.top + overStyle.height / 2}
                                            strokeDasharray="16"
                                            stroke="#0075ff" strokeWidth={2} />
                                        <circle
                                            cx={overStyle.left + overStyle.width / 2}
                                            cy={overStyle.top + overStyle.height / 2}
                                            r={8}
                                            fill="#0075ff"
                                        />
                                    </> : null}
                            </svg>
                            , widgetsViewNode)}
                    </Tab>
                </Tabs>
            </>}
    </div>);
};
