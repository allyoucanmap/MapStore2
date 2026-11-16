/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { insertWidget, onEditorChange } from '../../actions/widgets';
import { getEditingWidget } from '../../selectors/widgets';
import BorderLayout from '../../components/layout/BorderLayout';
import Toolbar from '../../components/misc/toolbar/Toolbar';
import Message from '../../components/I18N/Message';
import MapInteractionsTab from '../../components/widgets/builder/wizard/map/MapInteractionsTab';
import BuilderHeader from './BuilderHeader';

/**
 * Builder of the main map interactions, the main map has no options so only its interactions are shown
 */
export const MainMapInteractionsBuilder = ({ enabled, editorData = {}, onClose = () => {}, onChange = () => {}, onSave = () => {}, target }) => (
    <BorderLayout
        className="ms-main-map-interactions-builder"
        header={
            <BuilderHeader onClose={onClose}>
                <Toolbar
                    btnDefaultProps={{ bsStyle: "primary", bsSize: "sm", className: "square-button" }}
                    buttons={[{
                        glyph: "floppy-disk",
                        tooltipId: "widgets.builder.wizard.updateWidget",
                        onClick: () => onSave(editorData, target)
                    }]}
                />
                <Message msgId="widgets.types.mainMap.title" />
            </BuilderHeader>
        }
    >
        {enabled ? <MapInteractionsTab data={editorData} onEditorChange={onChange} /> : null}
    </BorderLayout>
);

export default connect(
    createSelector(getEditingWidget, (editorData) => ({ editorData })),
    { onChange: onEditorChange, onSave: insertWidget }
)(MainMapInteractionsBuilder);
