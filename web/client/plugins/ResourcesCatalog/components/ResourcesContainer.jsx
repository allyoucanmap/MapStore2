/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import HTML from '../../../components/I18N/HTML';
import ResourceCard from './ResourceCard';
import Box from './Box';
import Text from './Text';
import Spinner from './Spinner';

const ResourcesContainer = (props) => {
    const {
        resources,
        isCardActive,
        containerStyle,
        header,
        cardOptions,
        children,
        footer,
        cardLayoutStyle,
        loading,
        getMainMessageId,
        registry,
        onSelect,
        theme = 'main',
        cardButtons,
        cardComponent,
        query,
        columns,
        metadata
    } = props;
    const {
        getResourceStatus
    } = registry;
    const messageId = getMainMessageId(props);
    return (
        <Box
            plr="md"
            className={`ms-resources-container${theme ? ` ms-${theme}-colors` : ''}`}>
            <Box
                position="relative"
                m="auto"
                style={containerStyle}>
                {header}
                {children}
                <Box
                    component="ul"
                    display="flex"
                    flexColumn={cardLayoutStyle === 'list'}
                    flexWrap={cardLayoutStyle !== 'list'}
                    flexGap={cardLayoutStyle === 'list' ? 'md' : 'lg'}
                    ptb="lg"
                    className={`ms-resources-container-${cardLayoutStyle}`}
                    position="relative"
                >
                    {resources.map((resource, idx) => {
                        const {
                            isProcessing,
                            isDownloading,
                            items: statusItems
                        } = getResourceStatus(resource);
                        // enable allowedOptions (menu cards)
                        const allowedOptions =  !isProcessing ? cardOptions : [];
                        return (
                            <li
                                key={`${idx}:${resource.pk}`}
                            >
                                <ResourceCard
                                    component={cardComponent}
                                    active={isCardActive(resource)}
                                    data={resource}
                                    options={allowedOptions}
                                    buttons={cardButtons}
                                    layoutCardsStyle={cardLayoutStyle}
                                    loading={isProcessing}
                                    readOnly={isProcessing}
                                    downloading={isDownloading}
                                    statusItems={statusItems}
                                    registry={registry}
                                    onClick={onSelect}
                                    query={query}
                                    columns={columns}
                                    metadata={metadata}
                                />
                            </li>
                        );
                    })}
                    {messageId ? <Text textAlign="center" m="auto" plr="sm">
                        <h1><HTML msgId={`${messageId}Title`}/></h1>
                        <p>
                            <HTML msgId={`${messageId}Content`}/>
                        </p>
                    </Text> : null}
                    {loading ? <Box
                        position={resources.length ? 'absolute' : 'relative'}
                        fill
                        plr="sm"
                        display="flex"
                        flexItemsCenter
                        overlay
                    >
                        <Text fontSize="xxl">
                            <Spinner />
                        </Text>
                    </Box> : null}
                </Box>
                {footer}
            </Box>
        </Box>
    );
};

ResourcesContainer.defaultProps = {
    resources: [],
    loading: false,
    formatHref: () => '#',
    isCardActive: () => false,
    getMessageId: () => undefined,
    getResourceStatus: () => ({})
};

export default ResourcesContainer;
