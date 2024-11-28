import React, { useState } from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import ConfirmDialog from './components/ConfirmDialog';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { userSelector } from '../../selectors/security';
import Persistence from '../../api/persistence';
import { searchResources } from './actions/resources';

function DeleteResource({
    user,
    resource,
    component,
    onRefresh
}) {
    const Component = component;
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [errorId, setErrorId] = useState(false);

    function handleCancel() {
        setShowModal(false);
    }
    function handleDelete() {
        if (!deleting) {
            setDeleting(true);
            setErrorId(false);
            Persistence.getApi()
                .deleteResource({ id: resource.pk }, { deleteLinkedResources: true })
                .toPromise()
                .then((response) => response?.toPromise ? response.toPromise() : response)
                .then(() => {
                    onRefresh();
                    setShowModal(false);
                })
                .catch((error) => {
                    setErrorId(`resourcesCatalog.deleteError.error${error.status || 'default'}`);
                })
                .finally(() => {
                    setDeleting(false);
                });
        }
    }
    // TODO: use resource.canDelete instead of user
    if (!user) {
        return null;
    }
    return (
        <>
            {Component ? <Component
                glyph="trash"
                iconType="glyphicon"
                labelId="resourcesCatalog.deleteResource"
                square
                onClick={() => setShowModal(true)}
            /> : null}
            <ConfirmDialog
                show={!!showModal}
                onCancel={handleCancel}
                onConfirm={handleDelete}
                titleId="resourcesCatalog.deleteResourceTitle"
                descriptionId="resourcesCatalog.deleteResourceDescription"
                cancelId="resourcesCatalog.deleteResourceCancel"
                confirmId="resourcesCatalog.deleteResourceConfirm"
                variant="danger"
                errorId={errorId}
                loading={deleting}
            />
        </>
    );
}

const deleteResourcesConnect = connect(
    createStructuredSelector({
        user: userSelector
    }),
    {
        onRefresh: searchResources.bind(null, { refresh: true })
    }
);

export default createPlugin('DeleteResource', {
    component: deleteResourcesConnect(DeleteResource),
    containers: {
        ResourcesGrid: {
            target: 'card-options',
            position: 1
        }
    }
});
