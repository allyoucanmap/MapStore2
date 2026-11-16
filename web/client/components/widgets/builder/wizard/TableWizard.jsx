/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { lazy, useEffect, useState } from 'react';
import { Nav, NavItem } from 'react-bootstrap';

import { wizardHandlers } from '../../../misc/wizard/enhancers';
import WizardContainer from '../../../misc/wizard/WizardContainer';
import WidgetOptions from './common/WidgetOptions';
import TableInteractionsTab from './table/TableInteractionsTab';
import withSuspense from '../../../misc/withSuspense';
import Message from '../../../I18N/Message';

const TableOptions = withSuspense()(lazy(() => import('./table/TableOptions')));

const isChartOptionsValid = (options = {}) => options.aggregateFunction && options.aggregationAttribute && options.groupByAttributes;

const Wizard = wizardHandlers(WizardContainer);

const TABS = [
    { id: 'options', msgId: 'options' },
    { id: 'interactions', msgId: 'widgets.filterWidget.interactionsTabLabel' }
];

const TableOptionsTabs = ({ data, layer, onEditorChange, children }) => {
    const [activeTab, setActiveTab] = useState('options');
    return (
        <div className="ms-row-tab">
            <Nav bsStyle="tabs" activeKey={activeTab} justified>
                {TABS.map(tab => (
                    <NavItem key={tab.id} eventKey={tab.id} onClick={() => setActiveTab(tab.id)}>
                        <Message msgId={tab.msgId} />
                    </NavItem>
                ))}
            </Nav>
            {activeTab === 'interactions'
                ? <TableInteractionsTab data={data} layer={layer} onEditorChange={onEditorChange} />
                : children}
        </div>
    );
};

const TableWizard = ({ onChange = () => { }, onFinish = () => { }, setPage = () => { }, setValid = () => { }, valid, data = {}, layer = {}, step = 0, types, featureTypeProperties, dependencies }) => {
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
        <TableOptionsTabs
            key="chart-options"
            data={data}
            layer={data.layer || layer}
            onEditorChange={onChange}
        >
            <TableOptions
                dependencies={dependencies}
                featureTypeProperties={featureTypeProperties}
                types={types}
                data={data}
                onChange={onChange}
                layer={data.layer || layer}
            />
        </TableOptionsTabs>
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
