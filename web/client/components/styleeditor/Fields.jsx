/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState } from 'react';
import { FormGroup, FormControl as FormControlRB, Button as ButtonRB  } from 'react-bootstrap';
import isObject from 'lodash/isObject';
import omit from 'lodash/omit';
import isNil from 'lodash/isNil';
import isNaN from 'lodash/isNaN';
import Toolbar from '../misc/toolbar/Toolbar';
import ColorSelector from '../style/ColorSelector';
import tooltip from '../misc/enhancers/tooltip';
import Slider from '../misc/Slider';
import Popover from '../misc/Popover';
import ColorRamp from './ColorRamp';
import DashArray from '../style/vector/DashArray';
import ThemaClassesEditor from '../style/ThemaClassesEditor';
import Message from '../I18N/Message';
import SVGPreview from './SVGPreview';
import Select from 'react-select';
import wellKnownNames from './config/weelKnowNames';
import localizedProps from '../misc/enhancers/localizedProps';

const Button = tooltip(ButtonRB);

const FormControl = localizedProps('placeholder')(FormControlRB);
const ReactSelect = localizedProps(['placeholder', 'noResultsText'])(Select);

const ReactSelectCreatable = localizedProps(['placeholder', 'noResultsText'])(Select.Creatable);

function MarkSelector({
    value,
    config = {},
    onChange = () => {}
}) {
    const { options = wellKnownNames } = config;
    const selected = options.find(option => option.value === value);
    return (
        <Popover
            content={
                <div className="ms-mark-list">
                    <ul>
                        {options.map((option) => {
                            return (
                                <li
                                    key={option.value}>
                                    <Button
                                        className="ms-mark-preview"
                                        active={option.value === value}
                                        onClick={() => onChange(option.value)}>
                                        <SVGPreview {...option.preview}/>
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            }>
            <Button className="ms-mark-preview">
                {selected && <SVGPreview {...selected.preview}/>}
            </Button>
        </Popover>
    );
}

export function Field({ children, label, tools, divider, invalid }) {

    if (divider) {
        return <div className="ms-symbolizer-field-divider"></div>;
    }
    const validationClassName = invalid ? ' ms-symbolizer-value-invalid' : '';
    return (
        <div
            className="ms-symbolizer-field">
            <div className="ms-symbolizer-label"><Message msgId={label} /></div>
            <div className={'ms-symbolizer-value' + validationClassName}>
                {children}
                <div className="ms-symbolizer-tools">
                    {tools}
                </div>
            </div>
        </div>
    );
}


function Band({
    label = 'styleeditor.band',
    value,
    bands,
    onChange,
    enhancementType
}) {
    return (
        <>
        <Field
            label={label}>
            <Select
                clearable={false}
                options={bands}
                value={value}
                onChange={option => onChange('band', option.value)}
            />
        </Field>
        <Field
            label="styleeditor.contrastEnhancement">
            <Select
                clearable={false}
                options={[
                    {
                        label: <Message msgId="styleeditor.none" />,
                        value: 'none'
                    },
                    {
                        label: <Message msgId="styleeditor.normalize" />,
                        value: 'normalize'
                    },
                    {
                        label: <Message msgId="styleeditor.histogram" />,
                        value: 'histogram'
                    }
                ]}
                value={enhancementType || 'none'}
                onChange={option => {
                    const newEnhancementType = option.value === 'none'
                        ? undefined
                        : option.value;
                    onChange('enhancementType', newEnhancementType);
                }}
            />
        </Field>
        </>
    );
}

export const fields = {
    color: ({
        label,
        config = {},
        value,
        onChange = () => {},
        disableAlpha
    }) => {

        // needed for slider
        // slider use component should update so value inside onChange was never update
        // with a ref we can get the latest update value
        const state = useRef({ value });
        state.current = {
            value
        };

        const key = isObject(value) && value.kind
            ? 'pattern'
            : 'solid';

        if (key === 'pattern') {
            const { params = {} } = config?.getGroupParams(value.kind) || {};
            const blockConfig = config?.getGroupConfig(value.kind) || {};
            const properties = value;
            return (
                <>
                <Fields
                    properties={properties}
                    params={blockConfig.omittedKeys ? omit(params, blockConfig.omittedKeys) : params}
                    config={{
                        disableAlpha: blockConfig.disableAlpha
                    }}
                    onChange={(values) => onChange({ ...state.current.value, ...values })}
                />
                <Field divider/>
                </>
            );
        }

        return (
            <Field
                label={label}>
                <ColorSelector
                    color={value}
                    line={config.stroke}
                    disableAlpha={config.disableAlpha || disableAlpha}
                    onChangeColor={(color) => color && onChange(color)}/>
            </Field>
        );
    },
    slider: ({ label, value, config = {}, onChange = () => {} }) => (
        <Field label={label}>
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
        </Field>
    ),
    input: ({ label, value, config = {}, onChange = () => {} }) => {
        return (
            <Field
                label={label}>
                <FormGroup>
                    <FormControl
                        type={config.type || 'text'}
                        value={value}
                        placeholder="styleeditor.placeholderInput"
                        onChange={event => onChange(event.target.value)}/>
                </FormGroup>
            </Field>
        );
    },
    toolbar: ({ label, value, onChange = () => {}, config = {} }) => (
        <Field
            label={label}>
            <Toolbar
                btnDefaultProps={{
                    className: 'no-border',
                    bsSize: 'xs'
                }}
                buttons={(config.options || [])
                    .map(({ glyph, label: optionLabel, labelId: optionLabelId, tooltipId, value: optionValue }) => ({
                        glyph,
                        tooltipId,
                        text: optionLabelId ? <Message msgId={optionLabelId} /> : optionLabel,
                        active: optionValue === value ? true : false,
                        onClick: () => onChange(value === optionValue ? undefined : optionValue)
                    }))}/>
        </Field>
    ),
    mark: ({ label, ...props }) => (
        <Field
            label={label}>
            <MarkSelector { ...props }/>
        </Field>
    ),
    image: ({
        label,
        value,
        config: {
            isValid
        },
        onChange
    }) => {

        const valid = !isValid || isValid({ value });
        return (
            <Field
                label={label}
                invalid={!valid}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <FormGroup style={{ flex: 1 }}>
                        <FormControl
                            placeholder="styleeditor.placeholderEnterImageUrl"
                            value={value}
                            onChange={event => onChange(event.target.value)}/>
                    </FormGroup>
                    <img src={value} style={{ width: 28, height: 28, objectFit: 'contain' }}/>
                </div>
            </Field>
        );
    },
    select: ({
        label,
        value,
        config: {
            getOptions = () => [],
            selectProps = {},
            isValid
        },
        onChange,
        ...props
    }) => {
        const {
            creatable,
            clearable = false,
            multi
        } = selectProps;

        function updateOptions(options, newValue) {
            const optionsValues = options.map(option => option.value);
            const isMissing = newValue?.value && optionsValues.indexOf(newValue.value) === -1;
            return isMissing
                ? [ newValue, ...options]
                : options;
        }

        function initOptions(options) {
            if (!value) {
                return options;
            }
            return [{ value, label: value }].reduce(updateOptions, options);
        }

        const options = getOptions(props);

        const [newOptions, setNewOptions] = useState(initOptions(options));

        const SelectInput = creatable
            ? ReactSelectCreatable
            : ReactSelect;
        const valid = !isValid || isValid({ value });
        return (
            <Field
                label={label}
                invalid={!valid}>
                <SelectInput
                    clearable={clearable}
                    placeholder="styleeditor.selectPlaceholder"
                    noResultsText="styleeditor.noResultsSelectInput"
                    {...selectProps}
                    options={newOptions.map((option) => ({
                        ...option,
                        label: option.labelId
                            ? <Message msgId={option.labelId}/>
                            : option.label
                    }))}
                    value={value}
                    onChange={option => {
                        if (multi) {
                            return onChange(option.map((entry) => entry.value));
                        }
                        setNewOptions(updateOptions(newOptions, option));
                        return onChange(option.value);
                    }}
                />
            </Field>
        );
    },
    colorRamp: ({
        label,
        value,
        config: {
            samples = 5,
            getOptions = () => [],
            rampFunction = ({ colors }) => colors
        },
        onChange,
        ...props
    }) => {
        const options = getOptions(props);
        return (
            <Field
                label={label}>
                <ColorRamp
                    items={options}
                    rampFunction={rampFunction}
                    samples={samples}
                    value={{ name: value }}
                    onChange={ramp => onChange(ramp.name)}
                />
            </Field>
        );
    },
    colorMap: ({
        value,
        onChange
    }) => {
        return (
            <>
            <ThemaClassesEditor
                classification={value}
                onUpdateClasses={(classification) => onChange(classification)}
            />
            </>
        );
    },
    channel: ({
        value,
        onChange,
        bands = []
    }) => {

        const {
            channelSelection
        } = value;

        const channelSelectionType = !channelSelection
            ? 'auto'
            : channelSelection.grayChannel
                ? 'gray'
                : 'rgb';

        const bandOptions = bands.map((band) => ({
            label: band,
            value: band
        }));

        if (channelSelectionType === 'rgb') {

            return Object.keys(channelSelection)
                .map((channelKey) => {
                    const selectedBand = channelSelection[channelKey]?.sourceChannelName;
                    const contrastEnhancement = channelSelection[channelKey]?.contrastEnhancement;
                    return (
                        <>
                        <Band
                            key={channelKey}
                            value={selectedBand}
                            bands={bandOptions}
                            enhancementType={contrastEnhancement?.enhancementType || 'none'}
                            onChange={(key, newValue) => {
                                if (key === 'band') {
                                    return onChange({
                                        contrastEnhancement: {},
                                        channelSelection: {
                                            ...value.channelSelection,
                                            [channelKey]: {
                                                ...value.channelSelection[channelKey],
                                                sourceChannelName: newValue
                                            }
                                        }
                                    });
                                }
                                if (key === 'enhancementType') {
                                    return onChange({
                                        contrastEnhancement: {},
                                        channelSelection: {
                                            ...value.channelSelection,
                                            [channelKey]: {
                                                ...value.channelSelection[channelKey],
                                                contrastEnhancement: {
                                                    ...channelSelection[channelKey].contrastEnhancement,
                                                    enhancementType: newValue
                                                }
                                            }
                                        }
                                    });
                                }
                                return null;
                            }}
                        />
                        <Field key={channelKey + '-divider'} divider/>
                        </>
                    );
                });
        }
        const selectedBand = channelSelection?.grayChannel?.sourceChannelName === undefined
            ? 'auto'
            : channelSelection?.grayChannel?.sourceChannelName;

        const contrastEnhancement = channelSelectionType === 'auto'
            ? value.contrastEnhancement
            : channelSelection?.grayChannel?.contrastEnhancement;

        return (
            <Band
                value={selectedBand}
                bands={[
                    {
                        label: <Message msgId="styleeditor.channelAuto" />,
                        value: 'auto'
                    },
                    ...bandOptions
                ]}
                enhancementType={contrastEnhancement?.enhancementType || 'none'}
                onChange={(key, newValue) => {
                    if (key === 'band') {
                        return onChange(newValue === 'auto'
                            ? {
                                ...value,
                                channelSelection: undefined
                            }
                            : {
                                contrastEnhancement: {},
                                channelSelection: {
                                    grayChannel: {
                                        contrastEnhancement: {},
                                        ...channelSelection?.grayChannel,
                                        sourceChannelName: newValue
                                    }
                                }
                            });
                    }
                    if (key === 'enhancementType') {
                        return onChange(channelSelectionType === 'auto'
                            ? {
                                channelSelection: undefined,
                                contrastEnhancement: {
                                    ...value.contrastEnhancement,
                                    enhancementType: newValue
                                }
                            }
                            : {
                                contrastEnhancement: {},
                                channelSelection: Object.keys(channelSelection)
                                    .reduce((acc, channelKey) => {
                                        return {
                                            ...acc,
                                            [channelKey]: {
                                                ...channelSelection[channelKey],
                                                contrastEnhancement: {
                                                    ...channelSelection[channelKey].contrastEnhancement,
                                                    enhancementType: newValue
                                                }
                                            }
                                        };
                                    }, {})
                            });
                    }
                    return null;
                }}
            />
        );
    },
    dash: ({
        label,
        value,
        onChange,
        config: {
            options
        }
    }) => {
        return (
            <Field
                label={label}>
                <DashArray
                    dashArray={value}
                    onChange={onChange}
                    options={options}
                    defaultStrokeWidth={2}
                    isValidNewOption={(option) => {
                        if (option.label) {
                            return !option.label.split(' ')
                                .find((entry) => isNaN(parseFloat(entry)));
                        }
                        return false;
                    }}
                    creatable
                />
            </Field>
        );
    }
};


function Fields({
    properties,
    params,
    config: fieldsConfig,
    onChange
}) {

    // needed for slider
    // slider use component should update so value inside onChange was never update
    // with a ref we can get the latest update value
    const state = useRef({ properties });
    state.current = {
        properties
    };

    return <>
        {Object.keys(params)
            .map((keyParam) => {
                const { type, setValue, getValue, config, label, key: keyProperty } = params[keyParam] || {};
                const key = keyProperty || keyParam;
                const FieldComponent = fields[type];
                const value = setValue && setValue(properties[key], state.current.properties);
                return FieldComponent && <FieldComponent
                    {...fieldsConfig}
                    key={key}
                    label={label || key}
                    config={config}
                    value={!isNil(value) ? value : properties[key]}
                    onChange={(values) => onChange(getValue && getValue(values, state.current.properties) || values)}/>;
            })}
    </>;
}

export default Fields;

