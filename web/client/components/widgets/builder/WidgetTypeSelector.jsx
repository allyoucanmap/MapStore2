/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import Message from '../../I18N/Message';
import FlexBox from '../../layout/FlexBox';
import Text from '../../layout/Text';
import { Glyphicon } from 'react-bootstrap';

const DEFAULT_TYPES = [{
    title: <Message msgId={"widgets.types.chart.title"} />,
    type: "chart",
    caption: <Message msgId={"widgets.types.chart.caption"} />,
    glyph: "chart",
    className: "ms-widget-selector-chart"
}, {
    title: <Message msgId={"widgets.types.text.title"} />,
    type: "text",
    glyph: "sheet",
    caption: <Message msgId={"widgets.types.text.caption"} />,
    className: "ms-widget-selector-text"
}, {
    title: <Message msgId={"widgets.types.table.title"} />,
    type: "table",
    glyph: "features-grid",
    caption: <Message msgId={"widgets.types.table.caption"} />,
    className: "ms-widget-selector-table"
}, {
    title: <Message msgId={"widgets.types.counter.title"} />,
    type: "counter",
    glyph: "counter",
    caption: <Message msgId={"widgets.types.counter.caption"} />,
    className: "ms-widget-selector-counter"
}, {
    title: <Message msgId={"widgets.types.map.title"} />,
    type: "map",
    glyph: "1-map",
    caption: <Message msgId={"widgets.types.map.caption"} />,
    className: "ms-widget-selector-map"
}, {
    title: <Message msgId={"widgets.types.legend.title"} />,
    type: "legend",
    glyph: "list",
    caption: <Message msgId={"widgets.types.legend.caption"} />,
    className: "ms-widget-selector-legend"
}, {
    title: <Message msgId={'widgets.types.filter.title'} />,
    type: "filter",
    glyph: "filter",
    caption: <Message msgId={'widgets.types.filter.caption'} />,
    className: "ms-widget-selector-filter"
}, {
    title: <Message msgId={'widgets.types.mainMap.title'} />,
    type: "mainMap",
    section: "map",
    glyph: "1-map",
    caption: <Message msgId={'widgets.types.mainMap.caption'} />,
    className: "ms-widget-selector-main-map"
}];

const renderItems = (items, onSelect) => items.map((item, idx) => (
    <FlexBox key={idx} component="li" gap="lg" classNames={['_interactive', '_padding-sm']} onClick={() => onSelect(item.type)}>
        <Text fontSize="xl">
            <Glyphicon glyph={item.glyph}/>
        </Text>
        <FlexBox.Fill flexBox column gap="sm">
            <Text fontSize="md">
                {item.title}
            </Text>
            <Text fontSize="sm" style={{ fontStyle: 'italic' }}>
                {item.caption}
            </Text>
        </FlexBox.Fill>
    </FlexBox>
));

const renderSection = (titleMsgId, items, onSelect, className) => (
    <FlexBox column gap="sm" className={`ms-widget-selector-section ${className}`}>
        <Text fontSize="sm" className="ms-widget-selector-section-title">
            <Message msgId={titleMsgId} />
        </Text>
        <FlexBox component="ul" column gap="sm">
            {renderItems(items, onSelect)}
        </FlexBox>
    </FlexBox>
);

const WidgetTypeSelector = ({widgetTypes = DEFAULT_TYPES, typeFilter = () => true, onSelect = () => {}}) => {
    const widgetMenuItems = widgetTypes ? widgetTypes.filter(typeFilter) : [];
    const mapItems = widgetMenuItems.filter(item => item.section === 'map');
    // the main map is not a widget type, it gets its own section where it is available
    if (mapItems.length === 0) {
        return (
            <FlexBox component="ul" column gap="sm" classNames={['_padding-md']}>
                {renderItems(widgetMenuItems, onSelect)}
            </FlexBox>
        );
    }
    return (
        <FlexBox column gap="md" classNames={['_padding-md']}>
            {renderSection('widgets.typeSections.map', mapItems, onSelect, 'ms-widget-selector-map-section')}
            {renderSection('widgets.typeSections.widgets', widgetMenuItems.filter(item => item.section !== 'map'), onSelect, 'ms-widget-selector-widgets-section')}
        </FlexBox>
    );
};

export default WidgetTypeSelector;
