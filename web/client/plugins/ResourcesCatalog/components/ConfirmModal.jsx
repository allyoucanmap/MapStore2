/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import Modal from '../../../components/misc/Modal';
import Message from '../../../components/I18N/Message';
import Button from './Button';
import Box from './Box';
import Text from './Text';
import Spinner from './Spinner';
import { Alert } from 'react-bootstrap';

function ConfirmModal({
    show,
    onCancel,
    onConfirm,
    titleId,
    descriptionId,
    errorId,
    cancelId = 'no',
    confirmId = 'yes',
    variant = 'danger',
    loading
}) {

    function handleHide() {
        if (!loading) {
            onCancel();
        }
    }

    if (!show) {
        return null;
    }
    return (
        <Modal
            show={show}
            onHide={handleHide}
        >
            <Box display="flex" flexColumn flexGap="md" plr="lg" ptb="md">
                <Text fontSize="lg" strong>
                    {titleId ? <Message msgId={titleId} /> : null}
                </Text>
                <Text>
                    {descriptionId ? <Message msgId={descriptionId} /> : null}
                </Text>
                {errorId
                    ? <Box p="sm" component={Alert} bsStyle="danger">
                        <Message msgId={errorId} />
                    </Box>
                    : null}
                <Box display="flex" flexVerticalAlign flexGap="sm">
                    <Box flexFill />
                    <Button disabled={loading} onClick={() => onCancel()}>
                        <Message msgId={cancelId} />
                    </Button>
                    <Button disabled={loading} variant={variant} onClick={() => onConfirm()}>
                        <Message msgId={confirmId} />
                        {loading ? <>{' '}<Spinner /></> : null}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default ConfirmModal;
