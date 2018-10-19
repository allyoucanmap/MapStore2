/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { connect } = require('react-redux');
const { createSelector } = require('reselect');
const { compose } = require('recompose');
const assign = require('object-assign');

const Loader = require('../components/misc/Loader');
const BorderLayout = require('../components/layout/BorderLayout');
const loadingState = require('../components/misc/enhancers/loadingState');

const {
    statusStyleSelector,
    loadingStyleSelector
} = require('../selectors/styleeditor');

const { selectStyle } = require('../actions/styleeditor');

const {
    StyleSelector,
    StyleToolbar,
    StyleCodeEditor
} = require('./styleeditor/index');

const StyleEditorPanel = compose(
    connect(
        createSelector(
            [
                statusStyleSelector,
                loadingStyleSelector
            ],
            (status, loading) => ({
                isEditing: status === 'edit',
                loading
            })
        ),
        {
            onSelect: selectStyle
        }
    ),
    loadingState(
        ({loading}) => loading === 'global',
        {
            size: 150,
            style: {
                margin: 'auto'
            }
        },
        props => <div style={{position: 'relative', height: '100%', display: 'flex'}}><Loader {...props}/></div>
    )
)(
    ({
        header,
        isEditing,
        showToolbar,
        onUpdateParams = () => {},
        onSelect = () => {}
    }) => (
            <BorderLayout
                className="ms-style-editor-container"
                header={
                    showToolbar ? <div className="ms-style-editor-container-header">
                        {header}
                        <div className="text-center">
                            <StyleToolbar />
                        </div>
                    </div> : null
                }
                footer={<div style={{ height: 25 }} />}>
                {isEditing ? <StyleCodeEditor /> : <StyleSelector
                    onSelect={(params = {}) => {
                        onUpdateParams(params);
                        onSelect(params.style);
                    }}/>}
            </BorderLayout>
        ));

module.exports = {
    StyleEditorPlugin: assign(StyleEditorPanel, {
        TOC: {
            priority: 1,
            container: 'TOCItemSettings',
            ToolbarComponent: StyleToolbar
        }
    }),
    reducers: {
        styleeditor: require('../reducers/styleeditor')
    },
    epics: require('../epics/styleeditor')
};
