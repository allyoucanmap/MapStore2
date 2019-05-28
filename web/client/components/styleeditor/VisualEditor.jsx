/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const BorderLayout = require('../layout/BorderLayout');
const { uniqBy, isArray, isNil } = require('lodash');
const ColorPicker = require('../style/ColorPicker');
const { FormControl } = require('react-bootstrap');
const tinycolor = require('tinycolor2');

const fields = {
    color: ({ label, onChange, value }) => {
        return (
            <div style={{
                display: 'flex',
                margin: 8,
                padding: 4,
                alignContent: 'center'
                }}>
                <div style={{flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: 16}}>{label}</div>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'}}>
                    <ColorPicker
                        text={value}
                        value={tinycolor(value).toRgb()}
                        onChangeColor={(color) => {
                            onChange(tinycolor(color).toHexString());
                        }}/>
                </div>
            </div>
        );
    },
    number: ({ label, onChange, value }) => {
        return (
            <div style={{
                display: 'flex',
                margin: 8,
                padding: 4,
                alignContent: 'center'
                }}>
                <div style={{flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: 16}}>{label}</div>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'}}>
                    <FormControl
                        value={value}
                        type="number"
                        onChange={(event) => onChange(event.target.value)}/>
                </div>
            </div>
        );
    },
    opacity: ({ label }) => {
        return (
            <div style={{
                display: 'flex',
                margin: 8,
                padding: 4,
                alignContent: 'center'
                }}>
                <div style={{flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    fontSize: 16}}>{label}</div>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'}}>
                    <FormControl
                        type="number"/>
                </div>
            </div>
        );
    }
};

class VisualEditor extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        form: PropTypes.array,
        onUpdate: PropTypes.func
    };

    static defaultProps = {
        form: [
            {
                label: 'Fill',
                id: 'fillColor',
                type: 'color',
                defaultValue: '#aaff33'
            },
            /*{
                label: 'Fill Opacity',
                id: 'fillOpacity',
                type: 'number',
                defaultValue: 1
            },*/
            {
                label: 'Stroke',
                id: 'color',
                type: 'color',
                defaultValue: '#fff'
            },
            /*{
                label: 'Stroke Opacity',
                id: 'opacity',
                type: 'number',
                defaultValue: 1
            },*/
            {
                label: 'Stroke Width',
                id: 'weight',
                type: 'number',
                defaultValue: 1
            }
        ]
    };

    state = {}

    render() {
        const { style = {}, onUpdate } = this.props;
        const body = uniqBy(style.body || [], 'sourceLayer');
        const currentStyle = body.filter(({id}) => this.state.selected === id)[0];
        return (
            <BorderLayout
                columns={[
                    <div key="list" style={{ order: -1, borderRight: '1px solid #ddd' }}>
                        {body.map(({sourceLayer, id}) => {
                            const isSelected = this.state.selected === id;
                            return (
                                <div key={id} style={{
                                    marginTop: 4,
                                    padding: 4,
                                    width: 150,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    ...(isSelected ? {
                                        backgroundColor: '#078aa3',
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    } : {})
                                    }}
                                    onClick={() => this.setState({ selected: id })}>
                                    {sourceLayer}
                                </div>
                            );
                        })}
                    </div>
                ]}>
                {
                    currentStyle && this.props.form.map(({type, id: fieldId, label, defaultValue}) => {
                        const Field = fields[type];
                        return Field ? (
                            <Field
                                key={fieldId}
                                label={label}
                                value={!isNil(currentStyle[fieldId]) && !isArray(currentStyle[fieldId]) ? currentStyle[fieldId] : defaultValue}
                                onChange={(value) => {
                                    onUpdate({ style: {
                                        ...style,
                                        body: body.map((rule) => {
                                            if (rule.id === this.state.selected) {
                                                return {
                                                    ...rule,
                                                    [fieldId]: value
                                                };
                                            }
                                            return rule;
                                        })
                                    }}, true);
                                }}/>) : null;
                    }).filter(val => val)
                }
            </BorderLayout>
        );
    }
}

module.exports = VisualEditor;
