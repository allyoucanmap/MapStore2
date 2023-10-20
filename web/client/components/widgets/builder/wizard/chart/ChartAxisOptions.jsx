/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { isNil, castArray } from 'lodash';
import uuidv1 from "uuid/v1";
import Select from 'react-select';
import ColorSelector from '../../../../style/ColorSelector';
import { FormGroup, Radio, ControlLabel, InputGroup, Checkbox, Button, Glyphicon, FormControl } from 'react-bootstrap';
import ChartValueFormatting from './ChartValueFormatting';
import Message from '../../../../I18N/Message';

import InfoPopover from '../../../widget/InfoPopover';

import localizedProps from '../../../../misc/enhancers/localizedProps';
import DebouncedFormControl from '../../../../misc/DebouncedFormControl';

const AxisTypeSelect = localizedProps('options')(Select);

const AXIS_TYPES = [{
    value: '-',
    label: 'widgets.advanced.axisTypes.auto'
}, {
    value: 'linear',
    label: 'widgets.advanced.axisTypes.linear'
}, {
    value: 'category',
    label: 'widgets.advanced.axisTypes.category'
}, {
    value: 'log',
    label: 'widgets.advanced.axisTypes.log'
}, {
    value: 'date',
    label: 'widgets.advanced.axisTypes.date'
}];

const MAX_X_AXIS_LABELS = 200;
const getSelectedAxisId = ({
    axisKey,
    chart
}) => {
    const axisOpts = castArray(chart?.[`${axisKey}AxisOpts`] || { id: 0 });
    const selectedAxisId = chart[`${axisKey}axis`] || 0;
    return axisOpts.some(opts => opts.id === selectedAxisId) ? selectedAxisId : 0;
};

const AxisSelector = ({
    chart,
    onChange = () => {},
    onSelect = () => {},
    axisKey = 'x',
    selectedAxisId
}) => {
    const [editTitle, setEditTitle] = useState(false);
    const axisOptsKey = `${axisKey}AxisOpts`;
    const traceAxisKey = `${axisKey}axis`;
    const axisOpts = castArray(chart?.[axisOptsKey] || { id: 0 });
    const options = axisOpts.find(({ id }) => id === selectedAxisId);
    return (
        <FormGroup className="form-group-flex">
            <InputGroup>
                {editTitle
                    ? <DebouncedFormControl
                        value={options?.title || ''}
                        onChange={(value) => {
                            const newOptions = axisOpts
                                .map((axis) => axis.id === selectedAxisId ? { ...axis, title: value } : axis);
                            onChange(`charts[${chart?.chartId}].${axisOptsKey}`, newOptions);
                        }}
                    />
                    : <Select
                        clearable={false}
                        disabled={axisOpts.length === 1}
                        value={selectedAxisId}
                        options={axisOpts.map((axisOptions, idx) => ({
                            value: axisOptions.id,
                            label: `[ ${axisKey.toUpperCase()} ${idx} ] ${axisOptions.title || ''}`
                        }))}
                        onChange={(option) => {
                            onSelect(traceAxisKey, option?.value);
                        }}
                    />}
                <InputGroup.Button>
                    <Button
                        bsStyle="primary"
                        onClick={() => setEditTitle(!editTitle)}
                    >
                        <Glyphicon glyph={editTitle ? 'ok' : 'pencil'}/>
                    </Button>
                </InputGroup.Button>
                <InputGroup.Button>
                    <Button
                        bsStyle="primary"
                        disabled={axisOpts.length >= chart.traces.length}
                        onClick={() => {
                            const newAxis = { id: uuidv1() };
                            onChange(`charts[${chart?.chartId}].${axisOptsKey}`, [...axisOpts, newAxis]);
                            onSelect(traceAxisKey, newAxis.id);
                        }}
                    >
                        <Glyphicon glyph="plus"/>
                    </Button>
                </InputGroup.Button>
                <InputGroup.Button>
                    <Button
                        bsStyle="primary"
                        disabled={selectedAxisId === 0}
                        onClick={() => {
                            const newOptions = axisOpts.filter((axis) => axis.id !== selectedAxisId);
                            onChange(`charts[${chart?.chartId}].${axisOptsKey}`, newOptions);
                            onSelect(traceAxisKey, 0);
                        }}
                    >
                        <Glyphicon glyph="trash"/>
                    </Button>
                </InputGroup.Button>
            </InputGroup>
        </FormGroup>
    );
};

