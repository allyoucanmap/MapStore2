/*
* Copyright 2019, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createPlugin } from '../utils/PluginsUtils';
import { Glyphicon } from 'react-bootstrap';
import { setControlProperty, toggleControl } from '../actions/controls';
import { createSelector } from 'reselect';
import get from 'lodash/get';
import DockPanel from '../components/misc/panels/DockPanel';
import BorderLayout from '../components/layout/BorderLayout';
import SideGrid from '../components/misc/cardgrids/SideGrid';
import Toolbar from '../components/misc/toolbar/Toolbar';
import Filter from '../components/misc/Filter';
import emptyState from '../components/misc/enhancers/emptyState';
import ResizableModal from '../components/misc/ResizableModal';
import uuidv1 from 'uuid/v1';

const Body = emptyState(({filteredItems, filterText}) => filterText && filteredItems.length === 0, {
    glyph: 'filter',
    title: 'No results',
    description: 'Entered filter does not match name or description of any of templates'
})(({ favouriteItems, mapTemplates, onUpdate, filteredItems, showReplaceModal, setShowReplaceModal }) => {

    return (
        <>
        {favouriteItems.length > 0 &&
        <>
        <h4 style={{ padding: '0 15px' }}>Favourites</h4>
        <SideGrid
            size="sm"
            className="ms-side-list"
            items={[...favouriteItems.sort((a, b) => a.name > b.name ? 1 : -1)]
                .map(({ id, name, description, thumbnail, favourite }) => ({
                    preview: thumbnail && <img src={thumbnail}/> || <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#ddd', display: 'flex' }}><Glyphicon glyph="1-map" style={{ fontSize: 26, margin: 'auto', color: '#ffffff' }}/></div>,
                    title: name,
                    description,
                    onClick: () => {
                        setShowReplaceModal(true);
                    },
                    tools: (
                        <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md',
                                bsStyle: 'primary'
                            }}
                            buttons={[
                                {
                                    glyph: 'transfer',
                                    tooltip: 'Replace map with this template',
                                    onClick: (event) => {
                                        event.stopPropagation();
                                        setShowReplaceModal(true);
                                    }
                                },
                                {
                                    glyph: 'plus',
                                    tooltip: 'Add this template to map',
                                    onClick: (event) => {
                                        event.stopPropagation();
                                    }
                                },
                                {
                                    className: 'square-button-md no-border',
                                    glyph: favourite ? 'star' : 'star-empty',
                                    bsStyle: 'default',
                                    tooltip: favourite ? 'Remove from favourite' : 'Add to favourite',
                                    onClick: (event) => {
                                        event.stopPropagation();
                                        const newMapTemplates = mapTemplates
                                            .map((mapTemplate) => {
                                                if (mapTemplate.id === id) {
                                                    return {
                                                        ...mapTemplate,
                                                        favourite: !mapTemplate.favourite
                                                    };
                                                }
                                                return mapTemplate;
                                            });
                                        onUpdate(newMapTemplates);
                                    }
                                }
                            ]}/>
                    )
                }))
            }/>
        <hr/>
        <h4 style={{ padding: '0 15px' }}>All</h4>
        </>}
        <SideGrid
            className="ms-side-list"
            items={[...filteredItems.sort((a, b) => a.name > b.name ? 1 : -1)]
                .map(({ id, name, description, type, thumbnail, favourite }) => ({
                    preview: thumbnail && <img src={thumbnail}/> || <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#ddd', display: 'flex' }}><Glyphicon glyph="1-map" style={{ fontSize: 48, margin: 'auto', color: '#ffffff' }}/></div>,
                    title: name,
                    description,
                    caption: type,
                    onClick: () => {
                        setShowReplaceModal(true);
                    },
                    tools: (
                        <Toolbar
                            btnDefaultProps={{
                                className: 'square-button-md',
                                bsStyle: 'primary'
                            }}
                            buttons={[
                                {
                                    glyph: 'transfer',
                                    tooltip: 'Replace map with this template',
                                    onClick: (event) => {
                                        event.stopPropagation();
                                        setShowReplaceModal(true);
                                    }
                                },
                                {
                                    glyph: 'plus',
                                    tooltip: 'Add this template to map',
                                    onClick: (event) => {
                                        event.stopPropagation();
                                    }
                                },
                                {
                                    className: 'square-button-md no-border',
                                    glyph: favourite ? 'star' : 'star-empty',
                                    bsStyle: 'default',
                                    tooltip: favourite ? 'Remove from favourite' : 'Add to favourite',
                                    onClick: (event) => {
                                        event.stopPropagation();
                                        const newMapTemplates = mapTemplates
                                            .map((mapTemplate) => {
                                                if (mapTemplate.id === id) {
                                                    return {
                                                        ...mapTemplate,
                                                        favourite: !mapTemplate.favourite
                                                    };
                                                }
                                                return mapTemplate;
                                            });
                                        onUpdate(newMapTemplates);
                                    }
                                }
                            ]}/>
                    )
                }))
            }/>
            <ResizableModal
                show={showReplaceModal}
                fitContent
                title="Replace map content"
                onClose={() => {
                    setShowReplaceModal(false);
                }}
                buttons={[
                    {
                        text: 'Replace',
                        bsStyle: 'primary',
                        onClick: () => {
                            setShowReplaceModal(false);
                        }
                    }
                ]}>
                <p style={{ padding: '17px 17px 0 17px' }}>You will replace all layers and map configuration with the selected template by clicking on replace button</p>
            </ResizableModal>
        </>
    );
});

const defaultMapTemplates = [
    {
        thumbnail: '',
        name: 'Base Map',
        description: 'Simple base map',
        type: 'MapStore'
    },
    {
        thumbnail: '',
        name: 'Natural Earth',
        description: 'A collection of layers from Natural Earth',
        type: 'MapStore'
    },
    {
        thumbnail: '',
        name: 'Administrative Boundaries',
        description: 'Global boundaries',
        type: 'WMC'
    }
].map((mapTemplate) => ({ ...mapTemplate, id: uuidv1() }));

const MapTemplates = ({
    active,
    onClose = () => {}
}) => {
    const [ mapTemplates, onUpdate ] = useState(defaultMapTemplates);
    const [ filterText, onFilter ] = useState('');
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const favouriteItems = mapTemplates
        .filter(({ favourite }) => favourite)
        .filter(({ name, description }) => {
            return !filterText
            || filterText && (
                name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
                || description.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
            );
        });
    const filteredItems = mapTemplates
        .filter(({ name, description }) => {
            return !filterText
            || filterText && (
                name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
                || description.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
            );
        });
    return (
        <DockPanel
            open={active}
            size={660}
            position="right"
            bsStyle="primary"
            title={'Map Templates'}
            onClose={() => onClose()}
            glyph="1-map"
            style={{ height: 'calc(100% - 30px)' }}
            noResize>
            <BorderLayout
                header={
                    <div style={{ padding: '8px 15px' }}>
                        <Filter
                            filterPlaceholder="Filter map templates..."
                            filterText={filterText}
                            onFilter={onFilter}/>
                    </div>
                }>
                <Body
                    favouriteItems={favouriteItems}
                    mapTemplates={mapTemplates}
                    onUpdate={onUpdate}
                    filteredItems={filteredItems}
                    filterText={filterText}
                    showReplaceModal={showReplaceModal}
                    setShowReplaceModal={setShowReplaceModal}/>
            </BorderLayout>
        </DockPanel>
    );
};

const MapTemplatesPlugin = connect(
    createSelector([
        state => get(state, 'controls.map-templates.enabled')
    ], (active) => ({ active })),
    {
        onClose: toggleControl.bind(null, 'map-templates', 'enabled')
    }
)(MapTemplates);

export default createPlugin('MapTemplates', {
    component: MapTemplatesPlugin,
    containers: {
        BurgerMenu: {
            name: 'map-templates',
            position: 9998,
            text: 'MAP TEMPLATES',
            icon: <Glyphicon glyph="1-map"/>,
            action: setControlProperty.bind(null, "map-templates", "enabled", true, true),
            priority: 2,
            doNotHide: true
        }
    }
});

