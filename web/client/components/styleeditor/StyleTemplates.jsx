/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { head } = require('lodash');
const { Form, FormGroup, FormControl, ControlLabel, Alert } = require('react-bootstrap');

const BorderLayout = require('../layout/BorderLayout');
const emptyState = require('../misc/enhancers/emptyState');
const SideGrid = emptyState(({items}) => items.length === 0)(require('../misc/cardgrids/SideGrid'));
const SquareCard = require('../misc/cardgrids/SquareCard');
const Filter = require('../misc/Filter');
const ResizableModal = require('../misc/ResizableModal');

const validateAlphaNumeric = ({title, _abstract}) => {
    const validTitle = title && title.match(/^[a-zA-Z0-9\s]*$/) !== null;
    return validTitle && !_abstract || validTitle && _abstract && _abstract.match(/^[a-zA-Z0-9\s]*$/) !== null;
};

const StyleTemplates = ({
    selectedStyle,
    add,
    styleSettings = {},
    geometryType = '',
    templates = [],
    onSelect = () => {},
    onClose = () => {},
    onSave = () => {},
    onUpdate = () => {},
    filterText,
    onFilter = () => {}
}) => (
        <BorderLayout
            header={
                <div>
                    <Filter
                        filterPlaceholder="Filter templates by title..."
                        filterText={filterText}
                        onFilter={onFilter}/>
                    <div className="text-center">
                        <small>Create a style from template</small>
                    </div>
                </div>
            }>
            <SideGrid
                colProps={{}}
                cardComponent={SquareCard}
                onItemClick={({
                    code,
                    styleId: templateId,
                    format
                }) => {
                    onSelect({
                        code,
                        templateId,
                        format: format || 'css'
                    });

                    onUpdate({...styleSettings, title: head(templates.filter(({styleId}) => styleId === templateId).map(({title}) => title))});
                }}
                items={templates
                    .filter(({title}) => !filterText || filterText && title.indexOf(filterText) !== -1)
                    .filter(({types}) => !types || head(types.filter(type => type === geometryType)))
                    .map(styleTemplate => ({ ...styleTemplate, selected: styleTemplate.styleId === selectedStyle }))}/>
            <ResizableModal
                show={!!add}
                fitContent
                onClose={() => onClose()}
                buttons={[
                    {
                        text: 'Save',
                        bsStyle: 'primary',
                        disabled: !validateAlphaNumeric(styleSettings),
                        onClick: () => onSave(styleSettings)
                    }
                ]}>
                <Form>
                    <FormGroup controlId="styleTitle" validationState={!validateAlphaNumeric(styleSettings) && 'error'}>
                        <ControlLabel>Title</ControlLabel>
                        <FormControl
                            type="text"
                            defaultValue={styleSettings.title}
                            placeholder="Enter style title"
                            onChange={event => onUpdate({...styleSettings, title: event.target.value})}/>
                        <ControlLabel>Abstract</ControlLabel>
                        <FormControl
                            type="text"
                            placeholder="Enter style abstract"
                            onChange={event => onUpdate({...styleSettings, _abstract: event.target.value})}/>
                    </FormGroup>
                    {!validateAlphaNumeric(styleSettings) && <Alert style={{margin: 0}} bsStyle="danger">
                        <div>Title is required!</div>
                        <div>Title and abstract must be alphanumeric value.</div>
                    </Alert>}
                </Form>
            </ResizableModal>
        </BorderLayout>
    );

module.exports = StyleTemplates;
