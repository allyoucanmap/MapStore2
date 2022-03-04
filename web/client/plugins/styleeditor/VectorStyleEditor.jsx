
import React, { useEffect, useRef }  from 'react';
import isString from 'lodash/isString';
import { StyleEditor } from './StyleCodeEditor';
import TextareaEditor from '../../components/styleeditor/Editor';
import VisualStyleEditor from '../../components/styleeditor/VisualStyleEditor';
import { getEditorMode } from '../../utils/StyleEditorUtils';
/*
import {
    classificationRaster,
    classificationVector
} from '../../api/StyleEditor';


const styleUpdateTypes = {
    'classificationVector': classificationVector,
    'classificationRaster': classificationRaster,
    // support previous type
    'classification': classificationVector,
    'classification-raster': classificationRaster
};
*/

function getVectorLayerAttributes(layer) {
    if (layer?.properties) {
        return Object.keys(layer.properties)
            .map((key) => ({
                attribute: key,
                label: key,
                type: 'number'
            }));
    }
    return [];
}

const editors = {
    visual: VisualStyleEditor,
    textarea: TextareaEditor
};

function VectorStyleEditor({
    element,
    onUpdateNode
}) {

    const style = useRef();
    style.current = element?.style;

    useEffect(() => {
        if (!style.current?.body) {
            onUpdateNode(element?.id, 'layers', {
                style: {
                    format: 'tileset3d',
                    body: {},
                    metadata: {
                        editorType: 'visual'
                    }
                }
            });
        }
    }, [element.id]);

    const attributes = getVectorLayerAttributes(element);
    return (
        <StyleEditor
            canEdit
            code={style.current?.body}
            editorType={style.current?.metadata?.editorType || 'textarea'}
            editors={editors}
            format={style.current?.format}
            attributes={attributes.length > 0 ? attributes : undefined}
            mode={getEditorMode(style.current?.format)}
            geometryType={'3dtiles'}
            defaultStyleJSON={style.current?.metadata?.styleJSON ? JSON.parse(style.current.metadata.styleJSON) : null}
            onUpdateMetadata={(metadata) => {
                onUpdateNode(element?.id, 'layers', {
                    style: {
                        ...style.current,
                        metadata: {
                            ...style.current?.metadata,
                            ...metadata
                        }
                    }
                });
            }}
            onChange={(body) => {
                onUpdateNode(element?.id, 'layers', {
                    style: {
                        ...style.current,
                        body: isString(body) ? JSON.parse(body) : body
                    }
                });
            }}
        />
    );
}
export default VectorStyleEditor;
