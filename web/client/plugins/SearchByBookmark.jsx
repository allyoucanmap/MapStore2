/*
* Copyright 2019, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React, { useState } from 'react';
import { Glyphicon, MenuItem, Form, FormControl, FormGroup, ControlLabel } from 'react-bootstrap';
import { createPlugin } from '../utils/PluginsUtils';
import Toolbar from '../components/misc/toolbar/Toolbar';
import Select from 'react-select';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { changeActiveSearchTool } from "../actions/search";
import Portal from "../components/misc/Portal";
import ResizableModal from "../components/misc/ResizableModal";
import SideCard from "../components/misc/cardgrids/SideCard";
import Filter from "../components/misc/Filter";
import uuidv1 from 'uuid/v1';

function SearchByBookmarkPlugin({
    active
}) {

    // mock state
    const [showSettings, setShowSettings] = useState();
    const [status, setStatus] = useState({});
    const [selected, setSelected] = useState();
    const [options, setOptions] = useState([
        {
            label: 'Bookmark 1',
            value: '01',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 2',
            value: '02',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 3',
            value: '03',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 4',
            value: '04',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 5',
            value: '05',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 6',
            value: '06',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 7',
            value: '07',
            bbox: [-180, -90, 180, 90]
        },
        {
            label: 'Bookmark 8',
            value: '08',
            bbox: [-180, -90, 180, 90]
        }
    ]);

    return active
        ? (
            <>
            <div style={{ display: 'flex', position: 'relative' }}>
                <div
                    style={{ flex: 1, padding: '0 4px' }}>
                    <Select
                        value={selected}
                        placeholder="Select a bookmark..."
                        noResultsText="Not found bookmarks"
                        options={options}
                        onChange={setSelected}
                    />
                </div>
                <Toolbar
                    btnDefaultProps={{
                        className: 'square-button-md no-border',
                        tooltipPosition: 'bottom'
                    }}
                    buttons={[
                        {
                            glyph: 'cog',
                            tooltip: 'Bookmark settings',
                            onClick: () => setShowSettings(true)
                        },
                        {
                            glyph: 'search',
                            tooltipId: 'Zoom to selected bookmark',
                            disabled: !selected
                        }
                    ]}
                />
            </div>
            <Portal>
                <ResizableModal
                    title={status?.title || 'Views bookmarks'}
                    size="sm"
                    show={showSettings}
                    clickOutEnabled={false}
                    onClose={status?.type === undefined ? () => setShowSettings(false) : null}
                    buttons={[{
                        text: 'Back',
                        visible: status?.type === 'add',
                        onClick: () => {
                            setStatus({});
                        }
                    }, {
                        text: 'Add',
                        bsStyle: 'primary',
                        visible: status?.type === undefined,
                        onClick: () => setStatus({
                            type: 'add',
                            title: 'Add new bookmark',
                            option: {}
                        })
                    }, {
                        text: 'Save',
                        bsStyle: 'primary',
                        visible: status?.type === 'add',
                        disabled: !!(!status?.option?.title
                            || status?.option?.north === undefined
                            || status?.option?.south === undefined
                            || status?.option?.east === undefined
                            || status?.option?.west === undefined),
                        onClick: () => {
                            const option = status?.option || {};
                            setOptions([
                                ...options,
                                {
                                    value: uuidv1(),
                                    label: option.title,
                                    bbox: [
                                        option.west,
                                        option.south,
                                        option.east,
                                        option.north
                                    ]
                                }
                            ]);
                            setStatus({});
                        }
                    }]}>
                    {status?.type === undefined &&
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative'}}>
                        <div style={{ padding: 8 }}><Filter filterPlaceholder="Filter bookmarks"/></div>
                        <div style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    padding: 8,
                                    width: '100%'
                                }}
                            >
                                {options.map(({ value, label }) =>
                                    <SideCard
                                        preview={<Glyphicon glyph="bookmark"/>}
                                        key={value}
                                        size="sm"
                                        title={label}
                                        tools={
                                            <Toolbar
                                                btnDefaultProps={{
                                                    className: 'square-button-md no-border'
                                                }}
                                                buttons={[
                                                    {
                                                        glyph: 'trash',
                                                        tooltip: 'Remove bookmark',
                                                        onClick: () => {
                                                            /* const newOptions = options.filter((option, optionIdx) => optionIdx !== idx); // maybe better uuid
                                                            setOptions(newOptions);*/
                                                        }
                                                    },
                                                    {
                                                        glyph: 'pencil',
                                                        tooltip: 'Edit bookmark'
                                                    }
                                                ]}
                                            />
                                        }
                                    />)}
                            </div>
                        </div>
                    </div>
                   }

                    {status?.type === 'add' &&
                            <Form style={{ padding: 8, position: 'absolute', width: '100%' }}>
                                <FormGroup
                                    key="title">
                                    <ControlLabel>
                                        Title
                                    </ControlLabel>
                                    <FormControl
                                        type="text"
                                        placeholder="Enter title"
                                        value={status?.option?.title}
                                        onChange={(event) => {
                                            setStatus({
                                                ...status,
                                                option: {
                                                    ...status?.option,
                                                    title: event.target.value
                                                }
                                            });
                                        }} />
                                </FormGroup>

                                <FormGroup
                                    key="bbox">
                                    <div style={{ display: 'flex' }}>
                                        <ControlLabel style={{ flex: 1, alignItems: 'center' }}>
                                            Bounding Box
                                        </ControlLabel>
                                        <Toolbar
                                            btnDefaultProps={{
                                                className: 'square-button-md no-border'
                                            }}
                                            buttons={[
                                                {
                                                    glyph: 'fit-cover',
                                                    tooltip: 'Use current view as bounding box'
                                                }
                                            ]}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <div style={{ width: '100%', padding: 4, maxWidth: 200 }}>
                                            <div>north</div>
                                            <FormControl
                                                type="number"
                                                placeholder="Enter north"
                                                value={status?.option?.north}
                                                onChange={(event) => {
                                                    setStatus({
                                                        ...status,
                                                        option: {
                                                            ...status?.option,
                                                            north: event.target.value
                                                        }
                                                    });
                                                }} />
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            width: '100%', flexWrap: 'wrap'
                                        }}>
                                            <div style={{ flex: 1, padding: 4, maxWidth: 200, minWidth: 200 }}>
                                                <div>west</div>
                                                <FormControl
                                                    type="number"
                                                    placeholder="Enter west"
                                                    value={status?.option?.west}
                                                    onChange={(event) => {
                                                        setStatus({
                                                            ...status,
                                                            option: {
                                                                ...status?.option,
                                                                west: event.target.value
                                                            }
                                                        });
                                                    }} />
                                            </div>
                                            <div style={{ flex: 1, padding: 4, maxWidth: 200, minWidth: 200 }}>
                                                <div>east</div>
                                                <FormControl
                                                    type="number"
                                                    placeholder="Enter east"
                                                    value={status?.option?.east}
                                                    onChange={(event) => {
                                                        setStatus({
                                                            ...status,
                                                            option: {
                                                                ...status?.option,
                                                                east: event.target.value
                                                            }
                                                        });
                                                    }} />
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', padding: 4, maxWidth: 200 }}>
                                            <div>south</div>
                                            <FormControl
                                                type="number"
                                                placeholder="Enter south"
                                                value={status?.option?.south}
                                                onChange={(event) => {
                                                    setStatus({
                                                        ...status,
                                                        option: {
                                                            ...status?.option,
                                                            south: event.target.value
                                                        }
                                                    });
                                                }} />
                                        </div>
                                    </div>
                                </FormGroup>
                            </Form>}
                </ResizableModal>
            </Portal>
            </>
        )
        : null;
}

const selector = createSelector([
    state => state?.search?.activeSearchTool || null
], (activeSearchTool) => ({
    active: activeSearchTool === 'searchByBookmark'
}));

const SearchMenuItem = ({ active, eventKey, onClick, setOpen }) => (
    <MenuItem
        key={eventKey}
        active={active}
        eventKey={eventKey}
        onSelect={() => {
            onClick('searchByBookmark');
            setOpen(false);
        }} >
        <Glyphicon glyph="bookmark"/>
        Search by Bookmark
    </MenuItem>
);

export default createPlugin('SearchByBookmark', {
    component: connect(selector)(SearchByBookmarkPlugin),
    containers: {
        Search: {
            priority: 1,
            menuItem: connect(selector, {
                onClick: changeActiveSearchTool
            })(SearchMenuItem)
        }
    }
});
