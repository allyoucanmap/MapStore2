/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Page from '../../containers/Page';

class StylesList extends React.Component {

    static propTypes = {
        mode: PropTypes.string,
        match: PropTypes.object,
        plugins: PropTypes.object
    };

    static defaultProps = {
        mode: 'styles-list'
    };

    render() {
        return (
            <Page
                id="styles-list"
                plugins={this.props.plugins}
                params={this.props.match.params}/>
        );
    }
}

export default connect(() => ({}))(StylesList);
