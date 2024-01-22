
/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, InputGroup } from 'react-bootstrap';
import DebouncedFormControl from '../../../misc/DebouncedFormControl';
import Message from '../../../I18N/Message';

/**
 * ModelTransformation. This component shows the model transformation options available
 * @prop {object} layer the layer options
 * @prop {object} onChange callback on every on change event
 */
function ModelTransformation({
    layer,
    onChange
}) {
    if (layer?.type !== 'model') {
        return null;
    }
    return (
        <div style={{ margin: '0 -8px' }}>
            <FormGroup className="form-group-flex">
                <ControlLabel><Message msgId="layerProperties.latitude"/></ControlLabel>
                <InputGroup style={{ maxWidth: 120 }}>
                    <DebouncedFormControl
                        type="number"
                        name={"latitude"}
                        value={layer?.center?.[1] || 0}
                        fallbackValue={0}
                        onChange={(val)=> {
                            const newCenter = [
                                layer?.center?.[0] ?? 0,
                                val !== undefined
                                    ? parseFloat(val) : 0,
                                layer?.center?.[2] ?? 0
                            ];
                            onChange('center', newCenter);
                        }}
                    />
                    <InputGroup.Addon>m</InputGroup.Addon>
                </InputGroup>
            </FormGroup>
        </div>
    );
}

ModelTransformation.propTypes = {
    layer: PropTypes.object,
    onChange: PropTypes.func
};

ModelTransformation.defaultProps = {
    layer: {},
    onChange: () => {}
};

export default ModelTransformation;
