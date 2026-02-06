/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import PropTypes from "prop-types";
import {createPortal} from "react-dom";
import useOpenWindow from "../../hooks/useOpenWindow";
import { DocumentContext } from "../../contexts/DocumentContext";

const PopOut = ({
    active,
    children,
    height = 500,
    left = 0,
    target = "",
    title = "",
    top = 0,
    width = 500,
    onClose,
    onOpen
}) => {

    const { container, openWindow, loading } = useOpenWindow({
        active,
        left,
        top,
        width,
        height,
        title,
        target,
        onBeforeUnload: onClose,
        onLoad: onOpen
    });

    if (!children || loading) {
        return null;
    }

    if (active && container?.current) {
        return createPortal(
            <DocumentContext.Provider value={openWindow?.current?.document}>
                {children}
            </DocumentContext.Provider>, container.current
        );
    }
    return (<>{children}</>);
};

PopOut.contextTypes = {
    messages: PropTypes.object
};
PopOut.propTypes = {
    active: PropTypes.bool,
    height: PropTypes.number,
    left: PropTypes.number,
    target: PropTypes.string,
    title: PropTypes.string,
    top: PropTypes.number,
    width: PropTypes.number,
    onClose: PropTypes.func,
    onOpen: PropTypes.func
};

export default PopOut;
