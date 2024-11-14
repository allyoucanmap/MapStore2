/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import  isEmpty from 'lodash/isEmpty';
import PropTypes from "prop-types";

import { Message } from "../../../components/I18N/I18N";

import Spinner from "./Spinner";
import useIsMounted from "../hooks/useIsMounted";
import useDeepCompareEffect from '../hooks/useDeepCompareEffect';

const Title = ({
    loading,
    children
}) => {

    return (
        <div className="group-title">
            <div className="group-title-label">
                {children}
                {loading  && <Spinner/> }
            </div>
        </div>
    );
};

const Group = ({
    items,
    loadItems,
    title,
    titleId,
    query,
    content,
    loadingItemsMsgId,
    noItemsMsgId
}) => {
    const isMounted = useIsMounted();

    const [groupItems, setGroupItems] = useState(items);
    const [loading, setLoading] = useState(false);

    useDeepCompareEffect(() => {
        if (loadItems && typeof loadItems === 'function') {
            if (!loading) {
                setLoading(true);
                loadItems({ page_size: 999999 })
                    .then((response) =>{
                        isMounted(() => setGroupItems(response.items));
                    })
                    .finally(()=> isMounted(() => setLoading(false)));
            }
        }
    }, [query]);

    return (
        <div className={'ms-group'}>
            <Title
                loading={loading}
            >
                {titleId ? <Message msgId={titleId}/> : title}
            </Title>
            <div className="group-body">
                <div className={'group-items'}>
                    {loading ?
                        <Message msgId={loadingItemsMsgId}/>
                        : !isEmpty(groupItems) ? content(groupItems)
                            : !loading ? <Message msgId={noItemsMsgId}/> : null
                    }
                </div>
            </div>
        </div>
    );
};


Group.propTypes = {
    title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    titleId: PropTypes.string,
    noItemsMsgId: PropTypes.string,
    content: PropTypes.func,
    loadItems: PropTypes.func,
    items: PropTypes.array,
    query: PropTypes.object
};

Group.defaultProps = {
    title: null,
    content: () => null,
    noItemsMsgId: "resourcesCatalog.emptyFilterItems",
    loadingItemsMsgId: "resourcesCatalog.loadingItems"
};
export default Group;
