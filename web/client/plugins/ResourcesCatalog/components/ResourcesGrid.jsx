/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import CardGrid from '../components/CardGrid';
import Icon from '../components/Icon';
import Button from '../components/Button';
import useResourceGridLayout from '../hooks/useResourceGridLayout';
import TargetSelectorPortal from '../components/TargetSelectorPortal';
import PaginationCustom from '../components/PaginationCustom';
import ResourcesPanelWrapper from '../components/ResourcesPanelWrapper';
import ResourcesMenu from '../components/ResourcesMenu';
import useLocalStorage from '../hooks/useLocalStorage';

const defaultGetMainMessageId = ({ query, user, isFirstRequest, error, resources, loading }) => {
    const hasResources = resources?.length > 0;
    const hasFilter = Object.keys(query || {}).filter(key => key !== 'sort').length > 0;
    const isLoggedIn = !!user;
    const messageId = !hasResources && !isFirstRequest && !loading
        ? error && 'resourcesCatalog.errorResourcePage'
            || hasFilter && 'resourcesCatalog.noResultsWithFilter'
            || isLoggedIn && 'resourcesCatalog.noContentYet'
            || 'resourcesCatalog.noPublicContent'
        : undefined;
    return messageId;
};

function ResourcesGrid({
    id,
    user,
    totalResources,
    loading,
    menuItems: [],
    pageSize = 24,
    panel,
    cardLayoutStyle,
    setCardLayoutStyle,
    hideCardLayoutButton,
    selectedResource,
    targetSelector = '',
    showDetails,
    showFiltersForm,
    menuItemsLeft,
    error,
    query,
    cardOptions,
    width,
    height,
    headerNodeSelector = '',
    navbarNodeSelector = '',
    footerNodeSelector = '',
    containerSelector: containerSelectorProp = '',
    registry,
    onUpdate = () => {},
    onClear = () => {},
    resources,
    isFirstRequest,
    getMainMessageId = defaultGetMainMessageId,
    menuItems,
    orderConfig,
    titleId,
    page,
    theme,
    cardButtons,
    cardComponent,
    metadata = []
}) {
    const className = 'ms-resources-grid';
    const containerSelector = containerSelectorProp ? containerSelectorProp : `.${className}`;

    const [columns, setColumns] = useLocalStorage('metadataColumns', []);

    const {
        detailNode,
        filterFormNode,
        stickyTop,
        stickyBottom
    } = useResourceGridLayout({
        headerNodeSelector,
        navbarNodeSelector,
        footerNodeSelector,
        containerSelector,
        showFiltersForm,
        showDetails,
        width,
        height,
        panel
    });

    /*
    const FiltersComponent = filtersComponent;

    const filterForm = (
        <ResourcesPanelWrapper
            className="ms-resources-filter"
            top={stickyTop}
            bottom={stickyBottom}
            show={showFiltersForm}
            enabled={!!FiltersComponent}
            ref={filterFormNode}
        >
            {FiltersComponent ? <FiltersComponent
                resourcesGridId={id}
                query={query}
                onClear={onClear}
                onChange={onUpdate}
            /> : null}
        </ResourcesPanelWrapper>
    );

    const DetailsComponent = detailsComponent;

    const detailPanel = (
        <ResourcesPanelWrapper
            className="ms-resource-detail"
            top={stickyTop}
            bottom={stickyBottom}
            show={showDetails}
            enabled={!!DetailsComponent}
            ref={detailNode}
        >
            {DetailsComponent ? <DetailsComponent /> : null}
        </ResourcesPanelWrapper>
    );
    */
    return (
        <TargetSelectorPortal targetSelector={targetSelector}>
            <>
                <div className={`${className} ms-${panel ? 'panel' : 'row'}`}>
                    <div className="ms-grid-container">
                        <CardGrid
                            theme={theme}
                            resources={resources}
                            isFirstRequest={isFirstRequest}
                            loading={loading}
                            error={error}
                            cardLayoutStyle={cardLayoutStyle}
                            query={query}
                            columns={columns}
                            metadata={metadata}
                            header={
                                <ResourcesMenu
                                    theme={theme}
                                    titleId={titleId}
                                    resourcesGridId={id}
                                    menuItemsLeft={menuItemsLeft}
                                    menuItems={menuItems}
                                    orderConfig={orderConfig}
                                    totalResources={totalResources}
                                    loading={loading}
                                    cardLayoutStyle={cardLayoutStyle}
                                    setCardLayoutStyle={setCardLayoutStyle}
                                    hideCardLayoutButton={hideCardLayoutButton}
                                    style={{
                                        position: 'sticky',
                                        top: stickyTop
                                    }}
                                    registry={registry}
                                    query={query}
                                    metadata={metadata}
                                    columns={columns}
                                    setColumns={setColumns}
                                />
                            }
                            footer={
                                <div
                                    className="ms-resources-pagination"
                                    style={{
                                        position: 'sticky',
                                        bottom: stickyBottom
                                    }}
                                >
                                    {error
                                        ? <Button variant="primary" href="#/"><Icon glyph="refresh" /></Button>
                                        : (!loading || !!totalResources) && <PaginationCustom
                                            items={Math.ceil(totalResources / pageSize)}
                                            activePage={page}
                                            onSelect={(value) => {
                                                onUpdate({
                                                    page: value
                                                });
                                            }}
                                        />}
                                </div>
                            }
                            user={user}
                            cardOptions={cardOptions}
                            cardButtons={cardButtons}
                            cardComponent={cardComponent}
                            isCardActive={res => res.pk === selectedResource?.pk}
                            getMainMessageId={getMainMessageId}
                            registry={registry}
                        />
                    </div>
                </div>
            </>
        </TargetSelectorPortal>

    );
}

export default ResourcesGrid;
