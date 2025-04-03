/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { connect } from "react-redux";
import { createPlugin } from "../../utils/PluginsUtils";
import FlexBox from '../../components/layout/FlexBox';
import { createStructuredSelector } from 'reselect';
import { allBackgroundLayerSelector } from '../../selectors/layers';
import Text from '../../components/layout/Text';
import { ControlLabel, FormControl, FormGroup, Glyphicon } from 'react-bootstrap';
import thumbs from '../background/DefaultThumbs';
import Button from '../../components/layout/Button';
import { mapLayoutValuesSelector } from '../../selectors/maplayout';
import Modal from '../../components/misc/Modal';
import Select from 'react-select';

function BackgroundLayersList({
    title,
    layers,
    showThumbnail,
    tools,
    onEdit,
    onRemove
}) {
    return (
        <div>
            <FlexBox classNames={['_padding-lr-sm', '_padding-tb-xs']} centerChildrenVertically>
                <FlexBox.Fill fontSize="sm" component={Text}>{title}</FlexBox.Fill>
                {tools}
            </FlexBox>
            {layers.map((background, idx) => {
                return (
                    <FlexBox
                        component="li"
                        key={idx}
                        gap="sm"
                        classNames={['_padding-lr-sm', '_padding-tb-xs', ...(background.visibility ? ['active'] : [])]}
                        centerChildrenVertically
                    >
                        {showThumbnail
                            ? <img src={background.thumbURL}/>
                            : (
                                <button className={"ms-visibility-check"}>
                                    <Glyphicon glyph={background.visibility ? 'radio-on' : 'radio-off'} />
                                </button>
                            )}
                        <FlexBox.Fill component={Text}>
                            {background?.title}
                        </FlexBox.Fill>
                        <FlexBox gap="sm">
                            {background?.editable ? <button onClick={() => onEdit(background)}>
                                <Glyphicon glyph="wrench"/>
                            </button> : null}
                            <button onClick={() => onRemove(background)}>
                                <Glyphicon glyph="trash" />
                            </button>
                        </FlexBox>
                    </FlexBox>
                );
            })}
        </div>
    );
}

function MetadataExplorerAdd() {
    return (
        <button>
            <Glyphicon glyph="plus" />
        </button>
    );
}

function TerrainEditor({
    terrain
}) {

    const providers = [
        { value: 'cesium', label: 'Cesium' },
        { value: 'cesium-ion', label: 'Cesium Ion' },
        { value: 'wms', label: 'WMS' }
    ];

    const [provider, setProvider] = useState(providers[0]);

    return (
        <Modal
            show={!!terrain}
            onHide={() => {}}
        >
            <FlexBox classNames={['_padding-lr-lg', '_padding-tb-md']} column gap="md">
                <FlexBox centerChildrenVertically>
                    <FlexBox.Fill component={Text} fontSize="md" >Add new terrain</FlexBox.Fill>
                    <Button className="square-button-md" borderTransparent gap="sm">
                        <Glyphicon glyph="1-close" />
                    </Button>
                </FlexBox>
                <FlexBox centerChildrenVertically gap="sm">
                    <Text strong>Provider</Text>
                    <div style={{ width: 150 }}>
                        <Select
                            clearable={false}
                            value={provider}
                            onChange={(value) => setProvider(value)}
                            options={[
                                { value: 'cesium', label: 'Cesium' },
                                { value: 'cesium-ion', label: 'Cesium Ion' },
                                { value: 'wms', label: 'WMS' }
                            ]}
                        />
                    </div>
                </FlexBox>
                <FormGroup>
                    <ControlLabel>Title</ControlLabel>
                    <FormControl />
                </FormGroup>
                {provider?.value === 'cesium' ? <>
                    <FormGroup>
                        <ControlLabel>Url</ControlLabel>
                        <FormControl />
                    </FormGroup>
                </> : null}
                {provider?.value === 'cesium-ion' ? <>
                    <FormGroup>
                        <ControlLabel>Asset id</ControlLabel>
                        <FormControl />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Access token</ControlLabel>
                        <FormControl />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Server</ControlLabel>
                        <FormControl />
                    </FormGroup>
                </> : null}
                {provider?.value === 'wms' ? <>
                    <FormGroup>
                        <ControlLabel>Url</ControlLabel>
                        <FormControl />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Layer name</ControlLabel>
                        <FormControl />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Projection</ControlLabel>
                        <Select value={{value: "CRS84", label: 'CRS84'}} clearable={false}/>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>WMS version</ControlLabel>
                        <Select value={{value: "1.3.0", label: '1.3.0'}} clearable={false}/>
                    </FormGroup>
                </> : null}
                <FlexBox centerChildrenVertically gap="sm">
                    <FlexBox.Fill/>
                    <Button variant={'success'}>
                        Add
                    </Button>
                </FlexBox>
            </FlexBox>
        </Modal>
    );
}

