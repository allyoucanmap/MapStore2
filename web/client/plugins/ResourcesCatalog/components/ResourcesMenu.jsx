/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import Message from '../../../components/I18N/Message';
import Menu from './Menu';

import Spinner from './Spinner';
import Icon from './Icon';
import Button from './Button';
import { Dropdown, MenuItem } from 'react-bootstrap';
import Box from './Box';
import Text from './Text';

const ResourcesListHeader = ({
    columns,
    metadata,
    setColumns
}) => {

    const container = useRef();
    const [selected, setSelected] = useState();

    const matchKeys = () => {
        const columnsKeys = columns.map(entry => entry.key).join(',');
        const metadataKeys = metadata.map(entry => entry.key).join(',');
        return columnsKeys === metadataKeys;
    };
    const init = useRef();
    init.current = () => {
        if (!columns?.length && !matchKeys()) {
            setColumns(metadata.map((entry, idx) => ({
                key: entry.key,
                width: entry.width,
                right: metadata.filter((en, jdx) => jdx < idx).reduce((sum, en) => sum + en.width, 0),
                left: metadata.filter((en, jdx) => jdx <= idx).reduce((sum, en) => sum + en.width, 0)
            })));
        }
    };

    useEffect(() => {
        init.current();
    }, []);

    return (
        <Box className="ms-resources-list-header" display="flex" position="relative" flexFill>
            <div className="ms-resource-card-limit"></div>
            <Box
                display="flex"
                position="relative"
                flexFill
                flexVerticalAlign
                ref={container}
                onPointerMove={(event) => {
                    event.preventDefault();
                    if (selected !== undefined && container.current) {
                        const containerNode = container.current;
                        const column = columns[selected];
                        const nextColumn = columns[selected + 1];
                        const rect = containerNode.getBoundingClientRect();
                        const newLeft = Math.round(((event.clientX - rect.x) / rect.width) * 100);
                        if (newLeft > column.right && newLeft < nextColumn.left) {
                            setColumns(prevColumns => prevColumns
                                .map((prevColumn, idx) =>
                                    idx === selected
                                        ? { ...prevColumn, width: newLeft - column.right }
                                        : (selected + 1) === idx
                                            ? { ...prevColumn, width: prevColumn.left - newLeft }
                                            : prevColumn)
                                .map((entry, idx, arr) => ({
                                    key: entry.key,
                                    width: entry.width,
                                    right: arr.filter((en, jdx) => jdx < idx).reduce((sum, en) => sum + en.width, 0),
                                    left: arr.filter((en, jdx) => jdx <= idx).reduce((sum, en) => sum + en.width, 0)
                                }))
                            );
                        }
                    }
                }}
                onPointerLeave={() => {
                    setSelected();
                }}
                onPointerUp={() => {
                    setSelected();
                }}
                onPointerDown={(event) => {
                    event.preventDefault();
                    const columnIndex = event.target.getAttribute('data-column-index');
                    if (columnIndex) {
                        setSelected(parseFloat(columnIndex));
                    }
                }}
            >
                {columns.filter((column, idx) => idx < columns.length - 1).map((column, idx) => {
                    return (<div key={column.key} data-column-index={idx} className={`ms-resources-list-header-divider${selected === idx ? ' selected' : ''}`} style={{ left: `${column.left}%` }}/>);
                })}
                {columns.map((entry) => {
                    const property = metadata.find(en => en.key === entry.key);
                    return (<Text fontSize="sm" plr="sm" textAlign="center" ellipsis key={entry.key} style={{ width: `${entry.width}%` }}>
                        {property?.labelId ? <Message msgId={property.labelId}/> : null}
                    </Text>);
                })}
            </Box>
            <div className="ms-resource-card-limit"></div>
        </Box>
    );
};

const ResourcesMenu = forwardRef(({
    menuItems,
    style,
    resourcesGridId,
    totalResources,
    loading,
    hideCardLayoutButton,
    cardLayoutStyle,
    setCardLayoutStyle,
    orderConfig,
    query,
    registry,
    titleId,
    theme,
    menuItemsLeft = [],
    columns,
    setColumns,
    metadata
}, ref) => {

    const {
        defaultLabelId,
        options: orderOptions = [],
        variant: orderVariant,
        align: orderAlign = 'right'
    } = orderConfig || {};

    const {
        formatHref
    } = registry;

    const selectedSort = orderOptions.find(({ value }) => query?.sort === value);
    function handleToggleCardLayoutStyle() {
        setCardLayoutStyle(cardLayoutStyle === 'grid' ? 'list' : 'grid');
    }

    const orderButtonNode = orderOptions.length > 0 &&
        <Dropdown pullRight={orderAlign === 'right'} id="sort-dropdown">
            <Dropdown.Toggle
                bsStyle={orderVariant || 'default'}
                bsSize="sm"
                noCaret
            >
                <Message msgId={selectedSort?.labelId || defaultLabelId} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {orderOptions.map(({ labelId, value }) => {
                    return (
                        <MenuItem
                            key={value}
                            active={value === selectedSort?.value}
                            href={formatHref({
                                query: {
                                    sort: [value]
                                },
                                replaceQuery: true
                            })}
                        >
                            <Message msgId={labelId} />
                        </MenuItem>
                    );
                })}
            </Dropdown.Menu>
        </Dropdown>;

    return (
        <div
            className="ms-resources-menu"
            style={style}
            ref={ref}
        >
            {titleId ? <div className="ms-resources-menu-title"><Message msgId={titleId}/></div> : null}
            <div className={`ms-menu ms-${theme ? theme : 'default'}`}>
                <div className="ms-menu-container">
                    <div className="ms-menu-content">
                        <div className="ms-menu-fill">
                            {menuItemsLeft.map(({ Component, name }) => {
                                return (<Component key={name} query={query} />);
                            })}
                            {orderAlign === 'left' ? orderButtonNode : null}
                            <span className="resources-count">
                                {loading
                                    ? <Spinner />
                                    : <Message msgId="resourcesCatalog.resourcesFound" msgParams={{ count: totalResources }}/>}
                            </span>
                        </div>
                        <Menu
                            items={menuItems}
                            containerClass={`ms-menu-list`}
                            size="md"
                            alignRight
                        />
                        {!hideCardLayoutButton && <Button
                            variant="default"
                            onClick={handleToggleCardLayoutStyle}
                            size="sm"
                        >
                            <Icon glyph={cardLayoutStyle === 'grid' ? 'list' : 'th'} />
                        </Button>}
                        {orderAlign === 'right' ? orderButtonNode : null}
                    </div>
                </div>
            </div>
            {cardLayoutStyle === 'list' ? <ResourcesListHeader columns={columns} setColumns={setColumns} metadata={metadata}/> : null}
        </div>
    );
});

ResourcesMenu.defaultProps = {
    orderOptions: [
        {
            label: 'Most recent',
            labelId: 'resourcesCatalog.mostRecent',
            value: '-date'
        },
        {
            label: 'Less recent',
            labelId: 'resourcesCatalog.lessRecent',
            value: 'date'
        },
        {
            label: 'A Z',
            labelId: 'resourcesCatalog.aZ',
            value: 'title'
        },
        {
            label: 'Z A',
            labelId: 'resourcesCatalog.zA',
            value: '-title'
        },
        {
            label: 'Most popular',
            labelId: 'resourcesCatalog.mostPopular',
            value: 'popular_count'
        }
    ],
    defaultLabelId: 'resourcesCatalog.orderBy',
    formatHref: () => '#'
};

export default ResourcesMenu;
