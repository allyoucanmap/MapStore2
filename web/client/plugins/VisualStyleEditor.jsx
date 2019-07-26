/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import assign from 'object-assign';
import { connect } from 'react-redux';
import { set, get, head, isNil } from 'lodash';
import { withState } from 'recompose';
import { createSelector } from 'reselect';
import { setControlProperty } from '../actions/controls';
import PropTypes from 'prop-types';
import Container from '../components/misc/Container';
import BorderLayout from '../components/layout/BorderLayout';
import Toolbar from '../components/misc/toolbar/Toolbar';
import SideGrid from '../components/misc/cardgrids/SideGrid';
import SwitchButton from '../components/misc/switch/SwitchButton';
import ColorSelector from '../components/style/ColorSelector';
import tinycolor from 'tinycolor2';
import Slider from '../components/misc/Slider';
import { Button, Glyphicon, FormGroup, FormControl } from 'react-bootstrap';
import Editor from '../components/styleeditor/Editor';
import Loader from '../components/misc/Loader';
import { getUpdatedLayer } from '../selectors/styleeditor';
import { updateNode } from '../actions/layers';
import uuidv1 from 'uuid/v1';
import Select from 'react-select';

import { readStyle, writeStyle } from '../utils/StyleParser';

/*
import css from 'css';

let raw = `
* {
    fill: symbol("shape://dot");
    stroke: #333;
    stroke-width: 0.5;
    stroke-dasharray: 1;
    fill-random: free;
    fill-random-seed: 5;
    fill-random-rotation: none;
    fill-random-symbol-count: 200;
    fill-random-tile-size: 100;
}

:fill {
    size: 8;
    stroke: #333;
    stroke-width: 2;
}
`;
let result = css.parse(raw, {silent: true});

console.log(result);*/

// import draggableContainer from '../components/misc/enhancers/draggableContainer';
// import draggableComponent from '../components/misc/enhancers/draggableComponent';

const FilterField = ({ index, field, value, operator, onChange = () => {}, onRemove = () => {} }) => {
    return (
        <div
            style={{
                display: 'flex',
                paddingLeft: 8,
                borderLeft: '2px solid #333'
            }}>
            <FormControl
                style={{ flex: 1, height: 20, borderBottom: '1px solid #ddd', padding: '0 8px' }}
                value={field}
                onChange={(event) => onChange(`${index}[1]`, event.target.value)} />
            <div style={{ padding: '0 4px' }}>
                {operator}
            </div>
            <FormControl
                style={{ flex: 1, height: 20, borderBottom: '1px solid #ddd', padding: '0 8px' }}
                value={value}
                onChange={(event) => onChange(`${index}[2]`, event.target.value)} />
            <Toolbar
                btnDefaultProps={{
                    className: 'square-button-md no-border'
                }}
                buttons={[
                    {
                        glyph: 'trash',
                        tooltip: 'Remove field',
                        onClick: () => onRemove()
                    }
                ]}/>
        </div>
    );
};

const logicOperators = [ '!', '||', '&&' ];

const StyleFilterBuilder = ({ filter, index = '', onChange = () => {} }) => {

    if (!filter) return null;
    const operator = filter[0];
    if (!operator) return null;
    const rules = filter.filter((rule, idx) => idx > 0);

    if (logicOperators.indexOf(operator) !== -1) {
        return (
            <div>
                <div>
                {operator}
                <Toolbar
                    btnDefaultProps={{
                        className: 'square-button-md no-border'
                    }}
                    buttons={[
                        {
                            glyph: 'plus',
                            tooltip: 'Remove field',
                            onClick: () => {}
                        }
                    ]}/>
                </div>
                {rules.map((rule, idx) => {
                    return (
                        <StyleFilterBuilder
                            key={idx}
                            filter={rule}
                            index={`${index}[${idx + 1}]`}
                            onChange={onChange}/>
                    );
                })}
            </div>
        );
    }
    const [ field, value ] = rules;
    return (
        <FilterField
            operator={operator}
            field={field}
            value={value}
            index={index}
            onChange={onChange}/>
    );
};

const SLD_EXAMPLE = ``;

