/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const { Glyphicon } = require('react-bootstrap');

const BorderLayout = require('../layout/BorderLayout');
const emptyState = require('../misc/enhancers/emptyState');
const SideGrid = emptyState(({items}) => items.length === 0)(require('../misc/cardgrids/SideGrid'));
const Filter = require('../misc/Filter');
const SVGPreview = require('./SVGPreview');

const StyleList = ({
    enabledStyle,
    defaultStyle,
    availableStyles = [],
    onSelect,
    formatColors = {
        sld: '#33ffaa',
        css: '#ffaa33'
    },
    filterText,
    onFilter = () => {}
}) => (
        <BorderLayout
            header={
                <Filter
                    filterPlaceholder="Filter styles by name, title or abstract..."
                    filterText={filterText}
                    onFilter={onFilter}/>
            }>
            <SideGrid
                size="sm"
                onItemClick={({ name }) => onSelect({ style: defaultStyle === name ? '' : name })}
                items={availableStyles
                    .filter(({name = '', title = '', _abstract = ''}) => !filterText
                    || filterText && (
                        name.indexOf(filterText) !== -1
                        || title.indexOf(filterText) !== -1
                        || _abstract.indexOf(filterText) !== -1
                    ))
                    .map(style => ({
                        ...style,
                        title: style.label || style.title || style.name,
                        description: style._abstract,
                        selected: enabledStyle === style.name,
                        preview: style.format &&
                            <SVGPreview
                                backgroundColor="#333333"
                                paths={[
                                    {
                                        text: style.format.toUpperCase(),
                                        fill: formatColors[style.format] || '#f2f2f2',
                                        style: {
                                            fontSize: 70,
                                            fontWeight: 'bold'
                                        }
                                    }]}/> || <Glyphicon glyph="geoserver" />,
                        tools: defaultStyle === style.name && <Glyphicon glyph="star" /> || <Glyphicon glyph="ok" />
                    }))} />
        </BorderLayout>
    );

module.exports = StyleList;
