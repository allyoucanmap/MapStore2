/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { lazy, useEffect } from 'react';

import { wizardHandlers } from '../../../misc/wizard/enhancers';
import WizardContainer from '../../../misc/wizard/WizardContainer';
import WidgetOptions from './common/WidgetOptions';
import TableInteractionsTab from './table/TableInteractionsTab';
import InteractionsTabs from './common/interactions/InteractionsTabs';
import withSuspense from '../../../misc/withSuspense';

const TableOptions = withSuspense()(lazy(() => import('./table/TableOptions')));

const isChartOptionsValid = (options = {}) => options.aggregateFunction && options.aggregationAttribute && options.groupByAttributes;

const Wizard = wizardHandlers(WizardContainer);

const TableWizard = ({ onChange = () => { }, onFinish = () => { }, setPage = () => { }, setValid = () => { }, valid, data = {}, layer = {}, step = 0, types, featureTypeProperties }) => {
    useEffect(() => {
        if (valid && !isChartOptionsValid(data.options)) {
            setValid(false);
        }
    }, [valid, data.options]);
    return (<Wizard
        step={step}
        setPage={setPage}
        onFinish={onFinish}
        isStepValid={n => n === 1 ? isChartOptionsValid(data.options) : true} hideButtons>
        <InteractionsTabs
            key="chart-options"
            interactions={<TableInteractionsTab data={data} layer={data.layer || layer} onEditorChange={onChange} />}
        >
            <TableOptions
                featureTypeProperties={featureTypeProperties}
                types={types}
                data={data}
                onChange={onChange}
                layer={data.layer || layer}
            />
        </InteractionsTabs>
        <WidgetOptions
            key="widget-options"
            data={data}
            onChange={onChange}
            layer={data.layer || layer}
        />
    </Wizard>);
};

// memo stops recompose (mapPropsStream in TableBuilder) from calling it as a plain function, which breaks hooks
export default React.memo(TableWizard);
