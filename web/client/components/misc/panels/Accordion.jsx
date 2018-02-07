/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {Panel, Accordion} = require('react-bootstrap');
const SideCard = require('../cardgrids/SideCard');

module.exports = ({
    activePanel,
    fillContainer,
    className,
    onSelect,
    panels = []
}) => {
    const fillContainerClassName = fillContainer ? 'ms-fill-container ' : '';
    return (
        <Accordion
            activeKey={activePanel}
            className={'ms-accordion ' + fillContainerClassName + className}>
            {panels.map((panel, i) =>
                (<Panel
                    key={i}
                    eventKey={panel.id}
                    className={activePanel === panel.id ? 'ms-selected' : ''}
                    header={panel.head && <a role="tab"><SideCard {...panel.head} selected={activePanel === panel.id}/></a> || null}
                    collapsible
                    onClick={() => {
                        onSelect(panel.id);
                    }}>
                    {panel.body}
                </Panel>))
            }
        </Accordion>
    );
};
