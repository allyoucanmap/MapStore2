/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useEffect, useRef, useState} from "react";
import uuid from "uuid";
import { getConfigProp } from '../utils/ConfigUtils';

const defaultCreateHead = (doc, windowTitle) => {
    doc.head.innerHTML = document.head.innerHTML;
    let title = doc.querySelector('title');
    if (!title) {
        title = doc.createElement("title");
        doc.head.appendChild(title);
        title.appendChild(doc.createTextNode(windowTitle));
    } else {
        title.appendChild(doc.createTextNode(` | ${windowTitle}`));
    }
};

const useOpenWindow = ({
    active,
    left = 0,
    top = 0,
    width = 500,
    height = 500,
    title = "",
    target = "",
    onLoad,
    onBeforeUnload,
    createHead = defaultCreateHead
}) => {

    const container = useRef();
    const openWindow = useRef();
    const [version, setVersion] = useState();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        function closeOnMainWindowRefresh() {
            openWindow.current.close();
            openWindow.current = null;
            container.current = null;
        }
        function init() {
            if (!container.current) {
                container.current = document.createElement("div");
                container.current.classList.add("fill");
                openWindow.current.document.body.classList.add(getConfigProp('themePrefix') || 'ms2');
                openWindow.current.document.body.setAttribute('data-ms2-container', 'ms2');
                openWindow.current.document.body.appendChild(container.current);
                setVersion(uuid());
                if (onLoad) {
                    onLoad(openWindow.current);
                }
            }
        }
        window.addEventListener("beforeunload", closeOnMainWindowRefresh);
        if (active) {
            setLoading(true);
            openWindow.current = window.open('window.html', target, `left=${window.screenX + left},top=${window.screenY + top},width=${width},height=${height}`);
            if (openWindow.current) {
                openWindow.current.addEventListener("load", () => {
                    createHead(openWindow.current.document, title);
                    init();
                    setLoading(false);
                });
                openWindow.current.addEventListener("beforeunload", () => {
                    if (onBeforeUnload) {
                        onBeforeUnload();
                    }
                }, false);
            } else {
                setLoading(false);
            }
        }
        return () => {
            window.removeEventListener("beforeunload", closeOnMainWindowRefresh);
            if (openWindow.current) {
                openWindow.current.close();
                openWindow.current = null;
                container.current = null;
            }
            setVersion();
        };
    }, [active]);
    return {
        loading,
        version,
        container,
        openWindow
    };
};

export default useOpenWindow;
