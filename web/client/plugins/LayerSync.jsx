/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import {connect, createPlugin} from '../utils/PluginsUtils';
import {createSelector} from 'reselect';
import { Button as ButtonRB, Glyphicon } from 'react-bootstrap';
import {layersSelector} from '../selectors/layers';
import Portal from '../components/misc/Portal';
import ResizableModal from '../components/misc/ResizableModal';
import SideCard from '../components/misc/cardgrids/SideCard';
import {getTitleAndTooltip} from '../utils/TOCUtils';
import {setControlProperty} from '../actions/controls';
import tooltip from '../components/misc/enhancers/tooltip';
const Button = tooltip(ButtonRB);

function LayerSync({
    layers,
    enabled,
    onClose
}) {
    const [selected, setSelected] = useState([]);
    function handleSelectLayer(layerId) {
        const isSelected = selected.find((id) => layerId === id);
        const newSelected = isSelected
            ? selected.filter((id) => id !== layerId)
            : [...selected, layerId];
        setSelected(newSelected);
    }

    return (
        <Portal>
            <ResizableModal
                show={enabled}
                size="sm"
                title="Update Layer Title and Description"
                onClose={() => onClose()}
                buttons={[
                    {
                        text: 'Sync title and descriptions',
                        disabled: selected.length === 0
                    }
                ]}
            >
                <div style={{ padding: 8 }}>
                    <div>
                        <Button
                            className="no-border"
                            onClick={() => {
                                if (selected.length === layers.length) {
                                    return setSelected([]);
                                }
                                return setSelected(layers.map(({id}) => id));
                            }}>
                            <Glyphicon glyph={selected.length === layers.length ? 'check' : 'unchecked'}/>
                            &nbsp;
                            {selected.length === layers.length ? 'Deselect all' : 'Select all'}
                        </Button>
                    </div>
                    {layers.map((layer) => {
                        const { title } = getTitleAndTooltip({ node: layer });
                        const isSelected = selected.indexOf(layer.id) !== -1;
                        return (
                            <SideCard
                                key={layer.id}
                                selected={isSelected}
                                title={title}
                                description={'type: ' + layer.type}
                                size="sm"
                                onClick={() => {
                                    handleSelectLayer(layer.id);
                                }}
                                preview={
                                    <Glyphicon glyph={isSelected ? 'check' : 'unchecked'} style={{ fontSize: 16 }}/>
                                }
                            />
                        );
                    })}
                </div>
            </ResizableModal>
        </Portal>
    );
}

const TOCButton = connect(() => ({}), {
    onClick: setControlProperty.bind(null, 'mockLayerSynch', 'enabled', true)
})(({ status, onClick }) => {
    if (status !== 'DESELECT') {
        return null;
    }
    return (
        <Button
            className="square-button-md no-border"
            bsStyle="primary"
            onClick={() => onClick()}
            tooltip="Update layer title and description">
            <Glyphicon glyph="layer-info"/>
        </Button>
    );
});

export default createPlugin('LayerSync', {
    component: connect(
        createSelector([
            layersSelector,
            state => state?.controls?.mockLayerSynch?.enabled
        ], (layers, enabled) => ({
            layers: layers.filter(({ type, group }) => group !== 'background' && (type === 'wms' || type === 'wmts')),
            enabled
        })),
        {
            onClose: setControlProperty.bind(null, 'mockLayerSynch', 'enabled', false)
        }
    )(LayerSync),
    containers: {
        TOC: {
            button: {
                Element: TOCButton
            },
            doNotHide: true
        }
    }
});
