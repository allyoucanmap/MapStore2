/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import { getPossibleTargetsEditingWidget, keepSinglePluggedTarget, TARGET_TYPES } from '../../../../../utils/InteractionUtils';
import InteractionEditor from '../common/interactions/InteractionsEditor';

const LEGEND_INTERACTION_TARGET_MSG_IDS = {
    [TARGET_TYPES.APPLY_LEGEND]: 'widgets.builder.wizard.controlMap'
};

/**
 * Interactions of the legend widget, the legend controls one map
 * @prop {object} data the legend widget being edited
 * @prop {function} onEditorChange callback for editor changes
 */
const LegendInteractionsTab = ({ data = {}, onEditorChange = () => {} }) => {
    const targets = useMemo(() => getPossibleTargetsEditingWidget('legend'), []);
    // plugging a map unplugs the previous one
    const handleEditorChange = (key, value) => onEditorChange(key, key === 'interactions'
        ? keepSinglePluggedTarget(value, data.interactions, TARGET_TYPES.APPLY_LEGEND)
        : value);
    return (
        <div className="ms-legend-wizard-interactions-tab">
            <InteractionEditor
                targets={targets}
                sourceWidgetId={data.id}
                currentSourceId={data.id}
                onEditorChange={handleEditorChange}
                targetTitleMsgIds={LEGEND_INTERACTION_TARGET_MSG_IDS}
            />
        </div>
    );
};

export default LegendInteractionsTab;
