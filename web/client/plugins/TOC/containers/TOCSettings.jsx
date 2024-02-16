/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import { connect } from 'react-redux';
import { updateTOCConfig } from '../actions/toc';

const TOCSettings = connect(
    () => ({}),
    {
        onUpdateTOCConfig: updateTOCConfig
    }
)(({
    itemComponent,
    selectedNodes,
    rootGroupId,
    onUpdateTOCConfig,
    config,
    ...props
}) => {

    const ItemComponent = itemComponent;
    const selected = selectedNodes?.[0];
    if (selected?.type === rootGroupId) {
        return (
            <>
                <ItemComponent
                    {...props}
                    labelId={config.defaultOpen ? 'Keep close on map initialization' : 'Open on map initialization'}
                    glyph={config.defaultOpen ? 'arrow-left' : 'arrow-right'}
                    onClick={() => {
                        onUpdateTOCConfig({
                            defaultOpen: !config.defaultOpen
                        });
                    }}
                />
                <ItemComponent
                    {...props}
                    labelId={ config?.theme === 'legend' ? 'Default style' : 'Legend style'}
                    glyph="list"
                    onClick={() => {
                        onUpdateTOCConfig({
                            theme: !config?.theme ? 'legend' : undefined
                        });
                    }}
                />
                <ItemComponent
                    {...props}
                    labelId={ config?.showFullTitle ? 'Title on single line' : 'Show full title'}
                    glyph="font"
                    onClick={() => {
                        onUpdateTOCConfig({
                            showFullTitle: !config?.showFullTitle
                        });
                    }}
                />
                <ItemComponent
                    {...props}
                    labelId={config?.hideOpacitySlider ? 'Show opacity slider' : 'Hide opacity slider'}
                    glyph="adjust"
                    onClick={() => {
                        onUpdateTOCConfig({
                            hideOpacitySlider: !config?.hideOpacitySlider
                        });
                    }}
                />
                {!config?.hideOpacitySlider && <ItemComponent
                    {...props}
                    labelId={!config?.showOpacityTooltip ? 'Show opacity tooltip' : 'Hide opacity tooltip'}
                    glyph="tag"
                    onClick={() => {
                        onUpdateTOCConfig({
                            showOpacityTooltip: !config?.showOpacityTooltip
                        });
                    }}
                />}
            </>
        );
    }
    return null;
});

export default TOCSettings;

