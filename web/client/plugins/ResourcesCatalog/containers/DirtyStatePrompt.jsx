import React, { useRef, useEffect, useState } from 'react';
import { Prompt, withRouter } from 'react-router';
import ConfirmModal from '../components/ConfirmModal';
import { connect } from 'react-redux';
import { push, replace } from 'connected-react-router';

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
    history,
    onReplace,
    onPush
}) {
    const dirtyState = useRef();
    dirtyState.current = dirtyStateProp;

    const [confirmed, setConfirmed] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // show alter when a user tries to close the browser
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

    // disable the back button when there are pending changes
    useEffect(() => {
        let popState;
        if (dirtyStateProp) {
            popState = () => {
                window.history.go(1);
            };
            window.history.pushState(null, null, window.location.href);
            window.addEventListener('popstate', popState);
        }
        return () => {
            if (popState) {
                window.removeEventListener('popstate', popState);
                popState = undefined;
            }
        };
    }, [dirtyStateProp]);

    function handleCancel() {
        setShowModal(false);
    }

    function handleConfirm() {
        const pathname = showModal.nextLocationPathname;
        setConfirmed(true);
        setShowModal(false);
        setTimeout(() => {
            onPush(pathname);
        });
    }

    return (
        <>
            <Prompt
                when={!confirmed && !!dirtyStateProp}
                message={(nextLocation, actionType) => {
                    if (!confirmed && actionType !== 'REPLACE') {
                        setTimeout(() => onReplace(history?.location?.pathname));
                        setShowModal({
                            nextLocationPathname: nextLocation?.pathname,
                            prevLocationPathname: history?.location?.pathname
                        });
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

export default connect(() => ({}), {
    onPush: push,
    onReplace: replace
})(withRouter(DirtyStatePrompt));
