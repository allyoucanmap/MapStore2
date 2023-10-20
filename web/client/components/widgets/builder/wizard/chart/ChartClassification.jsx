/*
  * Copyright 2023, GeoSolutions Sas.
  * All rights reserved.
  *
  * This source code is licensed under the BSD-style license found in the
  * LICENSE file in the root directory of this source tree.
  */

import React, { useState } from 'react';
import chroma from 'chroma-js';
import uuid from 'uuid/v1';
import ColorSelector from '../../../../style/ColorSelector';
import DebouncedFormControl from '../../../../misc/DebouncedFormControl';
import { FormGroup, ControlLabel, InputGroup, Checkbox, Button, Glyphicon } from 'react-bootstrap';
import Select from "react-select";
import Message from "../../../../I18N/Message";
import ColorRamp from '../../../../styleeditor/ColorRamp';
import { ControlledPopover } from '../../../../styleeditor/Popover';
import multiProtocolChart from '../../../enhancers/multiProtocolChart';
import ThemeClassesEditor from '../../../../style/ThemaClassesEditor';
import { availableMethods } from '../../../../../api/GeoJSONClassification';
import { standardClassificationScales } from '../../../../../utils/ClassificationUtils';
import DisposablePopover from '../../../../misc/popover/DisposablePopover';
import withClassifyGeoJSONSync from '../../../../charts/withClassifyGeoJSONSync';
import HTML from '../../../../I18N/HTML';
import {
    generateClassifiedData,
    getAggregationAttributeDataKey,
    parsePieNoAggregationFunctionData
} from '../../../../../utils/WidgetsUtils';

const RAMP_PREVIEW_CLASSES = 5;

const rampOptions = standardClassificationScales
    .map((entry) => ({
        ...entry,
        colors: chroma.scale(entry.colors).colors(RAMP_PREVIEW_CLASSES)
    }));

const ComputeClassification = withClassifyGeoJSONSync(
    multiProtocolChart(({
        data,
        traces,
        chartType,
        classifyGeoJSONSync,
        onChangeStyle = () => {}
    }) => {
        const msClassification = traces?.[0]?.style?.msClassification || {};
        const groupByAttributesKey =  traces?.[0]?.options?.groupByAttributes;
        const classificationDataKey = traces?.[0]?.options?.classificationAttribute
            || groupByAttributesKey;
        const traceData = data?.[0] && parsePieNoAggregationFunctionData(data[0], {
            parse: traces?.[0]?.type === 'pie', // !hasAggregateFunction && !isNestedPieChart,
            labelDataKey: groupByAttributesKey,
            valueDataKey: getAggregationAttributeDataKey(traces?.[0]?.options)
        });
        const classes = msClassification?.classes;
        if (!classes && !(classifyGeoJSONSync && traceData && classificationDataKey)) {
            return null;
        }
        const { classes: computedClasses } = !classes ? generateClassifiedData({
            type: traces?.[0]?.type,
            sortBy: traces?.[0]?.sortBy,
            data: traceData,
            options: traces?.[0]?.options,
            msClassification,
            classifyGeoJSON: classifyGeoJSONSync,
            excludeOthers: true,
            applyCustomSortFunctionOnClasses: true
        }) : [];
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}><Message msgId="widgets.builder.wizard.classAttributes.classColor"/></div>
                    {msClassification.method === 'uniqueInterval' ?
                        <div style={{ flex: 1 }}><Message msgId="widgets.builder.wizard.classAttributes.classValue"/></div>
                        : <>
                            <div style={{ flex: 1 }}><Message msgId="widgets.builder.wizard.classAttributes.minValue"/></div>
                            <div style={{ flex: 1 }}><Message msgId="widgets.builder.wizard.classAttributes.maxValue"/></div>
                        </>}
                    <div style={{ flex: 1 }}>
                        <Message msgId="widgets.builder.wizard.classAttributes.classLabel"/>{' '}
                        <DisposablePopover
                            popoverClassName="chart-color-class-popover"
                            placement="top"
                            title={<Message msgId="widgets.builder.wizard.classAttributes.customLabels" />}
                            text={<HTML msgId={msClassification.method === 'uniqueInterval'
                                ? `widgets.builder.wizard.classAttributes.${chartType}ChartCustomLabelsExample`
                                : `widgets.builder.wizard.classAttributes.${chartType}RangeClassChartCustomLabelsExample`} />}
                        />
                    </div>
                    <Button
                        className="no-border"
                        disabled={!classes}
                        onClick={() => onChangeStyle('msClassification.classes', undefined)}
                    >
                        <Glyphicon glyph="trash" />
                    </Button>
                </div>
                <ThemeClassesEditor
                    classification={classes || (computedClasses || []).map(({ insideClass, index, label, ...entry }) => ({
                        ...entry,
                        id: uuid()
                    }))}
                    customLabels
                    onUpdateClasses={(newClasses) => onChangeStyle('msClassification.classes', newClasses)}
                />
            </>
        );
    })
);

