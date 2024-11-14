/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from "react";
import uniq from 'lodash/uniq';
import isEmpty from 'lodash/isEmpty';
import PropTypes from "prop-types";

import Button from "./Button";
import Icon from "./Icon";
import useLocalStorage from "../hooks/useLocalStorage";
import Message from "../../../components/I18N/Message";
import Spinner from "./Spinner";
import useIsMounted from "../hooks/useIsMounted";
import useDeepCompareEffect from "../hooks/useDeepCompareEffect";

const AccordionTitle = ({
    expanded,
    onClick,
    loading,
    children
}) => {

    return (
        <div className="accordion-title" onClick={onClick}>
            <div className="accordion-title-label">
                {children}
                <Button onClick={onClick} style={{ display: 'block', width: 0, height: 0, overflow: 'hidden', opacity: 0, padding: 0, margin: 0 }}/>
            </div>
            {loading
                ? <Spinner/>
                : <Icon glyph={`caret-${expanded ? "down" : "left"}`}/>
            }
        </div>
    );
};

/**
 * Accordion component
 * @prop {string} title of the accordion
 * @prop {string} titleId translation path of the title on the accordion
 * @prop {string} noItemsMsgId default message when no items present
 * @prop {string} identifier string
 * @prop {function} content function to render child items
 * @prop {function} loadItems function to fetch accordion items
 * @prop {array} items accordion items available without the need to fetch
 * @prop {string} query string
 * @prop {boolean} defaultExpanded flag to expand the accordion on load by default
 * @prop {boolean} expanded flag to keep accordion stay expanded and disable toggle function on the accordion (Note: Not on accordion items)
 */
const Accordion = ({
    title,
    titleId,
    noItemsMsgId,
    identifier,
    content,
    loadItems,
    items,
    query
}) => {
    const isMounted = useIsMounted();

    const [accordionsExpanded, setAccordionsExpanded] = useLocalStorage('accordionsExpanded', []);
    const [accordionItems, setAccordionItems] = useState(items);
    const [loading, setLoading] = useState(false);

    const isExpanded = accordionsExpanded.includes(identifier);

    const onClick = () => {
        const expandedList = isExpanded
            ? accordionsExpanded.filter(accordionExpanded => accordionExpanded !== identifier)
            : uniq(accordionsExpanded.concat(identifier));
        setAccordionsExpanded(expandedList);
    };

    useDeepCompareEffect(() => {
        if (loadItems && typeof loadItems === 'function') {
            if (isExpanded && !loading) {
                setLoading(true);
                loadItems({ page_size: 999999 })
                    .then((response) => {
                        isMounted(() => setAccordionItems(response.items));
                    })
                    .finally(()=> isMounted(() => setLoading(false)));
            }
        }
    }, [isExpanded, query]);

    return (
        <div className={'ms-accordion'}>
            <AccordionTitle
                expanded={isExpanded}
                onClick={onClick}
                loading={loading}
            >
                {titleId ? <Message msgId={titleId}/> : title}
            </AccordionTitle>
            {isExpanded ? <div className="accordion-body">
                <div className={'accordion-items'}>
                    {loading ? null : !isEmpty(accordionItems)
                        ? content(accordionItems)
                        : !loading ? <Message msgId={noItemsMsgId}/> : null
                    }
                </div>
            </div> : null}
        </div>
    );
};

Accordion.propTypes = {
    title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    titleId: PropTypes.string,
    identifier: PropTypes.string,
    noItemsMsgId: PropTypes.string,
    content: PropTypes.func,
    loadItems: PropTypes.func,
    items: PropTypes.array,
    query: PropTypes.object
};

Accordion.defaultProps = {
    title: null,
    identifier: "",
    content: () => null,
    noItemsMsgId: "resourcesCatalog.emptyFilterItems"
};
export default Accordion;
