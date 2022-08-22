/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isArray, isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import BorderLayout from '../../components/layout/BorderLayout';
import { isSameOrigin } from '../../utils/StyleEditorUtils';
import {
    StyleCodeEditor,
    StyleSelector
} from './index';
import StyleToolbar from './StyleToolbar';

class StyleEditorPanel extends React.Component {
    static propTypes = {
        layer: PropTypes.object,
        header: PropTypes.node,
        isEditing: PropTypes.bool,
        showToolbar: PropTypes.node.bool,
        onInit: PropTypes.func,
        styleService: PropTypes.object,
        userRole: PropTypes.string,
        editingAllowedRoles: PropTypes.array,
        enableSetDefaultStyle: PropTypes.bool,
        canEdit: PropTypes.bool,
        editorConfig: PropTypes.object
    };

    static defaultProps = {
        layer: {},
        onInit: () => {},
        editingAllowedRoles: [
            'ADMIN'
        ],
        editorConfig: {}
    };

    UNSAFE_componentWillMount() {
        const canEdit = !this.props.editingAllowedRoles || (isArray(this.props.editingAllowedRoles) && isString(this.props.userRole)
            && this.props.editingAllowedRoles.indexOf(this.props.userRole) !== -1);
        this.props.onInit(this.props.styleService, canEdit && isSameOrigin(this.props.layer, this.props.styleService));
    }

    render() {
        return (
            <BorderLayout
                className="ms-style-editor-container"
                header={
                    this.props.showToolbar ? <div className="ms-style-editor-container-header">
                        {this.props.header}
                        <div className="text-center">
                            <StyleToolbar
                                enableSetDefaultStyle={this.props.enableSetDefaultStyle}/>
                        </div>
                    </div> : null
                }
                footer={<div style={{ height: 25 }} />}>
                {this.props.isEditing
                    ? <StyleCodeEditor config={this.props.editorConfig}/>
                    : <StyleSelector
                        showDefaultStyleIcon={this.props.canEdit && this.props.enableSetDefaultStyle}/>}
            </BorderLayout>
        );
    }
}

export default StyleEditorPanel;
