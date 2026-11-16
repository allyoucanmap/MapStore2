/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { get } from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { compose, renameProps, withProps } from 'recompose';
import { createSelector } from 'reselect';

import { insertWidget, onEditorChange, openFilterEditor, setPage } from '../../actions/widgets';
import { applyWidgetInteractions } from '../../actions/interactions';
import Message from '../../components/I18N/Message';
import BorderLayout from '../../components/layout/BorderLayout';
import ToolbarComp from '../../components/widgets/builder/wizard/legend/Toolbar';
import LegendWizard from '../../components/widgets/builder/wizard/LegendWizard';
import InfoPopover from '../../components/widgets/widget/InfoPopover';
import { currentLocaleSelector } from '../../selectors/locale';
import { getEditingLegendMapSelector } from '../../selectors/widgets';
import BuilderHeader from './BuilderHeader';
import { wizardSelector, wizardStateToProps } from './commons';
import withExitButton from './enhancers/withExitButton';

// a legend can be saved without map, it shows an empty state until a map is connected in its interactions
const withValidMap = withProps(() => ({ valid: true }));


const localeSelector = createSelector(
    currentLocaleSelector,
    (locale) => ({
        currentLocale: locale
    })
);

const Builder = compose(
    connect(
        wizardSelector,
        {
            setPage,
            onEditorChange,
            insertWidget,
            onApplyWidgetInteractions: applyWidgetInteractions
        },
        wizardStateToProps
    ),
    connect(localeSelector),
    connect(createSelector(getEditingLegendMapSelector, legendMap => ({ legendMap }))),
    withValidMap,
    renameProps({
        editorData: "data",
        onEditorChange: "onChange"
    })

)(LegendWizard);


const Toolbar = compose(
    connect(wizardSelector, {
        openFilterEditor,
        setPage,
        onChange: onEditorChange,
        insertWidget
    },
    wizardStateToProps
    ),
    withValidMap,
    // exit support
    connect(() => ({}), {
        onLayerChoice: (l) => onEditorChange("layer", l),
        onResetChange: onEditorChange
    }),
    withProps(({ onResetChange = () => { } }) => ({
        exitButton: {
            glyph: 'arrow-left',
            tooltipId: "widgets.builder.wizard.backToWidgetTypeSelection",
            onClick: () => onResetChange('widgetType', undefined)
        }
    })),
    withExitButton(({ step}) => step === 0)
    // end exit support
)(ToolbarComp);

/*
 * in case you don't have a layer selected (e.g. dashboard) the table builder
 * prompts a catalog view to allow layer selection
 */
const builderEnhancer = connect(wizardSelector);

export default builderEnhancer(({ enabled, onClose = () => { }, editorData = {}, exitButton, ...props } = {}) =>

    (<BorderLayout
        header={
            <BuilderHeader onClose={onClose}>
                <Toolbar
                    editorData={editorData}
                    exitButton={exitButton}
                    onClose={onClose} />
                {get(editorData, "options.propertyName.length") === 0 ? <InfoPopover
                    trigger={false}
                    glyph="exclamation-mark"
                    bsStyle="warning"
                    text={<Message msgId="widgets.builder.errors.checkAtLeastOneAttribute" />} /> : null}
            </BuilderHeader>}
    >
        {enabled ? <Builder editorData={editorData} {...props} /> : null}
    </BorderLayout>));
