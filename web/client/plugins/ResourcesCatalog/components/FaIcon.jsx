/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { loadFontAwesome } from '../../../utils/FontUtils';
import useIsMounted from '../hooks/useIsMounted';

function FaIcon({
    name,
    className,
    style
}) {
    const [loading, setLoading] = useState(true);
    const isMounted = useIsMounted();
    useEffect(() => {
        loadFontAwesome()
            .then(() => {
                isMounted(() => {
                    setLoading(false);
                });
            });
    }, []);
    if (loading) {
        return null;
    }
    return <i className={`fa fa-${name}${className ? ` ${className}` : ''}`} style={style}/>;
}

FaIcon.defaultProps = {};

export default FaIcon;
