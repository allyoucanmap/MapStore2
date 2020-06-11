/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import {connect, createPlugin} from '../utils/PluginsUtils';
import {createSelector} from 'reselect';
import { Button as ButtonRB, Glyphicon as GlyphiconRB } from 'react-bootstrap';
import {layersSelector} from '../selectors/layers';
import Portal from '../components/misc/Portal';
import ResizableModal from '../components/misc/ResizableModal';
import SideCard from '../components/misc/cardgrids/SideCard';
import {getTitleAndTooltip} from '../utils/TOCUtils';
import {setControlProperty} from '../actions/controls';
import tooltip from '../components/misc/enhancers/tooltip';
import Toolbar from '../components/misc/toolbar/Toolbar';
import Loader from '../components/misc/Loader';

const Button = tooltip(ButtonRB);
const Glyphicon = tooltip(GlyphiconRB);

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

    const [mockLoading, setMockLoading] = useState(false);
    const [mockRequested, setMockRequested] = useState([]);

    useEffect(() => {
        if (mockLoading) {
            setTimeout(() => {
                setMockLoading(false);
            }, 1000);
        }
    }, [mockLoading]);

    return (
        <Portal>
            <ResizableModal
                show={enabled}
                size="sm"
                title="Update Layer Title and Description"
                onClose={mockLoading ? null : () => onClose()}
                buttons={[
                    {
                        text: 'Sync title and descriptions',
                        disabled: selected.length === 0 || mockLoading,
                        onClick: () => {
                            setMockLoading(true);
                            setMockRequested([...selected]);
                        }
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
                    {layers.map((layer, idx) => {
                        const { title } = getTitleAndTooltip({ node: layer });
                        const isSelected = selected.indexOf(layer.id) !== -1;
                        const isRequested = mockRequested.indexOf(layer.id) !== -1;
                        const isError = idx === 0;
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
                                tools={
                                    <>
                                    {isRequested && <Toolbar
                                        btnDefaultProps={{
                                            className: 'square-button-md no-border'
                                        }}
                                        buttons={[
                                            {
                                                Element: () => mockLoading
                                                    ? <Loader size={16}/>
                                                    : <Glyphicon
                                                        tooltip={
                                                            isError
                                                                ? "It's not possible to update the title and description of this layer. You could verify if all layer options are correct in the settings panel"
                                                                : 'Title and description are successfully updated for this layer'
                                                        }
                                                        glyph={
                                                            isError
                                                                ? 'exclamation-mark'
                                                                : 'ok-sign'
                                                        }/>
                                            }
                                        ]}
                                    />}
                                    </>
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
