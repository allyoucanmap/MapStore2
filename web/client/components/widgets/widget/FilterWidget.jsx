/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';

import WidgetContainer from './WidgetContainer';
import FilterView from './FilterView';

export default ({
    toggleDeleteConfirm = () => {},
    icons,
    topLeftItems,
    id, title,
    headerStyle,
    topRightItems,
    options = {},
    dataGrid = {},
    confirmDelete = false,
    onDelete = () => {}
} = {}) =>
    (<WidgetContainer id={`widget-filter-${id}`} title={title} confirmDelete={confirmDelete} onDelete={onDelete} toggleDeleteConfirm={toggleDeleteConfirm} headerStyle={headerStyle}
        isDraggable={dataGrid.isDraggable}
        icons={icons}
        topLeftItems={topLeftItems}
        topRightItems={topRightItems}
        options={options}
    >
        <FilterView />
    </WidgetContainer>

    );
