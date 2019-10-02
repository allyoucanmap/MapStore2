/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
    currentStorySelector,
    cardPreviewEnabledSelector,
    modeSelector,
    currentPageSelector
} from '../selectors/geostory';
import geostory from '../reducers/geostory';
import { setEditing, toggleCardPreview, move } from '../actions/geostory';

import Builder from '../components/geostory/builder/Builder';
import { Modes } from '../utils/GeoStoryUtils';
import { createPlugin } from '../utils/PluginsUtils';
import { scrollToContent } from '../utils/GeoStoryUtils';


const GeoStoryEditor = ({
    mode = Modes.VIEW,
    setEditingMode = () => {},
    onToggleCardPreview = () => {},
    cardPreviewEnabled,
    story = {},
    currentPage,
    onSort = () => {}
}) => (mode === Modes.EDIT ? <div
    key="left-column"
    className="ms-geostory-editor"
    style={{ order: -1, width: 400, position: 'relative' }}>
    <Builder
        scrollTo={(id, options = { behavior: "smooth" }) => {
            scrollToContent(id, options);
        }}
        story={story}
        mode={mode}
        currentPage={currentPage}
        setEditing={setEditingMode}
        cardPreviewEnabled={cardPreviewEnabled}
        onToggleCardPreview={onToggleCardPreview}
        onSort={onSort}
        />
</div> : null);
/**
 * Plugin for GeoStory side panel editor
 * @name GeoStoryEditor
 * @memberof plugins
 */
export default createPlugin('GeoStoryEditor', {
    component: connect(
        createStructuredSelector({
            cardPreviewEnabled: cardPreviewEnabledSelector,
            mode: modeSelector,
            story: currentStorySelector,
            currentPage: currentPageSelector
        }), {
            setEditingMode: setEditing,
            onToggleCardPreview: toggleCardPreview,
            onSort: move
        }
    )(GeoStoryEditor),
    reducers: {
        geostory
    }
});