const FieldContainer = ({ children, label }) => {
    return (
        <div
            className="ms-symbolizer-field">
            <div>{label}</div>
            <div>{children}</div>
        </div>
    );
};

const fields = {
    color: ({ label, config = {}, value, onChange = () => {} }) => (
        <FieldContainer
            label={label}>
            <ColorSelector
                color={value}
                stroke={config.stroke}
                onChangeColor={(color) => color && onChange(color)}/>
        </FieldContainer>
    ),
    slider: ({ label, value, config = {}, onChange = () => {} }) => (
        <FieldContainer
            label={label}>
            <div
                className="mapstore-slider with-tooltip"
                onClick={(e) => { e.stopPropagation(); }}>
                <Slider
                    start={[value]}
                    tooltips={[true]}
                    format={config.format}
                    range={config.range || { min: 0, max: 10 }}
                    onChange={(changedValue) => onChange(changedValue)}/>
            </div>
        </FieldContainer>
    ),
    mark: ({ label, value, onChange = () => {} }) => (
        <FieldContainer
            label={label}>
            <Select
                value={value}
                clearable={false}
                options={[
                    {
                        value: 'Circle',
                        label: 'Circle'
                    },
                    {
                        value: 'Square',
                        label: 'Square'
                    },
                    {
                        value: 'Triangle',
                        label: 'Triangle'
                    },
                    {
                        value: 'Star',
                        label: 'Star'
                    },
                    {
                        value: 'Cross',
                        label: 'Cross'
                    },
                    {
                        value: 'X',
                        label: 'X'
                    },
                    {
                        value: 'shape://vertline',
                        label: 'shape://vertline'
                    },
                    {
                        value: 'shape://horline',
                        label: 'shape://horline'
                    },
                    {
                        value: 'shape://slash',
                        label: 'shape://slash'
                    },
                    {
                        value: 'shape://backslash',
                        label: 'shape://backslash'
                    },
                    {
                        value: 'shape://dot',
                        label: 'shape://dot'
                    },
                    {
                        value: 'shape://plus',
                        label: 'shape://plus'
                    },
                    {
                        value: 'shape://times',
                        label: 'shape://times'
                    },
                    {
                        value: 'shape://oarrow',
                        label: 'shape://oarrow'
                    },
                    {
                        value: 'shape://carrow',
                        label: 'shape://carrow'
                    }
                ]}
                onChange={(option = {}) => {
                    onChange(option.value);
                }}/>
        </FieldContainer>
    ),
    input: ({ label, value, config = {}, onChange = () => {} }) => (
        <FieldContainer
            label={label}>
            <FormGroup>
                <FormControl
                    type={config.type || 'text'}
                    value={value}
                    onChange={event => onChange(event.target.value)}/>
            </FormGroup>
        </FieldContainer>
    ),
    scale: ({ label, value, onChange = () => {} }) => (
        <FieldContainer
            label={label}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div>{'1 :'}&nbsp;</div>
                <FormGroup style={{ flex: 1 }}>
                    <FormControl
                        value={value}
                        onChange={event => onChange(event.target.value)}/>
                </FormGroup>
            </div>
        </FieldContainer>
    ),
    toolbar: ({ label, value, onChange = () => {}, config = {} }) => (
        <FieldContainer
            label={label}>
            <Toolbar
                btnDefaultProps={{
                    className: 'no-border',
                    bsSize: 'xs'
                }}
                buttons={(config.options || [])
                .map(({ glyph, text, value: optionValue }) => ({
                    glyph,
                    text,
                    active: optionValue === value ? true : false,
                    onClick: () => onChange(value === optionValue ? undefined : optionValue)
                }))}/>
        </FieldContainer>
    )
};

