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
import Box from './Box';
import Text from './Text';

const Title = ({
    loading,
    children
}) => {

    return (
        <Text strong >
            {children}
            {loading  ? <>{' '}<Spinner/></> : null}
        </Text>
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
    noItemsMsgId,
    root
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
        <Box display="flex" flexColumn flexGap="sm">
            <Title
                loading={loading}
            >
                {titleId ? <Message msgId={titleId}/> : title}
            </Title>
            <Box display="flex" flexColumn flexGap="sm" pl={root ? undefined : "sm"}>
                {loading ?
                    <Message msgId={loadingItemsMsgId}/>
                    : !isEmpty(groupItems) ? content(groupItems)
                        : !loading ? <Message msgId={noItemsMsgId}/> : null
                }
            </Box>
        </Box>
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
