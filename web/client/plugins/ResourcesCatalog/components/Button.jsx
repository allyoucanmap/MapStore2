/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { forwardRef } from 'react';
import { Button as ButtonRB } from 'react-bootstrap';

const Button = forwardRef(({
    children,
    variant,
    size,
    square,
    className,
    ...props
}, ref) => {
    return (
        <ButtonRB
            {...props}
            className={`${square ? `square-button-${square}` : ''}${className ? ` ${className}` : ''}`}
            ref={ref}
            bsStyle={variant}
            bsSize={size}
        >
            {children}
        </ButtonRB>
    );
});

export default Button;
