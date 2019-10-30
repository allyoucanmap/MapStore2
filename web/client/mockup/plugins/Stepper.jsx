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
import { createPlugin}  from '../../utils/PluginsUtils';
import { Button, ButtonToolbar, Label } from 'react-bootstrap';
import { push } from 'react-router-redux';
class StepperPlugin extends React.Component {
    static propTypes = {
        steps: PropTypes.array,
        next: PropTypes.object,
        back: PropTypes.object,
        onClick: PropTypes.func
    };

    static defaultProps = {
        steps: [
            {
                id: 'configure-plugins',
                label: 'Configure Plugins',
                passed: true
            },
            {
                id: 'configure-templates',
                label: 'Configure Templates',
                selected: true
            },
            {
                id: 'configure-map',
                label: 'Configure Map'
            }
        ],
        next: {
            label: 'Next',
            link: ''
        },
        back: {
            label: 'Back',
            link: ''
        },
        onClick: () => {}
    };

    render() {
        const { steps = [], next, back, onClick } = this.props;
        return (
            <>
            <div
                style={{
                    display: 'flex',
                    padding: 8,
                    borderTop: '1px solid #ddd'
                }}>
                <ButtonToolbar
                    style={{
                        marginLeft: 'auto',
                        marginRight: 0
                    }}>
                    <Button
                        bsSize="sm"
                        className="no-border"
                        disabled={!back.link}
                        onClick={() => onClick(back.link)}>
                        {back.label}
                    </Button>
                    <Button
                        bsStyle="primary"
                        bsSize="sm"
                        onClick={() => onClick(next.link)}>
                        {next.label}
                    </Button>
                </ButtonToolbar>
            </div>
            <div
                style={{
                    display: 'flex'
                }}>
                {steps.map((step, idx) => {
                    return (
                        <>
                            {idx > 0 &&
                            <div key={'line' + step.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                <div
                                    style={{
                                        backgroundColor: (step.selected || step.passed) ? '#777' : '#ddd',
                                        height: 1,
                                        width: '100%'
                                    }}/>
                            </div>}
                            <div key={'label' + step.id} style={{ padding: 8, display: 'flex', alignItems: 'center' }}>
                                <Label bsStyle={step.selected ? 'success' : 'primary'} style={(step.selected || step.passed) ? {} : { backgroundColor: '#aaa'}}>{idx + 1}</Label>
                                <span style={{ padding: 8 }}>
                                    {(step.selected)
                                        ? <strong>{step.label}</strong>
                                        : step.label}
                                </span>
                            </div>
                        </>
                    );
                })}
            </div>
            </>
        );
    }
}
export default createPlugin('Stepper', {
    component: connect(() => ({}), { onClick: push })(StepperPlugin)
});