const CustomClassification = ({
    traces,
    containerNode,
    disabled,
    placement,
    onChangeStyle = () => {}
}) => {
    const [open, setOpen] = useState();
    const msClassification = traces?.[0]?.style?.msClassification || {};
    const chartType = traces?.[0]?.type || '';
    return (
        <ControlledPopover
            open={open}
            onClick={() => setOpen(!open)}
            disabled={disabled}
            placement={placement}
            containerNode={containerNode}
            content={
                <div className="shadow-soft" style={{ width: 450, height: 400, background: '#ffffff', overflow: 'auto', padding: 8 }}>
                    <div className="ms-wizard-form-separator">
                        <Message msgId="widgets.builder.wizard.classAttributes.title" />
                        <Button
                            className="no-border square-button-md"
                            onClick={() => setOpen(false)}
                        >
                            <Glyphicon glyph="1-close"/>
                        </Button>
                    </div>
                    <FormGroup className="form-group-flex">
                        <ControlLabel><Message msgId={"widgets.builder.wizard.classAttributes.defaultColor"} /></ControlLabel>
                        <InputGroup>
                            <ColorSelector
                                format="rgb"
                                color={msClassification?.defaultColor || '#ffff00'}
                                onChangeColor={(color) => color && onChangeStyle('msClassification.defaultColor', color)}
                            />
                        </InputGroup>
                    </FormGroup>
                    <FormGroup className="form-group-flex">
                        <ControlLabel>
                            <Message msgId="widgets.builder.wizard.classAttributes.defaultClassLabel" />{' '}
                            <DisposablePopover
                                popoverClassName="chart-color-class-popover"
                                placement="top"
                                title={<Message msgId="widgets.builder.wizard.classAttributes.customLabels" />}
                                text={<HTML msgId={
                                    msClassification.method === 'uniqueInterval'
                                        ? `widgets.builder.wizard.classAttributes.${chartType}ChartCustomLabelsExample`
                                        : `widgets.builder.wizard.classAttributes.${chartType}RangeDefaultChartCustomLabelsExample`
                                } />}
                            />
                        </ControlLabel>
                        <InputGroup>
                            <DebouncedFormControl
                                value={msClassification?.defaultLabel || ''}
                                style={{ zIndex: 0 }}
                                onChange={eventValue => onChangeStyle('msClassification.defaultLabel', eventValue)}
                            />
                        </InputGroup>
                    </FormGroup>
                    <FormGroup className="form-group-flex">
                        <div style={{ width: '100%' }}>
                            {open && <ComputeClassification
                                traces={traces}
                                onChangeStyle={onChangeStyle}
                                chartType={chartType}
                            />}
                        </div>
                    </FormGroup>
                </div>
            }
        >
            <Button
                disabled={disabled}
                bsStyle={msClassification?.classes ? 'success' : 'primary'}
            >
                <Glyphicon glyph="pencil" />
            </Button>
        </ControlledPopover>
    );
};

const isCustomClassificationAvailable = (trace) => {
    const groupByAttributesKey =  trace?.options?.groupByAttributes;
    const aggregationAttributeDataKey = getAggregationAttributeDataKey(trace?.options);
    const classificationDataKey = trace?.options?.classificationAttribute
        || groupByAttributesKey;
    return groupByAttributesKey && groupByAttributesKey && aggregationAttributeDataKey
        && classificationDataKey;
};

