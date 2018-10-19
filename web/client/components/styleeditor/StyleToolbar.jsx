/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const Toolbar = require('../misc/toolbar/Toolbar');
const ResizableModal = require('../misc/ResizableModal');
const { Alert } = require('react-bootstrap');

const StyleToolbar = ({
    status,
    onBack = () => {},
    onAdd = () => {},
    onReset = () => {},
    onDelete = () => {},
    onSelectStyle = () => {},
    onEditStyle = () => {},
    buttons = [],
    templateId,
    onUpdate = () => {},
    error,
    isCodeChanged,
    showModal,
    onShowModal,
    loading,
    selectedStyle,
    defaultStyles = [
        'generic',
        'point',
        'line',
        'polygon',
        'raster'
    ]
}) => (
    <div>
        <Toolbar
            btnDefaultProps={{
                className: 'square-button-md',
                bsStyle: 'primary'
            }}
            buttons={[
                {
                    glyph: 'arrow-left',
                    visible: !!status,
                    disabled: !!loading,
                    onClick: () => {
                        if (status === 'edit' && isCodeChanged) {
                            onShowModal({
                                title: 'Save your changes',
                                message: (<Alert bsStyle="warning" style={{ margin: 0 }}>
                                    You are closing without save your changes
                                </Alert>),
                                buttons: [
                                    {
                                        text: 'Close',
                                        bsStyle: 'primary',
                                        onClick: () => {
                                            onShowModal(null);
                                            onBack();
                                            onReset();
                                        }
                                    }
                                ]
                            });
                        } else {
                            onBack();
                            onReset();
                        }
                    }
                },
                {
                    glyph: '1-stilo',
                    visible: !status,
                    disabled: !!loading || defaultStyles.indexOf(selectedStyle) !== -1 || !selectedStyle,
                    onClick: () => onSelectStyle()
                },
                {
                    glyph: 'code',
                    visible: !status,
                    disabled: !!loading || defaultStyles.indexOf(selectedStyle) !== -1 || !selectedStyle,
                    onClick: () => onEditStyle()
                },
                {
                    glyph: 'ok',
                    disabled: !!(error && error.edit && error.edit.status) || !!loading || defaultStyles.indexOf(selectedStyle) !== -1 || !selectedStyle,
                    visible: status === 'edit',
                    onClick: () => onUpdate()
                },
                {
                    glyph: 'plus',
                    visible: !!(status === 'template' && templateId),
                    disabled: !!loading,
                    onClick: () => onAdd()
                },
                {
                    glyph: 'trash',
                    disabled: !!loading || defaultStyles.indexOf(selectedStyle) !== -1 || !selectedStyle,
                    visible: !status,
                    onClick: () => {
                        onShowModal({
                            title: 'Delete style',
                            message: (<Alert bsStyle="warning" style={{ margin: 0 }}>
                                Selected style will be permanently deleted
                            </Alert>),
                            buttons: [
                                {
                                    text: 'Delete',
                                    bsStyle: 'primary',
                                    onClick: () => {
                                        onShowModal(null);
                                        onDelete(selectedStyle);
                                    }
                                }
                            ]
                        });
                    }
                },
                ...(!!status ? [] : buttons)
            ]} />
        <ResizableModal
            show={showModal}
            fitContent
            title={showModal && showModal.title}
            onClose={() => onShowModal(null)}
            buttons={showModal && showModal.buttons}>
            {showModal && showModal.message}
        </ResizableModal>
    </div>
);

module.exports = StyleToolbar;
