/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import {Col, Glyphicon, Row, Tab, Tabs} from 'react-bootstrap';
import {compose} from 'recompose';

import Message from '../../../I18N/Message';
import emptyState from '../../../misc/enhancers/emptyState';
import {wizardHandlers} from '../../../misc/wizard/enhancers';
import StepHeader from '../../../misc/wizard/StepHeader';
import WizardContainer from '../../../misc/wizard/WizardContainer';
import emptyLegendState from '../../enhancers/emptyLegendState';
import legendWidget from '../../enhancers/legendWidget';
import LegendView from '../../widget/LegendView';
import WidgetOptions from './common/WidgetOptions';
import FlexBox from '../../../layout/FlexBox';
import Button from '../../../layout/Button';
import tooltip from '../../../misc/enhancers/tooltip';
import Text from '../../../layout/Text';
import './table/tes.css';
import { createPortal } from 'react-dom';
const GlyphiconTooltip = tooltip(Glyphicon);
const Wizard = wizardHandlers(WizardContainer);

const enhancePreview = compose(
    legendWidget,
    emptyState(
        ({valid}) => !valid,
        {
            title: <Message msgId="widgets.builder.errors.noMapAvailableForLegend" />,
            description: <Message msgId="widgets.builder.errors.noMapAvailableForLegendDescription" />
        }
    ),
    emptyLegendState(false)
);
const LegendPreview = enhancePreview(LegendView);

export default ({
    onChange = () => {}, onFinish = () => {}, setPage = () => {},
    step = 0,
    dependencies,
    valid,
    data = {},
    currentLocale,
    language,
    updateProperty = () => {},
    widgets = []
} = {}) => {

    const [overStyle, setOverStyle] = useState();
    const widgetsViewNode = document.querySelector('.ms-widgets-view');
    const widgetsViewNodeStyle = widgetsViewNode?.getBoundingClientRect() || { };
    const _selectedStyle = document.querySelector(`#widget-text-${data.id}`)?.getBoundingClientRect() || { };
    const selectedStyle = { width: _selectedStyle.width, height: _selectedStyle.height, left: _selectedStyle.left - widgetsViewNodeStyle.left, top: _selectedStyle.top - widgetsViewNodeStyle.top}
    const handlePointerOver = (id) => {
        const { left, top, width, height } = document.querySelector(id)?.getBoundingClientRect() || { };
        setOverStyle({ left: left - widgetsViewNodeStyle.left, top: top - widgetsViewNodeStyle.top, width, height });
    };
    const _targetStyle = document.querySelector(`#widget-text-6df30870-53c8-11ea-bc50-9931c4e30b1f`)?.getBoundingClientRect() || { };
    const targetStyle = { width: _targetStyle.width, height: _targetStyle.height, left: _targetStyle.left - widgetsViewNodeStyle.left, top: _targetStyle.top - widgetsViewNodeStyle.top}
    return (
        <Wizard
            step={step}
            setPage={setPage}
            onFinish={onFinish}
            hideButtons>
            <Row>
                <StepHeader title={''} />
                <Col xs={12}>
                    <Tabs>
                        <Tab eventKey="preview" title={'Preview'}>
                            <div style={{ marginBottom: "30px" }}>
                                <LegendPreview
                                    valid={valid}
                                    dependencies={dependencies}
                                    dependenciesMap={data.dependenciesMap}
                                    key="widget-options"
                                    currentLocale={currentLocale}
                                    language={language}
                                    updateProperty={updateProperty}
                                    disableVisibility
                                    disableOpacitySlider
                                    legendExpanded
                                />
                            </div>
                        </Tab>
                        <Tab eventKey="interactions" title={'Interactions'}>
                            <FlexBox className="ms-interactions-container" component="ul" column gap="sm">
                                <FlexBox component="li" gap="xs" column>
                                    <FlexBox className="ms-interactions-event"gap="sm" centerChildrenVertically ><Button borderTransparent style={{ padding: 0, background: 'transparent' }}><Glyphicon glyph="bottom" /></Button><Glyphicon glyph="map-edit" /><Text fontSize="md">Map connection</Text></FlexBox>
                                    <FlexBox className="ms-interactions-targets" component="ul" column gap="sm">
                                        {widgets.filter(({ widgetType, id }) => !['legend', 'text'].includes(widgetType) && data.id !== id).map((widget) => {
                                            if (widget.widgetType === 'map') {
                                                if (widget.maps.length === 1) {
                                                    const map = widget.maps[0];
                                                    return (
                                                        <FlexBox className="ms-interaction-target connected" component="li" gap="xs" key={widget.id} column>
                                                            <FlexBox key={map.mapId} gap="xs" column>
                                                                <FlexBox gap="xs" centerChildrenVertically>
                                                                    <Glyphicon glyph={'1-map'}/>
                                                                    <FlexBox.Fill>{map.name || widget.title}</FlexBox.Fill>
                                                                    <Button borderTransparent>
                                                                        <Glyphicon glyph="plug" />
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
                        </Tab>
                    </Tabs>
                    {createPortal(
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }}>

                            <rect x={selectedStyle.left} y={selectedStyle.top} width={selectedStyle.width} height={selectedStyle.height} stroke="#6298fa" strokeWidth={4} fill="transparent" />
                            {targetStyle ?
                                <>
                                    <rect x={targetStyle.left} y={targetStyle.top} width={targetStyle.width} height={targetStyle.height} fill="transparent" stroke="#0075ff" strokeWidth={4} />
                                    <line
                                        x1={selectedStyle.left + selectedStyle.width / 2}
                                        y1={selectedStyle.top + selectedStyle.height / 2}
                                        x2={targetStyle.left + targetStyle.width / 2}
                                        y2={targetStyle.top + targetStyle.height / 2}
                                        strokeDasharray="8"
                                        stroke="#0075ff" strokeWidth={2} />
                                    <circle
                                        cx={targetStyle.left + targetStyle.width / 2}
                                        cy={targetStyle.top + targetStyle.height / 2}
                                        r={8}
                                        fill="#0075ff"
                                    />
                                </> : null}
                        </svg>
                        , widgetsViewNode)}
                </Col>
            </Row>
            <WidgetOptions
                key="widget-options"
                onChange={onChange}
            />
        </Wizard>
    );
}
