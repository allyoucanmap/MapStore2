/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { connect } from '../../utils/PluginsUtils';
import AnnotationsEditorComp from '../../components/mapcontrols/annotations/AnnotationsEditor';
import {
    cancelRemoveAnnotation,
    confirmRemoveAnnotation,
    editAnnotation,
    removeAnnotation,
    cancelEditAnnotation,
    saveAnnotation,
    toggleAdd,
    validationError,
    removeAnnotationGeometry,
    toggleStyle,
    setStyle,
    restoreStyle,
    highlight,
    cleanHighlight,
    cancelShowAnnotation,
    cancelCloseAnnotations,
    confirmCloseAnnotations,
    startDrawing,
    setUnsavedChanges,
    toggleUnsavedChangesModal,
    changedProperties,
    setUnsavedStyle,
    toggleUnsavedStyleModal,
    addText,
    download,
    changeSelected,
    resetCoordEditor,
    changeRadius,
    changeText,
    toggleUnsavedGeometryModal,
    addNewFeature,
    setInvalidSelected,
    highlightPoint,
    confirmDeleteFeature,
    toggleDeleteFtModal,
    changeFormat,
    openEditor,
    updateSymbols,
    setErrorSymbol,
    changeGeometryTitle,
    filterMarker,
    toggleShowAgain,
    hideMeasureWarning,
    initPlugin,
    geometryHighlight,
    unSelectFeature
} from '../../actions/annotations';

import { selectFeatures } from '../../actions/draw';
import { setAnnotationMeasurement } from '../../actions/measurement';
import { zoomToExtent } from '../../actions/map';
import { annotationsInfoSelector } from '../../selectors/annotations';

const commonEditorActions = {
    onUpdateSymbols: updateSymbols,
    onSetErrorSymbol: setErrorSymbol,
    onEdit: editAnnotation,
    onCancelEdit: cancelEditAnnotation,
    onChangeFormat: changeFormat,
    onConfirmDeleteFeature: confirmDeleteFeature,
    onCleanHighlight: cleanHighlight,
    onHighlightPoint: highlightPoint,
    onHighlight: highlight,
    onError: validationError,
    onSave: saveAnnotation,
    onRemove: removeAnnotation,
    onAddGeometry: toggleAdd,
    onAddText: addText,
    onSetUnsavedChanges: setUnsavedChanges,
    onSetUnsavedStyle: setUnsavedStyle,
    onChangeProperties: changedProperties,
    onToggleDeleteFtModal: toggleDeleteFtModal,
    onToggleUnsavedChangesModal: toggleUnsavedChangesModal,
    onToggleUnsavedGeometryModal: toggleUnsavedGeometryModal,
    onToggleUnsavedStyleModal: toggleUnsavedStyleModal,
    onAddNewFeature: addNewFeature,
    onResetCoordEditor: resetCoordEditor,
    onStyleGeometry: toggleStyle,
    onCancelStyle: restoreStyle,
    onChangeSelected: changeSelected,
    onSaveStyle: toggleStyle,
    onSetStyle: setStyle,
    onStartDrawing: startDrawing,
    onDeleteGeometry: removeAnnotationGeometry,
    onZoom: zoomToExtent,
    onSelectFeature: selectFeatures,
    onChangeRadius: changeRadius,
    onSetInvalidSelected: setInvalidSelected,
    onChangeText: changeText,
    onChangeGeometryTitle: changeGeometryTitle,
    onCancelRemove: cancelRemoveAnnotation,
    onCancelClose: cancelCloseAnnotations,
    onConfirmClose: confirmCloseAnnotations,
    onConfirmRemove: confirmRemoveAnnotation,
    onDownload: download,
    onFilterMarker: filterMarker,
    onGeometryHighlight: geometryHighlight,
    onSetAnnotationMeasurement: setAnnotationMeasurement,
    onHideMeasureWarning: hideMeasureWarning,
    onToggleShowAgain: toggleShowAgain,
    onInitPlugin: initPlugin,
    onUnSelectFeature: unSelectFeature
};

export const AnnotationsInfoViewer = connect(annotationsInfoSelector,
    {
        ...commonEditorActions,
        onEdit: openEditor
    })(AnnotationsEditorComp);

const AnnotationsEditor = connect(annotationsInfoSelector,
    {
        onCancel: cancelShowAnnotation,
        ...commonEditorActions
    })(AnnotationsEditorComp);

export default AnnotationsEditor;
