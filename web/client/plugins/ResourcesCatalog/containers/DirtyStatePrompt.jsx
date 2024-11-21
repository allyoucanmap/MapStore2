import React, { useRef, useEffect, useState } from 'react';
import { Prompt } from 'react-router';
import ConfirmModal from '../components/ConfirmModal';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

function DirtyStatePrompt({
    dirtyState: dirtyStateProp,
    show,
    onCancel,
    onConfirm,
    titleId,
    descriptionId,
    cancelId,
    confirmId,
    variant,
    onPush
}) {
    const dirtyState = useRef();
    dirtyState.current = dirtyStateProp;

    const [confirmed, setConfirmed] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        function onBeforeUnload(event) {
            if (dirtyState.current) {
                (event || window.event).returnValue = null;
            }
        }
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, []);

    function handleCancel() {
        setShowModal(false);
    }

    function handleConfirm() {
        const pathname = showModal.lastLocation.pathname;
        setConfirmed(true);
        setShowModal(false);
        setTimeout(() => onPush(pathname));
    }

    return (
        <>
            <Prompt
                when={!confirmed && !!dirtyStateProp}
                message={(nextLocation) => {
                    if (!confirmed) {
                        setShowModal({ lastLocation: nextLocation });
                        return false;
                    }
                    return true;
                }}
            />
            <ConfirmModal
                show={show || showModal}
                onCancel={show ? onCancel : handleCancel}
                onConfirm={show ? onConfirm : handleConfirm}
                titleId={titleId}
                descriptionId={descriptionId}
                cancelId={cancelId}
                confirmId={confirmId}
                variant={variant}
            />
        </>
    );
}

export default connect(() => ({}), { onPush: push })(DirtyStatePrompt);