const SymbolizerContainer = withState('expanded', 'onExpand', ({ defaultExpanded }) => defaultExpanded)(
    ({glyph, children, draggable, expanded, onExpand}) => (
    <div className="ms-symbolizer">
        <div>
            {draggable && <div className="ms-grab-handler">
                 <Glyphicon glyph="menu-hamburger"/>
            </div>}
            <div className="ms-symbolizer-info">
                {glyph && <Glyphicon glyph={glyph}/>}
            </div>
            <div>
                <Toolbar
                    btnDefaultProps={{
                        className: 'square-button-sm no-border'
                    }}
                    buttons={[
                        {
                            glyph: expanded ? 'chevron-down' : 'chevron-left',
                            tooltip: 'Collapse',
                            onClick: () => onExpand(!expanded)
                        }
                    ]}/>
            </div>
        </div>
        {expanded && <div>
            {children}
        </div>}
    </div>
)
);

const parameters = {
    color: ({ key = 'color', opacityKey = 'opacity', label = 'Fill', stroke }) => ({
        type: 'color',
        label,
        config: {
            stroke
        },
        setValue: (value, properties) => {
            const opacity = isNil(properties[opacityKey]) ? 1 : properties[opacityKey];
            return tinycolor(value).setAlpha(opacity).toRgb();
        },
        getValue: (value) => {
            const { a, ...color} = value || {};
            return {
                [key]: tinycolor({ ...color, a: 1 }).toHexString(),
                [opacityKey]: a
            };
        }
    }),
    width: ({ key = 'width', label = 'Width' }) => ({
        type: 'slider',
        label,
        config: {
            range: { min: 0, max: 20 },
            format: {
                from: value => Math.round(value),
                to: value => Math.round(value) + ' px'
            }
        },
        setValue: (value = 1) => {
            return parseFloat(value);
        },
        getValue: (value = []) => {
            const width = value[0] && value[0].split(' px')[0];
            return {
                [key]: parseFloat(width)
            };
        }
    }),
    size: ({ key = 'radius', label = 'Radius' }) => ({
        type: 'slider',
        label,
        config: {
            range: { min: 0, max: 100 },
            format: {
                from: value => Math.round(value),
                to: value => Math.round(value) + ' px'
            }
        },
        setValue: (value = 1) => {
            return parseFloat(value);
        },
        getValue: (value = []) => {
            const width = value[0] && value[0].split(' px')[0];
            return {
                [key]: parseFloat(width)
            };
        }
    }),
    shape: ({ label, key = 'wellKnownName' }) => ({
        type: 'mark',
        label,
        getValue: (value = '') => {
            return {
                [key]: value
            };
        }
    }),
    text: ({ label, key = 'Label' }) => ({
        type: 'input',
        label,
        getValue: (value = '') => {
            return {
                [key]: value
            };
        }
    }),
    fontStyle: ({ label, key = 'Label' }) => ({
        type: 'toolbar',
        label,
        config: {
            options: [{
                glyph: 'font',
                value: 'normal'
            }, {
                glyph: 'italic',
                value: 'italic'
            }, {
                glyph: 'italic',
                value: 'oblique'
            }]
        },
        getValue: (value = '') => {
            return {
                [key]: value
            };
        }
    }),
    fontWeight: ({ label, key = 'Label' }) => ({
        type: 'toolbar',
        label,
        config: {
            options: [{
                glyph: 'font',
                value: 'normal'
            }, {
                glyph: 'bold',
                value: 'bold'
            }]
        },
        getValue: (value = '') => {
            return {
                [key]: value
            };
        }
    }),
    bool: ({ label, key = 'Label' }) => ({
        type: 'toolbar',
        label,
        config: {
            options: [{
                text: 'true',
                value: true
            }, {
                text: 'false',
                value: false
            }]
        },
        getValue: (value) => {
            return {
                [key]: value
            };
        }
    })
};

