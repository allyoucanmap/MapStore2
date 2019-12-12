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
import Filter from '../components/misc/Filter';
import Toolbar from '../components/misc/toolbar/Toolbar';
import emptyState from '../components/misc/enhancers/emptyState';
import uuidv1 from 'uuid/v1';

const Body = emptyState(({filteredItems, filterText}) => filterText && filteredItems.length === 0, {
    glyph: 'filter',
    title: 'No results',
    description: 'Entered filter does not match name or description of any of extensions'
})(({ filteredItems, onSelect }) => {

    return (
        <SideGrid
            size="sm"
            items={filteredItems.map((extension) => ({
                preview: <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: extension.active ? 'transparent' : '#ddd', display: 'flex' }}>
                    <Glyphicon glyph={extension.glyph || 'plug'} style={{ fontSize: 26, margin: 'auto', color: '#ffffff' }}/>
                </div>,
                title: extension.name,
                description: extension.description,
                selected: extension.active,
                loading: extension.loading,
                onClick: () => onSelect(extension),
                tools: (
                    <Toolbar
                        btnDefaultProps={{
                            className: 'square-button-md no-border'
                        }}
                        buttons={[
                            {
                                glyph: extension.active ? 'plug' : 'unplug',
                                bsStyle: extension.active ? 'primary' : 'default',
                                tooltip: extension.active ? 'Remove extension' : 'Add extension',
                                onClick: (event) => {
                                    event.stopPropagation();
                                    onSelect(extension);
                                }
                            }
                        ]}/>
                )
            }))}/>
    );
});

const defaultExtensions = [
    {
        glyph: 'wrench',
        name: 'TOCItemSettings',
        description: 'Layer settings'
    },
    {
        glyph: 'features-grid',
        name: 'FeaturesGrid',
        description: 'Attribute Table'
    },
    {
        glyph: 'folder-open',
        name: 'Catalog',
        description: 'Catalog'
    },
    {
        glyph: '1-ruler',
        name: 'Measure',
        description: 'Measure'
    },
    {
        glyph: 'plus',
        name: 'ZoomIn',
        description: 'Zoom In'
    },
    {
        glyph: 'minus',
        name: 'ZoomOut',
        description: 'Zoom Out'
    }
].map((mapTemplate) => ({ ...mapTemplate, id: uuidv1() }));

const Extensions = ({
    active,
    onClose = () => {}
}) => {
    const [ extensions, onUpdate ] = useState(defaultExtensions);
    const [ filterText, onFilter ] = useState('');
    const filteredItems = extensions
        .filter(({ name, description }) => {
            return !filterText
            || filterText && (
                name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
                || description.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
            );
        });
    const onSelect = (extension) => {
        const newExtensions = extensions
            .map((ext) => {
                if (ext.id === extension.id) {
                    return {
                        ...ext,
                        active: !extension.active
                    };
                }
                return ext;
            });
        onUpdate(newExtensions);
    };
    return (
        <DockPanel
            open={active}
            size={660}
            position="right"
            bsStyle="primary"
            title={'Extensions'}
            onClose={() => onClose()}
            glyph="plug"
            style={{ height: 'calc(100% - 30px)' }}
            noResize>
            <BorderLayout
                header={
                    <div style={{ padding: '8px 15px' }}>
                        <Filter
                            filterPlaceholder="Filter extensions..."
                            filterText={filterText}
                            onFilter={onFilter}/>
                    </div>
                }>
                <Body
                    filterText={filterText}
                    filteredItems={filteredItems}
                    onSelect={onSelect}/>
            </BorderLayout>
        </DockPanel>
    );
};
const ExtensionsPlugin = connect(
    createSelector([
        state => get(state, 'controls.extensions.enabled')
    ],
    (active) => ({ active })),
    {
        onClose: toggleControl.bind(null, 'extensions', 'enabled')
    }
)(Extensions);

export default createPlugin('Extensions', {
    component: ExtensionsPlugin,
    containers: {
        BurgerMenu: {
            name: 'extensions',
            position: 9999,
            text: 'EXTENSIONS',
            icon: <Glyphicon glyph="plug"/>,
            action: setControlProperty.bind(null, "extensions", "enabled", true, true),
            priority: 2,
            doNotHide: true
        }
    }
});

