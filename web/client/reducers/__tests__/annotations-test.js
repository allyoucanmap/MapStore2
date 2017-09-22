/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const expect = require('expect');
const annotations = require('../annotations');

const {
    REMOVE_ANNOTATION, CONFIRM_REMOVE_ANNOTATION, CANCEL_REMOVE_ANNOTATION,
    EDIT_ANNOTATION, CANCEL_EDIT_ANNOTATION, SAVE_ANNOTATION, TOGGLE_ADD,
    UPDATE_ANNOTATION_GEOMETRY, VALIDATION_ERROR, REMOVE_ANNOTATION_GEOMETRY
 } = require('../../actions/annotations');

describe('Test the annotations reducer', () => {
    it('default states annotations', () => {
        const state = annotations(undefined, {type: 'default'});
        expect(state.validationErrors).toExist();
    });

    it('remove annotation', () => {
        const state = annotations({}, {
            type: REMOVE_ANNOTATION,
            id: '1'
        });
        expect(state.removing).toBe('1');
    });

    it('confirm remove annotation', () => {
        const state = annotations({removing: '1'}, {
            type: CONFIRM_REMOVE_ANNOTATION,
            id: '1'
        });
        expect(state.removing).toNotExist();
    });

    it('confirm remove annotation geometry', () => {
        const state = annotations({
            removing: '1',
            editing: {
                geometry: {}
            }
        }, {
            type: CONFIRM_REMOVE_ANNOTATION,
            id: '1'
        });
        expect(state.removing).toNotExist();
        expect(state.editing).toExist();
        expect(state.editing.geometry).toNotExist();
    });

    it('cancel remove annotation', () => {
        const state = annotations({removing: '1'}, {
            type: CANCEL_REMOVE_ANNOTATION
        });
        expect(state.removing).toNotExist();
    });

    it('edit annotation', () => {
        const state = annotations({}, {
            type: EDIT_ANNOTATION,
            feature: {
                properties: {
                    id: '1'
                }
            }
        });
        expect(state.editing).toExist();
        expect(state.editing.properties.id).toBe('1');
    });

    it('cancel edit annotation', () => {
        const state = annotations({editing: {
            properties: {
                id: '1'
            }
        }}, {
            type: CANCEL_EDIT_ANNOTATION
        });
        expect(state.editing).toNotExist();
        expect(state.drawing).toNotExist();
    });

    it('save annotation', () => {
        const state = annotations({editing: {
            properties: {
                id: '1'
            }
        }, drawing: true, validationErrors: {'title': 'mytitle'}}, {
            type: SAVE_ANNOTATION
        });
        expect(state.editing).toNotExist();
        expect(state.drawing).toNotExist();
        expect(state.validationErrors.title).toNotExist();
    });

    it('toggle add', () => {
        let state = annotations({drawing: false}, {
            type: TOGGLE_ADD
        });
        expect(state.drawing).toBe(true);
        state = annotations({drawing: true}, {
            type: TOGGLE_ADD
        });
        expect(state.drawing).toBe(false);
    });

    it('update annotation geometry', () => {
        const state = annotations({editing: {
            properties: {
                id: '1'
            },
            geometry: null
        }}, {
            type: UPDATE_ANNOTATION_GEOMETRY,
            geometry: {}
        });
        expect(state.editing.geometry).toExist();
    });

    it('validate error', () => {
        const state = annotations({validationErrors: {}}, {
            type: VALIDATION_ERROR,
            errors: {
                'title': 'myerror'
            }
        });
        expect(state.validationErrors.title).toBe('myerror');
    });

    it('remove annotation geometry', () => {
        const state = annotations({removing: null}, {
            type: REMOVE_ANNOTATION_GEOMETRY
        });
        expect(state.removing).toBe('geometry');
    });
});