const groups = {
    mark: {
        glyph: 'point',
        params: {
            wellKnownName: parameters.shape({ label: 'Shape' }),
            color: parameters.color({ key: 'color', opacityKey: 'opacity', label: 'Fill' }),
            strokeColor: parameters.color({ key: 'strokeColor', opacityKey: 'strokeOpacity', label: 'Stroke Color', stroke: true }),
            strokeWidth: parameters.width({ key: 'strokeWidth', label: 'Stroke Width' }),
            radius: parameters.size({ key: 'radius', label: 'Radius' })
        }
    },
    fill: {
        glyph: 'polygon',
        params: {
            color: parameters.color({ label: 'Fill Color' }),
            outlineColor: parameters.color({ key: 'outlineColor', opacityKey: 'outlineOpacity', label: 'Outline Color', stroke: true }),
            outlineWidth: parameters.width({ key: 'outlineWidth', label: 'Outline Width' })
        }
    },
    line: {
        glyph: 'line',
        params: {
            color: parameters.color({ label: 'Stroke Color', stroke: true }),
            width: parameters.width({ label: 'Stroke Width', key: 'width' })
        }
    },
    text: {
        glyph: 'font',
        params: {
            label: parameters.text({ label: 'Label', key: 'label' }),
            color: parameters.color({ label: 'Font Color', key: 'color' }),
            size: parameters.size({ label: 'Font Size', key: 'size' }),
            fontStyle: parameters.fontStyle({ label: 'Font Style', key: 'fontStyle' }),
            fontWeight: parameters.fontWeight({ label: 'Font Weight', key: 'fontWeight' }),
            haloColor: parameters.color({ label: 'Halo Color', key: 'haloColor', stroke: true }),
            haloWidth: parameters.width({ label: 'Halo Width', key: 'haloWidth' }),
            allowOverlap: parameters.bool({ label: 'Overlap', key: 'allowOverlap' })
        }
    },
    raster: null
};

const RuleEditor = ({ rules = [], onAdd = () => {}, onChange = () => {}}) => {

    const ScaleInput = fields.scale;
    return (
        <div className="ms-style-rule-editor">
        <SideGrid
            size="sm"
            items={
                rules.map(rule => {
                    const { name, symbolizers = [], filter, scaleDenominator = {}, ruleId } = rule;
                    return {
                        id: ruleId,
                        preview: <span className="ms-grab-handler">
                            <Glyphicon glyph="menu-hamburger"/>
                        </span>,
                        title: name,
                        tools: <Toolbar
                        btnDefaultProps={{
                            className: 'square-button-md no-border'
                        }}
                        buttons={[
                            {
                                glyph: 'point-plus',
                                tooltip: 'Add point style',
                                onClick: () => onAdd(ruleId, 'Mark', { wellKnownName: 'shape://carrow' })
                            },
                            {
                                glyph: 'line-plus',
                                tooltip: 'Add line style',
                                onClick: () => onAdd(ruleId, 'Line')
                            },
                            {
                                glyph: 'polygon-plus',
                                tooltip: 'Add polygon style',
                                onClick: () => onAdd(ruleId, 'Fill')
                            },
                            /*{
                                glyph: '1-raster',
                                tooltip: 'Add raster style'
                            },*/
                            {
                                glyph: 'font',
                                tooltip: 'Add label',
                                onClick: () => onAdd(ruleId, 'Text', { label: 'Label' })
                            }
                        ]}/>,
                        body: (
                            <BorderLayout
                                header={
                                    [<SymbolizerContainer
                                        key="filter"
                                        glyph="filter">
                                        <StyleFilterBuilder
                                            filter={filter}
                                            onChange={(index, value) => {
                                                let newFilter = [ ...filter ];
                                                set(newFilter, index, value);
                                                onChange({
                                                    filter: newFilter
                                                }, ruleId);
                                            }}/>
                                    </SymbolizerContainer>,
                                    <SymbolizerContainer
                                        key="scale"
                                        glyph="1-ruler">
                                        <ScaleInput
                                            label="Max Scale"
                                            value={scaleDenominator.max}
                                            onChange={(max) => {
                                                onChange({
                                                    scaleDenominator: {
                                                        ...scaleDenominator,
                                                        max
                                                    }
                                                }, ruleId);
                                            }}/>
                                        <ScaleInput
                                            label="Min Scale"
                                            value={scaleDenominator.min}
                                            onChange={(min) => {
                                                onChange({
                                                    scaleDenominator: {
                                                        ...scaleDenominator,
                                                        min
                                                    }
                                                }, ruleId);
                                            }}/>
                                    </SymbolizerContainer>]
                                }>
                                {symbolizers.map(({ kind = '', ...properties, symbolizerId }) => {
                                    const { params, glyph } = groups[kind.toLowerCase()] || {};
                                    return params &&
                                        <SymbolizerContainer
                                            key={symbolizerId}
                                            defaultExpanded
                                            draggable
                                            glyph={glyph}>
                                            {Object.keys(params)
                                                .map((key) => {
                                                    const { type, setValue, getValue, config, label } = params[key] || {};
                                                    const Field = fields[type];
                                                    return Field && <Field
                                                        key={key}
                                                        label={label || key}
                                                        config={config}
                                                        value={setValue && setValue(properties[key], properties) || properties[key]}
                                                        onChange={(values) => onChange(getValue && getValue(values) || values, ruleId, symbolizerId)}/>;
                                                })}
                                        </SymbolizerContainer>
                                    ;
                                })}
                            </BorderLayout>
                        )
                    };
                })
            }/>
        </div>
    );
};