function AxisOptions({
    chart,
    chartPath,
    onChange,
    axisKey = 'y',
    sides = [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
    anchors = [{ value: 'y', label: 'Y' }, { value: 'free', label: 'Free' }],
    hideForceTicksOption,
    hideValueFormatting
}) {
    const axisOptsKey = `${axisKey}AxisOpts`;
    const axisOpts = castArray(chart?.[axisOptsKey] || { id: 0 });
    const selectedAxisId = getSelectedAxisId({
        axisKey,
        chart
    });
    const options = axisOpts.find(({ id }) => id === selectedAxisId);
    function handleChange(key, value) {
        const newOptions = axisOpts
            .map((axis) => axis.id === selectedAxisId ? { ...axis, [key]: value } : axis);
        onChange(`${chartPath}.${axisOptsKey}`, newOptions);
    }
    return (
        <>
            <div className="ms-wizard-form-separator">
                <Message msgId={`widgets.advanced.${axisKey}Axis`} />
                <AxisSelector
                    axisKey={axisKey}
                    chart={chart}
                    selectedAxisId={selectedAxisId}
                    onChange={onChange}
                    onSelect={(key, value) => {
                        onChange(`${chartPath}.${key}`, value);
                    }}
                />
            </div>
            <FormGroup className="form-group-flex">
                <ControlLabel>
                    <Message msgId={`widgets.advanced.${axisKey}AxisType`} />
                </ControlLabel>
                <InputGroup>
                    <AxisTypeSelect
                        value={options?.type || '-'}
                        disabled={!!options.hide}
                        options={AXIS_TYPES}
                        clearable={false}
                        onChange={(option) => {
                            handleChange('type', option?.value);
                        }}
                    />
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.color'} /></ControlLabel>
                <InputGroup>
                    <ColorSelector
                        disabled={!!options.hide}
                        format="rgb"
                        color={options?.color || '#000000'}
                        onChangeColor={(color) => color && handleChange('color', color)}
                    />
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.fontSize'} /></ControlLabel>
                <InputGroup style={{ maxWidth: 90 }}>
                    <DebouncedFormControl
                        type="number"
                        disabled={!!options.hide}
                        value={options.fontSize || 12}
                        min={1}
                        step={1}
                        fallbackValue={12}
                        onChange={(value) => {
                            handleChange('fontSize', value);
                        }}
                    />
                    <InputGroup.Addon>px</InputGroup.Addon>
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel>
                    Side
                </ControlLabel>
                <InputGroup>
                    {sides.map(side => (
                        <Radio
                            disabled={!!options.hide}
                            name={`${axisKey}-axis-side`}
                            id={side.id}
                            value={side.value}
                            checked={(options.side || sides[0].value) === side.value}
                            onChange={(event) => {
                                handleChange('side', event?.target?.value);
                            }}
                            inline>
                            <Message msgId={side.label}/>
                        </Radio>
                    ))}
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel>
                    Anchor
                </ControlLabel>
                <InputGroup style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    {anchors.map(side => (
                        <Radio
                            disabled={!!options.hide}
                            name={`${axisKey}-axis-anchor`}
                            id={side.id}
                            value={side.value}
                            checked={(options.anchor || anchors[0].value) === side.value}
                            onChange={(event) => {
                                handleChange('anchor', event?.target?.value);
                            }}
                            inline>
                            <Message msgId={side.label}/>
                        </Radio>
                    ))}
                    <DebouncedFormControl
                        type="number"
                        disabled={options.anchor !== 'free' || !!options.hide}
                        value={options.positionPx || 0}
                        min={0}
                        step={1}
                        fallbackValue={0}
                        style={{ maxWidth: 65, marginLeft: 'auto' }}
                        onChange={(value) => {
                            handleChange('positionPx', value);
                        }}
                    />
                    <InputGroup.Addon style={{ width: 'auto', lineHeight: 'normal' }}>
                        px
                    </InputGroup.Addon>
                </InputGroup>
            </FormGroup>
            {!hideForceTicksOption && <FormGroup className="form-group-flex" style={{ marginBottom: 0 }}>
                <Checkbox
                    disabled={options?.hide ?? false}
                    checked={!!options?.nTicks}
                    onChange={(event) => { handleChange('nTicks', event?.target?.checked ? MAX_X_AXIS_LABELS : undefined); }}
                >
                    <Message msgId="widgets.advanced.forceTicks" /> {' '}
                    {!(options?.hide ?? false) && <InfoPopover bsStyle="info" text={<Message msgId="widgets.advanced.maxXAxisLabels" msgParams={{ max: MAX_X_AXIS_LABELS }} />} />}
                </Checkbox>
            </FormGroup>}
            <FormGroup className="form-group-flex"  style={{ marginBottom: 0 }}>
                <Checkbox
                    disabled={options?.hide ?? false}
                    checked={options.angle !== undefined}
                    onChange={(event) => { handleChange('angle', !event?.target?.checked ? undefined : 0); }}
                    style={{ flex: 'unset', marginRight: 8 }}
                >
                    <Message msgId="widgets.advanced.xAxisAngle" />
                </Checkbox>
                <InputGroup style={{ maxWidth: 80 }}>
                    {options.angle !== undefined
                        ? <DebouncedFormControl
                            type="number"
                            min={-90}
                            max={90}
                            fallbackValue={0}
                            disabled={!!options?.hide}
                            value={!isNil(options.angle) ? options.angle : 0}
                            onChange={(value) => handleChange('angle', parseInt(value || 0, 10))}
                        />
                        : <FormControl disabled value={'Auto'} />}
                    <InputGroup.Addon>°</InputGroup.Addon>
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <Checkbox
                    checked={options?.hide ?? false}
                    onChange={(event) => { handleChange('hide', event?.target?.checked); }}
                >
                    <Message msgId="widgets.advanced.hideLabels" />
                </Checkbox>
            </FormGroup>
            {!hideValueFormatting && <ChartValueFormatting
                title={<Message msgId={`widgets.advanced.${axisKey}AxisValueFormatting`} />}
                options={options}
                hideFormula
                onChange={handleChange}
            />}
        </>
    );
}

function ChartAxisOptions({
    data,
    onChange
}) {
    const selectedChart = (data?.charts || []).find((chart) => chart.chartId === data.selectedChartId);
    const chartPath = `charts[${selectedChart?.chartId}]`;
    return (
        <>
            <AxisOptions
                key={`y-axis-${selectedChart.chartId}`}
                chart={selectedChart}
                chartPath={chartPath}
                onChange={onChange}
                axisKey="y"
                sides={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]}
                anchors={[{ value: 'x', label: 'X' }, { value: 'free', label: 'Free' }]}
                hideForceTicksOption
                hideValueFormatting={false}
            />
            <AxisOptions
                key={`x-axis-${selectedChart.chartId}`}
                chart={selectedChart}
                chartPath={chartPath}
                onChange={onChange}
                axisKey="x"
                sides={[{ value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' }]}
                anchors={[{ value: 'y', label: 'Y' }, { value: 'free', label: 'Free' }]}
                hideForceTicksOption={false}
                hideValueFormatting
            />
        </>
    );
}

export default ChartAxisOptions;
