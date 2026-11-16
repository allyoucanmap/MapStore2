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

const MAP_INTERACTION_TARGET_MSG_IDS = {
    [TARGET_TYPES.APPLY_SPATIAL_FILTER]: 'widgets.builder.wizard.viewportFilter'
};

/**
 * Interactions of the selected map of a map widget, the map is the source
 * @prop {object} data the map widget being edited
 * @prop {function} onEditorChange callback for editor changes
 */
const MapInteractionsTab = ({ data = {}, onEditorChange = () => {} }) => {
    const targets = useMemo(() => getPossibleTargetsEditingWidget('map'), []);
    return (
        <div className="ms-map-wizard-interactions-tab">
            <InteractionEditor
                key={data.selectedMapId}
                targets={targets}
                sourceWidgetId={data.id}
                currentSourceId={data.selectedMapId}
                onEditorChange={onEditorChange}
                targetTitleMsgIds={MAP_INTERACTION_TARGET_MSG_IDS}
            />
        </div>
    );
};

export default MapInteractionsTab;
