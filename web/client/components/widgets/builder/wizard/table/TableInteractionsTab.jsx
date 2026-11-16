/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import { getPossibleTargetsEditingWidget, TARGET_TYPES } from '../../../../../utils/InteractionUtils';
import InteractionEditor from '../common/interactions/InteractionsEditor';

const TABLE_INTERACTION_TARGET_MSG_IDS = {
    [TARGET_TYPES.APPLY_FILTER]: 'widgets.builder.wizard.columnFilter',
    [TARGET_TYPES.APPLY_ZOOM_TO]: 'widgets.builder.wizard.zoomToFilteredBounds',
    [TARGET_TYPES.APPLY_ZOOM_TO_FEATURE]: 'widgets.builder.wizard.zoomToFeatureExtent'
};

/**
 * Interactions of the table widget, the table is both the sender widget and the source
 * @prop {object} data the table widget being edited
 * @prop {object} layer the table layer
 * @prop {function} onEditorChange callback for editor changes
 */
const TableInteractionsTab = ({ data = {}, layer, onEditorChange = () => {} }) => {
    const targets = useMemo(() => getPossibleTargetsEditingWidget('table', layer), [layer]);
    return (
        <div className="ms-table-wizard-interactions-tab">
            <InteractionEditor
                targets={targets}
                sourceWidgetId={data.id}
                currentSourceId={data.id}
                onEditorChange={onEditorChange}
                targetTitleMsgIds={TABLE_INTERACTION_TARGET_MSG_IDS}
            />
        </div>
    );
};

export default TableInteractionsTab;
