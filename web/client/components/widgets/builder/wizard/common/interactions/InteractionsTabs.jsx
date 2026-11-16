/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { Nav, NavItem } from 'react-bootstrap';
import Message from '../../../../../I18N/Message';

const TABS = [
    { id: 'options', msgId: 'options' },
    { id: 'interactions', msgId: 'widgets.filterWidget.interactionsTabLabel' }
];

/**
 * Options and Interactions tabs of a sender widget builder, options by default
 * @prop {node} interactions content of the interactions tab
 * @prop {node} children content of the options tab
 */
const InteractionsTabs = ({ interactions, children }) => {
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
            {activeTab === 'interactions' ? interactions : children}
        </div>
    );
};

export default InteractionsTabs;
