

import React from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import Button from './components/Button';
import Icon from './components/Icon';
import DirtyStatePrompt from './containers/DirtyStatePrompt';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { isEmpty } from 'lodash';
import { getPendingChanges } from './selectors/save';
import { saveMapResource } from '../../actions/maps';

function Save({
    pendingChanges,
    resourceType,
    onSave
}) {
    const changes = !isEmpty(pendingChanges.changes);
    function handleSave() {
        onSave(resourceType, pendingChanges.resource);
    }
    return (
        <>
            <Button
                square="md"
                className={changes ? 'ms-notification-circle warning' : ''}
                onClick={handleSave}
            >
                <Icon glyph="floppy-disk" type="glyphicon" />
            </Button>
            <DirtyStatePrompt
                dirtyState={changes}
                titleId="resourcesCatalog.detailsPendingChangesTitle"
                descriptionId="resourcesCatalog.detailsPendingChangesDescription"
                cancelId="resourcesCatalog.detailsPendingChangesCancel"
                confirmId="resourcesCatalog.detailsPendingChangesConfirm"
                variant="danger"
            />
        </>
    );
}

const saveConnect = connect(
    createStructuredSelector({
        pendingChanges: getPendingChanges
    }),
    {
        onSave: (resourceType, resource) => {
            return (dispatch) => {
                if (resourceType === 'map') {
                    dispatch(saveMapResource(resource));
                }
            };
        }
    }
);

export default createPlugin('Save', {
    component: saveConnect(Save),
    containers: {
        BrandNavbar: {
            target: 'left-menu',
            position: 3,
            priority: 1
        }
    }
});
