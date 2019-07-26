/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import { head } from 'lodash';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import { Button, ControlLabel, FormControl as FormControlRB, FormGroup, HelpBlock } from 'react-bootstrap';
import Toolbar from './toolbar/Toolbar';
import SelectComponent from './Select';
import Message from '../I18N/Message';
import localizedProps from './enhancers/localizedProps';

const FormControl = localizedProps('placeholder')(FormControlRB);
const Select = localizedProps('placeholder')(SelectComponent);

const formField = {
    text: ({ field, value, onBlur, onKeyUp, onChange = () => { } }) => (
        <FormControl
            type="text"
            value={value || ''}
            onChange={(event) => onChange({ [field.id]: event.target.value })}
            onBlur={() => onBlur(field.id)}
            onKeyUp={event => onKeyUp(event)}
            placeholder={field.placeholder} />
    ),
    password: ({ field, value, onBlur, onKeyUp, onChange = () => { } }) => (
        <FormControl
            type="password"
            value={value || ''}
            onChange={(event) => onChange({ [field.id]: event.target.value })}
            onBlur={() => onBlur(field.id)}
            onKeyUp={event => onKeyUp(event)}
            placeholder={field.placeholder} />
    ),
    textarea: ({ field, value, onBlur, onKeyUp, onChange = () => { } }) => (
        <FormControl
            componentClass="textarea"
            value={value || ''}
            placeholder={field.placeholder}
            rows={4}
            onChange={(event) => onChange({ [field.id]: event.target.value })}
            onBlur={() => onBlur(field.id)}
            onKeyUp={event => onKeyUp(event)}
            style={{ resize: 'none' }} />
    ),
    email: ({ field, value, onBlur, onKeyUp, onChange = () => { } }) => (
        <FormControl
            type="email"
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(event) => onChange({ [field.id]: event.target.value })}
            onKeyUp={event => onKeyUp(event)}
            onBlur={() => onBlur(field.id)}
        />
    ),
    select: ({ field, formId, value, onBlur, onChange }) => (
        <Select
            {...field}
            value={value}
            scrollableContainer={`#${formId}`}
            onChange={selectedOption => onChange({ [field.id]: selectedOption })}
            onBlur={() => onBlur(field.id)}
            optionRenderer={(option) => {
                if (option.button) {
                    return (
                        <Button
                            className="ms-underline"
                            style={{
                                margin: 0
                            }}>
                            {option.label}
                        </Button>
                    );
                }
                return option.label;
            }}
        />
    ),
    group: ({ field }) => {
        return field.body ? <div>{field.body}</div> : null;
    }
};

/**
 * Form component
 * @memberof components.misc
 * @name Form
 * @class
 * @prop {string} id identifier
 * @prop {array} form it represents the structure of the form, available field types `text`, `textarea`, `email` and `select`
 * @prop {object} values plain object with keys and value
 * @example
 * // example of props
 * id = 'my-form'
 * form = [
 *  {
 *   type: 'text',
 *   id: 'username',
 *   label: 'Username',
 *   placeholder: 'Enter username'
 *  },
 *  null // null add an empty space
 * ]
 * values = { username: 'My Username' }
 */


const Form = ({
    id,
    form,
    values,
    handleBlur,
    handleValueChange,
    handleKeyUp,
    validations = {},
    className = '',
    bootstrap = false
}) => (
        <div id={id} className={`ms-form${className ? ` ${className}` : ''} ${!bootstrap ? ' custom' : ''}`}>
            {form.map((group, idx) => {
                if (!group) return <br key={idx} />;
                const validation = validations[group.id];
                return (
                    <FormGroup
                        key={idx}
                        bsSize="sm"
                        controlId={`profile-form-${group.id}`}
                        validationState={validation ? 'error' : null}>
                        <div className="mps-form-row">
                            {
                                ([group])
                                    .map((field, jdx) => {
                                        const Component = formField[field.type];
                                        const value = field.getValue && field.getValue(field.id, values) || values[field.id];
                                        return Component
                                            ? (
                                                <div
                                                    key={jdx}
                                                    className="mps-form-col">
                                                    {(field.label || field.buttons) &&
                                                        <ControlLabel>
                                                            <span><Message msgId={field.label}/></span>
                                                            {field.buttons && <Toolbar
                                                                btnDefaultProps={{
                                                                    bsStyle: 'primary',
                                                                    className: 'square-button-md'
                                                                }}
                                                                buttons={field.buttons} />}
                                                        </ControlLabel>
                                                    }
                                                    <Component
                                                        formId={id}
                                                        field={field}
                                                        value={value}
                                                        onBlur={fieldId => handleBlur(fieldId)}
                                                        onKeyUp = {handleKeyUp}
                                                        onChange={(target) => {
                                                            handleValueChange(
                                                                field.id,
                                                                field.setValue && field.setValue(field.id, target)
                                                                || target
                                                            );

                                                        }} />
                                                    {validation &&
                                                        <HelpBlock>
                                                        {validation.messageId ?
                                                            <Message msgId={validation.messageId}/> : validation.message}
                                                        </HelpBlock>}
                                                </div>
                                            )
                                            : null;
                                    })
                            }
                        </div>
                    </FormGroup>
                );
            })}
        </div>
    );

const enhancedForm = compose(
    withState('validations', 'setValidations', ({ errors }) => errors || {}),
    withState('values', 'setValues', ({ values }) => values || {}),
    withState('touched', 'setTouched', ({ form }) => form.
        map(field => field && field.id)
        .reduce((acc, id) => {
            return id ? { ...acc, [id]: false } : acc;
        }, {})
    ),
    lifecycle({
        componentDidUpdate(prevProps) {
            if (prevProps.errors !== this.props.errors) {
                this.setState({validations: this.props.errors}); // eslint-disable-line react/no-did-update-set-state
            }
        }
    }),
    withHandlers({
        handleValidation: props => (id, params) => {
            const values = params.values || props.values;
            const touched = params.touched || props.touched;
            const group = head(props.form.filter(field => field && field.id === id)) || {};
            const validation = touched[id] && (group.rules || [])
                .reduce((validRule, rule) => {
                    if (!validRule && rule.required && !values[id]) {
                        return {
                            messageId: rule.messageId,
                            message: rule.messageId ? null : rule.message || `${id} is required`
                        };
                    }
                    if (!validation && rule.type === 'email') {
                        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        const email = values[id];
                        return email && !emailRegex.test(email) && {
                            messageId: rule.messageId,
                            message: rule.message
                        };
                    }
                    if (!validRule && rule.validator) {
                        return rule.validator(id, values);
                    }
                    return validRule;
                }, false);

            const validations = { ...props.validations, [id]: validation };
            props.setValidations(validations);
            if (props.isValid) {
                const isValid = !head(Object.keys(validations).filter(key => validations[key]));
                props.isValid(isValid);
            }
        }
    }),
    withHandlers({
        handleValueChange: props => (id, target) => {
            const values = { ...props.values, ...target };
            props.setValues(values);
            props.onChange(values);
            props.handleValidation(id, { values });
        },
        handleBlur: props => id => {
            const touched = { ...props.touched, [id]: true };
            props.setTouched(touched);
            props.handleValidation(id, { touched });
        },
        handleKeyUp: props => event => {
            if (event.key === 'Enter' && props.onEnterKey) {
                props.onEnterKey();
            }
        }
    })
)(Form);

export default enhancedForm;