const ChartClassification = ({
    data,
    onChangeStyle,
    onChange,
    options,
    traces,
    sortByOptions = [
        { value: 'groupBy', label: <Message msgId={`widgets.groupByAttributes.${data.type || "default"}`} /> },
        { value: 'aggregation', label: <Message msgId={`widgets.aggregationAttribute.${data.type || "default"}`} /> }
    ]
}) => {
    const {
        msClassification
    } = data.style || {};
    const classes = msClassification?.classes;
    const classesAvailable = !!classes;
    const classificationAttribute = data.type === 'pie'
        ? data?.options?.classificationAttribute || data?.options?.groupByAttributes
        : data?.options?.classificationAttribute;
    const selectedAttribute = options.find((option) => option.value === classificationAttribute);
    const { filter, ...trace } = data; // remove filter to compute complete classification
    const disableClassificationAttribute = traces && traces.length > 1;
    return (
        <>
            {!disableClassificationAttribute && <FormGroup className="form-group-flex">
                <ControlLabel>
                    <Message msgId="widgets.builder.wizard.classAttributes.classificationAttribute" />
                </ControlLabel>
                <InputGroup>
                    <Select
                        disabled={classesAvailable}
                        value={classificationAttribute}
                        options={options}
                        onChange={(option) => {
                            onChangeStyle('msClassification', {
                                intervals: 5,
                                ramp: 'viridis',
                                reverse: false,
                                ...msClassification,
                                method: option?.type === 'string'
                                    ? 'uniqueInterval'
                                    : selectedAttribute.type === 'string'
                                        ? 'jenks'
                                        : msClassification.method || 'jenks'
                            });
                            onChange('options.classificationAttribute', option?.value);
                        }}
                    />
                </InputGroup>
            </FormGroup>}
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.method'} /></ControlLabel>
                <InputGroup>
                    <Select
                        disabled={classesAvailable || selectedAttribute?.type === 'string'}
                        value={msClassification?.method}
                        clearable={false}
                        options={availableMethods.map((value) => ({
                            value,
                            label: <Message msgId={`styleeditor.${value}`} />
                        }))}
                        onChange={(option) => onChangeStyle('msClassification.method', option?.value)}
                    />
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel>Sort by</ControlLabel>
                <InputGroup>
                    <Select
                        disabled={classesAvailable}
                        value={data?.sortBy || (data.type === 'pie' ? 'aggregation' : 'groupBy')}
                        clearable={false}
                        options={sortByOptions}
                        onChange={(option) => onChange('sortBy', option?.value)}
                    />
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.colorRamp'} /></ControlLabel>
                <InputGroup>
                    <ColorRamp
                        disabled={classesAvailable}
                        items={classesAvailable ? [{
                            name: 'custom',
                            label: 'global.colors.custom',
                            colors: classes.map(({ color }) => color)
                        }] : rampOptions}
                        rampFunction={({ colors }) => colors}
                        samples={RAMP_PREVIEW_CLASSES}
                        value={{ name: classesAvailable ? 'custom' : msClassification?.ramp }}
                        onChange={ramp => onChangeStyle('msClassification.ramp', ramp.name)}
                    />
                    <InputGroup.Button>
                        <CustomClassification
                            traces={[trace]}
                            placement="right"
                            onChangeStyle={onChangeStyle}
                            onChange={onChange}
                            disabled={!isCustomClassificationAvailable(data)}
                        />
                    </InputGroup.Button>
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.intervals'} /></ControlLabel>
                <InputGroup style={{ maxWidth: 80 }}>
                    <DebouncedFormControl
                        type="number"
                        disabled={msClassification?.method === 'uniqueInterval' || classesAvailable}
                        value={msClassification?.intervals}
                        min={2}
                        max={25}
                        fallbackValue={5}
                        style={{ zIndex: 0 }}
                        onChange={eventValue => onChangeStyle('msClassification.intervals', eventValue)}
                    />
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <Checkbox
                    disabled={classesAvailable}
                    checked={!!msClassification?.reverse}
                    onChange={(event) => { onChangeStyle('msClassification.reverse', event?.target?.checked); }}
                >
                    Reverse oder of ramp colors
                </Checkbox>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.outlineColor'} /></ControlLabel>
                <InputGroup>
                    <ColorSelector
                        format="rgb"
                        color={data?.style?.marker?.line?.color}
                        line
                        onChangeColor={(color) => color && onChangeStyle('marker.line.color', color)}
                    />
                </InputGroup>
            </FormGroup>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId={'styleeditor.outlineWidth'} /></ControlLabel>
                <InputGroup style={{ maxWidth: 80 }}>
                    <DebouncedFormControl
                        type="number"
                        value={data?.style?.marker?.line?.width}
                        min={0}
                        fallbackValue={0}
                        style={{ zIndex: 0 }}
                        onChange={eventValue => onChangeStyle('marker.line.width', eventValue)}
                    />
                </InputGroup>
            </FormGroup>
        </>
    );
};

export default ChartClassification;
