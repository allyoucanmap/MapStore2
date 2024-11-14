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
import MainLoader from './MainLoader';

const CardGrid = (props) => {
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
        theme,
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
        <div className={`ms-card-grid${theme ? ` theme-${theme}` : ''}`}>
            <div className="ms-card-grid-container" style={containerStyle}>
                {header}
                {children}
                <ul
                    className={`ms-card-list ms-cards-type-${cardLayoutStyle}`}
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
                    {messageId ? <div className="ms-card-grid-message">
                        <h1><HTML msgId={`${messageId}Title`}/></h1>
                        <p>
                            <HTML msgId={`${messageId}Content`}/>
                        </p>
                    </div> : null}
                    {loading ? <MainLoader className="ms-cards-loader"/> : null}
                </ul>
                {footer}
            </div>
        </div>
    );
};

CardGrid.defaultProps = {
    resources: [],
    loading: false,
    formatHref: () => '#',
    isCardActive: () => false,
    getMessageId: () => undefined,
    getResourceStatus: () => ({})
};

export default CardGrid;
