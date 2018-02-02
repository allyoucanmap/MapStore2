/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {compose, branch, renameProps} = require('recompose');
const BorderLayout = require('../layout/BorderLayout');
const DockPanel = require('./panels/DockPanel');
const ResizableModal = require('./ResizableModal');

const Modal = renameProps({
    open: 'show'
})(({
    children,
    header,
    ...props
}) => {
    return (
        <ResizableModal {...props}>
            <BorderLayout header={header}>
                {children}
            </BorderLayout>
        </ResizableModal>
    );
});

module.exports = compose(
    branch(
        ({asPanel}) => !asPanel,
        () => props => <Modal {...props}/>
    )
)(DockPanel);
