/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {Col, Row} from 'react-bootstrap';
import {compose} from 'recompose';

import Message from '../../../I18N/Message';
import emptyState from '../../../misc/enhancers/emptyState';
import {wizardHandlers} from '../../../misc/wizard/enhancers';
import StepHeader from '../../../misc/wizard/StepHeader';
import WizardContainer from '../../../misc/wizard/WizardContainer';
import emptyLegendState from '../../enhancers/emptyLegendState';
import legendWidget from '../../enhancers/legendWidget';
import InteractionsTabs from './common/interactions/InteractionsTabs';
import LegendInteractionsTab from './legend/LegendInteractionsTab';
import LegendView from '../../widget/LegendView';
import WidgetOptions from './common/WidgetOptions';

const Wizard = wizardHandlers(WizardContainer);

const enhancePreview = compose(
    legendWidget,
    emptyState(
        ({noMapConnected}) => noMapConnected,
        {
            title: <Message msgId="widgets.errors.noLegendMap" />,
            description: <Message msgId="widgets.errors.noLegendMapDescription" />
        }
    ),
    emptyLegendState(false)
);
const LegendPreview = enhancePreview(LegendView);

export default ({
    onChange = () => {}, onFinish = () => {}, setPage = () => {},
    step = 0,
    legendMap,
    data = {},
    currentLocale,
    language,
    onApplyWidgetInteractions = () => {}
} = {}) => (
    <Wizard
        step={step}
        setPage={setPage}
        onFinish={onFinish}
        hideButtons>
        <InteractionsTabs key="legend-preview" interactions={<LegendInteractionsTab data={data} onEditorChange={onChange} />}>
            <Row>
                <StepHeader title={<Message msgId={`widgets.builder.wizard.preview`} />} />
                <Col xs={12}>
                    <div className="legend-preview-container">
                        <LegendPreview
                            id={data.id}
                            legendMap={legendMap}
                            onApplyWidgetInteractions={onApplyWidgetInteractions}
                            key="widget-options"
                            currentLocale={currentLocale}
                            language={language}
                            disableVisibility
                            disableOpacitySlider
                            legendExpanded
                        />
                    </div>
                </Col>
            </Row>
        </InteractionsTabs>
        <WidgetOptions key="widget-options" onChange={onChange} />
    </Wizard>
);
