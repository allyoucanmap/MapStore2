/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Format from '../common/Format';
import Formula from '../common/Formula';

function ChartValueFormatting({
    title,
    options,
    onChange = () => {},
    hideFormula
}) {
    return (
        <>
            {title && <div className="ms-wizard-form-separator">
                {title}
            </div>}
            <Format
                data={{ options }}
                prefix="options"
                onChange={(key, value) => {
                    onChange(key.replace('options.', ''), value);
                }}
            />
            {!hideFormula && <Formula
                data={options}
                onChange={(key, value) => onChange(key, value)}
            />}
        </>
    );
}

export default ChartValueFormatting;