class Visual extends Component {

    static propTypes = {
        id: PropTypes.string,
        code: PropTypes.string,
        format: PropTypes.string,
        onChange: PropTypes.func
    };

    static defaultProps = {
        onChange: () => {}
    }

    state = {
        styles: [],
        selectedNamedLayer: '',
        namedLayers: []
    };

    componentWillMount() {
        this.parseStyle(this.props.code);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.id !== this.props.id) {
            this.parseStyle(newProps.code);
        }
    }

    getStyle = () => {
        const { styles = [], selectedNamedLayer } = this.state;
        const style = head(styles.filter(({ name }) => name === selectedNamedLayer)) || {};
        return style;
    }

    render() {
        const { namedLayers, selectedNamedLayer } = this.state;
        const style = this.getStyle();
        const { rules = [] } = style;
        return (
            <BorderLayout
                header={[
                    <div style={{ padding: 8, display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <Select
                                clearable={false}
                                value={selectedNamedLayer}
                                placeholder="Select style layer..."
                                options={(namedLayers || [])
                                    .map((namedLayer) => ({ value: namedLayer, label: namedLayer}))}/>
                        </div>
                        <div>
                            <Toolbar
                                btnDefaultProps={{
                                    className: 'square-button-md no-border'
                                }}
                                buttons={[
                                    {
                                        glyph: 'add-layer',
                                        tooltip: 'Add style layer'// ,
                                        // onClick: () => this.addRule()
                                    },
                                    {
                                        glyph: 'add-row-before',
                                        tooltip: 'Add rule',
                                        onClick: () => this.updateStylesState(this.addRule(style))
                                    }
                                ]}/>
                        </div>
                    </div>]}>
                    <RuleEditor
                        rules={rules}
                        onAdd={(ruleId, kind, initialParams) => {
                            const currentStyle = this.getStyle();
                            return this.updateStylesState(
                                this.addSymbolizer(currentStyle, ruleId, kind, initialParams)
                            );
                        }}
                        onChange={(values, ruleId, symbolizerId) => {
                            const currentStyle = this.getStyle();
                            const newStyle = this.updateStyle(currentStyle, values, ruleId, symbolizerId);
                            const newStyles = this.updateStylesState(newStyle);
                            writeStyle(newStyles, 'sld')
                                .then((code) => this.props.onChange(code))
                                .catch(() => {});
                        }}/>
            </BorderLayout>
        );
    }

    updateStylesState = (newStyle) => {
        const { styles = [], selectedNamedLayer } = this.state;
        const newStyles = styles.map((style = {}) =>
            style.name === selectedNamedLayer
                ? newStyle
                : style);
        this.setState({
            styles: newStyles
        });
        return newStyles;
    }

    parseStyle = (code) => {
        readStyle(code, 'sld')
            .then((styles) => {
                const namedLayers = (styles || []).map(({ name }) => name);
                this.setState({
                    namedLayers,
                    selectedNamedLayer: namedLayers[0]
                });
                this.setState({
                    styles: (styles || []).map((style) => this.addStyleIndices(style))
                });
            });
    }

    addStyleIndices = (style) => {
        const { rules = [], ...params } = style;
        return {
            ...params,
            rules: rules.map(rule => {
                const { symbolizers = [], ...ruleParams } = rule;
                return {
                    ...ruleParams,
                    ruleId: uuidv1(),
                    symbolizers: symbolizers.map(symbolizer => {
                        return {
                            ...symbolizer,
                            symbolizerId: uuidv1()
                        };
                    })
                };
            })
        };
    }

    updateStyle = (style = {}, values, selectedRuleId, selectedSymbolizerId) => {
        const { rules = [], ...params } = style;
        return {
            ...params,
            rules: rules.map(rule => {
                const { symbolizers = [], ruleId } = rule;
                if (ruleId !== selectedRuleId) return rule;

                if (selectedSymbolizerId === undefined) {
                    return {
                        ...rule,
                        ...values
                    };
                }

                return {
                    ...rule,
                    symbolizers: symbolizers.map(symbolizer => {
                        const { symbolizerId } = symbolizer;
                        if (selectedSymbolizerId !== symbolizerId) return symbolizer;
                        return {
                            ...symbolizer,
                            ...values
                        };
                    })
                };
            })
        };
    }

    addSymbolizer = (style = {}, selectedRuleId, kind, initialParams = {}) => {
        const { rules = [], ...params } = style;
        return {
            ...params,
            rules: rules.map(rule => {
                const { symbolizers = [], ruleId } = rule;
                if (ruleId !== selectedRuleId) return rule;
                return {
                    ...rule,
                    symbolizers: [ { ...initialParams, kind, symbolizerId: uuidv1() }, ...symbolizers ]
                };
            })
        };
    }

    addRule = (style = {}) => {
        const { rules = [], ...params } = style;
        return {
            ...params,
            rules: [{ ruleId: uuidv1() }, ...rules]
        };
    }
}

class VisualStyleEditor extends Component {
    static propTypes = {
        layer: PropTypes.object,
        layerName: PropTypes.string,
        code: PropTypes.string,
        onChange: PropTypes.func
    };

    static defaultProps = {
        onChange: () => {}
    };

    state = {
        visual: true
    };

    componentWillMount() {
        this.setState({
            code: this.props.code || SLD_EXAMPLE
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.code && newProps.code !== this.props.code) {
            this.setState({
                code: newProps.code
            });
        }
    }

    render() {
        const {
            code,
            visual,
            loading
        } = this.state;

        const {
            id,
            availableStyles = [],
            name: layerName,
            style
        } = this.props.layer || {};

        return (
            <Container layout>
                <BorderLayout
                    header={[
                        <div style={{ display: 'flex', padding: 8, borderBottom: '1px solid #ddd' }}>
                            <div style={{
                                flex: '1',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                                }}>
                                {layerName}
                            </div>
                            <div style={{ display: 'flex' }}>
                                {loading && <Loader size={17}/>}
                                <Glyphicon
                                    glyph="tasks"
                                    className={visual && 'text-primary'}
                                    style={{ padding: '0 8px'}}/>
                                <SwitchButton
                                        checked={!visual}
                                        onChange={() => {
                                            if (loading) return null;
                                            this.setState({ loading: true });
                                            return setTimeout(() => {
                                                this.setState({ visual: !visual, loading: false });
                                            }, 500);
                                        }}/>
                                <Glyphicon
                                    glyph="code"
                                    className={!visual && 'text-primary'}
                                    style={{ padding: '0 8px'}}/>
                            </div>
                        </div>,
                        <div style={{
                            padding: 8,
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: '1px solid #ddd'
                            }}>
                            <div style={{ flex: 1 }}>
                                <Select
                                    clearable={false}
                                    value={style || availableStyles[0]}
                                    placeholder="Select style..."
                                    onChange={({ value }) =>
                                        this.props.onChange(id, 'layers', { style: value })
                                    }
                                    options={availableStyles
                                        .map(({ name }) => ({
                                            value: name,
                                            label: name
                                        }))}/>
                            </div>
                            <div>
                                <Toolbar
                                    btnDefaultProps={{
                                        className: 'square-button-md no-border'
                                    }}
                                    buttons={[
                                        {
                                            glyph: 'trash',
                                            tooltip: 'Remove style'// ,
                                            // onClick: () => this.addRule()
                                        },
                                        {
                                            glyph: 'plus',
                                            tooltip: 'Create style'
                                        }
                                    ]}/>
                            </div>
                        </div>
                    ]}>
                    {visual
                        ? <Visual
                            id={layerName}
                            code={code}
                            onChange={(_code) => this.updateCode(_code)}/>
                        : <Editor
                            code={code}
                            onChange={(_code) => this.updateCode(_code)}
                            mode="xml"/>}
                </BorderLayout>
            </Container>
        );
    }

    updateCode = (styleBody) => {
        const {
            id,
            availableStyles = []
        } = this.props.layer || {};
        this.props.onChange(id, 'layers', {
            availableStyles: availableStyles.map((availableStyle) => {
                const { link } = availableStyle;
                if (link && link.type.indexOf('sld') === -1 ) return availableStyle;
                return {
                    ...availableStyle,
                    styleBody
                };
            })
        });
    }
}
import loadingState from '../components/misc/enhancers/loadingState';
const VisualStyleEditorEnhanced = loadingState(({ loading }) => loading)(VisualStyleEditor);

const TOCButton = connect(createSelector([
    state => get(state, 'controls.visualStyleEditor.enabled')
], (enabled) => ({
    enabled
})), {
    onToggle: setControlProperty.bind(null, 'visualStyleEditor', 'enabled', true)
})(({ status, enabled, onToggle, ...props }) => !enabled && status === 'LAYER'
    ? <Button {...props} onClick={() => onToggle()}>
        <Glyphicon glyph="dropper"/>
    </Button>
    : null);

import { getLayerCapabilities } from '../actions/layerCapabilities';
class TOCPanel extends React.Component {

    static propTypes = {
        enabled: PropTypes.string,
        selectedLayer: PropTypes.string,
        onChange: PropTypes.func,
        onClose: PropTypes.func
    };

    componentWillMount() {
        // this.props.onUpdateLayer(this.props.selectedLayer);
    }

    componentWillReceiveProps(newProps) {
        if (this.props.onClose && !newProps.selectedLayer.name && this.props.selectedLayer.name) {
            this.props.onClose();
        }

        if ((newProps.selectedLayer.name
        && newProps.selectedLayer.name !== this.props.selectedLayer.name
        && newProps.enabled)
        || newProps.enabled && !this.props.enabled) {
            // this.props.onUpdateLayer(newProps.selectedLayer);
        }
    }

    render() {
        const { enabled, selectedLayer = {}, onChange = () => {} } = this.props;
        const { availableStyles = [], style, name } = selectedLayer;
        const styleObj = style && head(availableStyles.filter(({ _name }) => _name === style))
            || head(availableStyles.filter(({ link }) => link && link.type.indexOf('sld') !== -1 ));

        return enabled
            ? <div
                style={{
                    position: 'relative',
                    width: 300,
                    transform: 'translate(0, 0)',
                    borderLeft: '1px solid #ddd'
                }}>
                <VisualStyleEditorEnhanced
                    loading={selectedLayer.capabilitiesLoading}
                    layerName={name}
                    layer={selectedLayer}
                    code={styleObj && styleObj.styleBody}
                    onChange={onChange}/>
            </div>
            : null;
    }
}
/* onChange(selectedLayer.id, 'layers', {
                            availableStyles: availableStyles.map((availableStyle) => {
                                const { link } = availableStyle;
                                if (link && link.type.indexOf('sld') === -1 ) return availableStyle;
                                return {
                                    ...availableStyle,
                                    styleBody
                                };
                            })
                        });*/
export const VisualStyleEditorPlugin = assign(VisualStyleEditor, {
    TOC: {
        priority: 1,
        tool: TOCButton,
        panel: connect(
            createSelector([
                state => get(state, 'controls.visualStyleEditor.enabled'),
                getUpdatedLayer
            ], (enabled, selectedLayer) => ({
                enabled,
                selectedLayer
            })),
            {
                onChange: updateNode,
                onClose: setControlProperty.bind(null, 'visualStyleEditor', 'enabled', false),
                onUpdateLayer: getLayerCapabilities
            }
        )(TOCPanel)
    }
});

export const reducers = {};