function BackgroundSelector({
    backgrounds: backgroundsProp,
    style
}) {

    const [open, setOpen] = useState(false);
    const [showTerrainModal, setShowTerrainModal] = useState(null);

    // if the add logic depends on MetadataExplorer
    // we need to inject this component via items similar as we do for TOC (but in this case for background layer logic)
    const configuredItemsBackgroundTools = [{ name: 'MetadataExplorer', Component: MetadataExplorerAdd }];

    if (!backgroundsProp.length) {
        return null;
    }

    const backgrounds = backgroundsProp.filter(({ type }) => type !== 'terrain').map((background) => {
        const thumbURL = background.thumbURL || thumbs?.[background.source]?.[background.name] || thumbs.unknown;
        return {
            ...background,
            editable: background.type !== 'empty',
            thumbURL
        };
    });

    let terrains = backgroundsProp.filter(({ type }) => type === 'terrain');
    // only for mockup
    if (!terrains.length) {
        terrains = [{
            type: 'terrain',
            visibility: true,
            title: 'Ellipsoid',
            provider: 'ellipsoid',
            editable: false
        }, {
            type: 'terrain',
            visibility: false,
            title: 'Custom terrain',
            provider: 'ellipsoid',
            editable: true
        }];
    }

    const selectedBackground = backgrounds.find(background => background.visibility === true);
    const previewImage = selectedBackground?.thumbURL;

    return (
        <FlexBox column gap="xs" classNames={['ms-background-selector', '_absolute', '_corner-bl']} style={style}>
            {open ? <FlexBox component="ul" gap="md" column classNames={['ms-background-selector-list', 'ms-main-colors', '_padding-tb-sm', 'shadow']}>
                <BackgroundLayersList
                    title={"Backgrounds"}
                    layers={backgrounds}
                    showThumbnail
                    onEdit={() => {}}
                    onRemove={() => {}}
                    tools={<>
                        {configuredItemsBackgroundTools.map(({ name, Component }) => <Component key={name}/>)}
                    </>}
                />
                {terrains.length ? <BackgroundLayersList
                    title={"Terrains"}
                    layers={terrains}
                    tools={
                        <>
                            <button onClick={() => setShowTerrainModal(true)}>
                                <Glyphicon glyph="plus" />
                            </button>
                        </>
                    }
                /> : null}
            </FlexBox> : null}
            <FlexBox
                component={Button}
                onClick={() => setOpen(!open)}
                centerChildren
                classNames={['ms-background-selector-preview', 'ms-main-colors', 'shadow', 'square-button']}
            >
                <img src={previewImage} style={{ width: '100%', height: '100%' }}/>
            </FlexBox>
            <TerrainEditor
                terrain={showTerrainModal}
            />
        </FlexBox>
    );
}

const ConnectedBackgroundSelector = connect(
    createStructuredSelector({
        backgrounds: allBackgroundLayerSelector,
        style: state => mapLayoutValuesSelector(state, {left: true, bottom: true})
    })
)(BackgroundSelector);

export default createPlugin('BackgroundSelector', {
    component: ConnectedBackgroundSelector
});
