/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';

import { wizardHandlers } from '../../../misc/wizard/enhancers';
import WizardContainer from '../../../misc/wizard/WizardContainer';
import FlexBox from '../../../layout/FlexBox';
import { Tabs, Tab, FormGroup, InputGroup, Glyphicon, Button, ControlLabel, FormControl } from 'react-bootstrap';
import DebouncedFormControl from '../../../misc/DebouncedFormControl';
const Wizard = wizardHandlers(WizardContainer);
import Select from 'react-select';
import FilterView from '../../widget/FilterView';

export default ({
    onChange = () => { },
    onFinish = () => { },
    setPage = () => { },
    step = 0,
    editorData
} = {}) => {

    const [type, setType] = useState('categorize');
    return (
        <Wizard
            step={step}
            setPage={setPage}
            onFinish={onFinish}
            hideButtons>
            <FlexBox column gap="sm" classNames={['_padding-md']}>
                <FormGroup>
                    <ControlLabel>Title</ControlLabel>
                    <InputGroup  style={{ width: '100%' }}>
                        <FormControl placeholder="Enter title..." value={editorData.title || ''} style={{ width: '100%' }} onChange={(event) => onChange('title', event?.target?.value)}/>
                    </InputGroup>
                </FormGroup>
                <div style={{ border: '1px solid #ddd', height: 200, overflow: 'auto' }}><FilterView /></div>
                <FormGroup>
                    <InputGroup>
                        <FlexBox>
                            <FlexBox.Fill>
                                <Select
                                    value={'Sub regions'}
                                    options={[{
                                        value: 'Sub regions',
                                        label: 'Sub regions'
                                    }]}
                                    clearable={false}
                                />
                            </FlexBox.Fill>
                        </FlexBox>
                        <InputGroup.Button>
                            <Button
                                bsStyle="primary"
                                onClick={() => { }}
                            >
                                <Glyphicon glyph="pencil" />
                            </Button>
                        </InputGroup.Button>
                        <InputGroup.Button>
                            <Button
                                bsStyle="primary"
                                onClick={() => { }}
                            >
                                <Glyphicon glyph="plus" />
                            </Button>
                        </InputGroup.Button>
                        <InputGroup.Button>
                            <Button
                                bsStyle="primary"
                                onClick={() => { }}
                            >
                                <Glyphicon glyph="trash" />
                            </Button>
                        </InputGroup.Button>
                    </InputGroup>
                </FormGroup>
                <Tabs animation={false}>
                    <Tab key="data" eventKey="data" title="Data" >
                        <FlexBox column gap="sm" classNames={['_padding-tb-md']}>
                            <FormGroup className="form-group-flex">
                                <ControlLabel>Type</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <Select
                                        value={type}
                                        options={[{
                                            value: 'categorize',
                                            label: 'Category'
                                        }, {
                                            value: 'single-filter',
                                            label: 'Single filter'
                                        }]}
                                        clearable={false}
                                        onChange={(event) => setType(event.value)}
                                    />
                                </InputGroup>
                            </FormGroup>
                            {type === 'categorize' ? <FormGroup className="form-group-flex">
                                <ControlLabel>Categories from</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <Select
                                        value="grouped"
                                        options={[{
                                            value: 'defined',
                                            label: 'Defined values'
                                        }, {
                                            value: 'features',
                                            label: 'Features'
                                        }, {
                                            value: 'grouped',
                                            label: 'Grouped values'
                                        }]}
                                    />
                                </InputGroup>
                            </FormGroup> : null}
                            <FormGroup className="form-group-flex">
                                <ControlLabel>Layer</ControlLabel>
                                <InputGroup style={{ zIndex: 0 }}>
                                    <FormControl
                                        placeholder="Select layer..."
                                        defaultValue="States of US"
                                    // value={data?.layer?.title || data?.layer?.name} disabled
                                    />
                                    <InputGroup.Button>
                                        <Button
                                            bsStyle={'primary'}
                                        >
                                            <Glyphicon glyph="filter" />
                                        </Button>
                                    </InputGroup.Button>
                                    <InputGroup.Button>
                                        <Button
                                            bsStyle={'primary'}
                                        >
                                            <Glyphicon glyph="cog" />
                                        </Button>
                                    </InputGroup.Button>
                                </InputGroup>
                            </FormGroup>
                            {type === 'categorize' ? <FormGroup className="form-group-flex">
                                <ControlLabel>Grouped by</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <Select
                                        value="SUB_REGION"
                                        options={[{ value: 'SUB_REGION', label: 'SUB_REGION' }]}
                                    />
                                </InputGroup>
                            </FormGroup> : null}
                            {type === 'categorize' ? <FormGroup className="form-group-flex">
                                <ControlLabel>Sort by</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <Select
                                        value="SUB_REGION"
                                        options={[{ value: 'SUB_REGION', label: 'SUB_REGION' }]}
                                    />
                                </InputGroup>
                            </FormGroup> : null}
                            {/* type === 'categorize' ? <FormGroup className="form-group-flex">
                                <ControlLabel>Maximum categories</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <FormControl value={10} type="number" style={{ width: 60 }}/>
                                </InputGroup>
                            </FormGroup> : null */}
                        </FlexBox>
                    </Tab>
                    <Tab key="layout" eventKey="layout" title="Layout">
                        <FlexBox column gap="sm" classNames={['_padding-tb-md']}>
                            <FormGroup className="form-group-flex">
                                <ControlLabel>Label</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <FormControl/>
                                </InputGroup>
                            </FormGroup>
                            <FormGroup className="form-group-flex">
                                <ControlLabel>Icon</ControlLabel>
                                <InputGroup style={{ zIndex: 1 }}>
                                    <FormControl/>
                                </InputGroup>
                            </FormGroup>
                        </FlexBox>
                    </Tab>
                    <Tab key="actions" eventKey="actions" title="Actions" >
                        <FlexBox column gap="sm" classNames={['_padding-tb-md']}>
                            Actions
                        </FlexBox>
                    </Tab>
                </Tabs>

            </FlexBox>
        </Wizard>
    );
};


