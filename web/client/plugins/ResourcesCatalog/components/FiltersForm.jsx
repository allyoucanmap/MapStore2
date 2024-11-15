/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import Message from '../../../components/I18N/Message';
import Icon from './Icon';
import isEqual from 'lodash/isEqual';
import FilterItems from './FilterItems';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

/**
 * FilterForm component allows to configure a list of field that can be used to apply filter on the page
 * @name FiltersForm
 * @memberof components
 * @prop {string} id the thumbnail is scaled based on the following configuration
 */
function FiltersForm({
    id,
    style,
    styleContainerForm,
    query,
    fields,
    onChange,
    onClose,
    onClear,
    extentProps,
    timeDebounce,
    filters,
    setFilters
}) {

    const handleFieldChange = (newParam) => {
        onChange(newParam);
    };

    return (
        <div className="ms-filter-form" style={styleContainerForm} >
            <div className="ms-filter-form-header">
                <div className="ms-filter-form-title">
                    <div><Icon glyph="filter" /> <strong><Message msgId="resourcesCatalog.filters" /></strong></div>
                    <Button
                        size="sm"
                        variant="default"
                        onClick={onClear}
                        disabled={isEmpty(omit(query, ['d', 'page', 'sort']))}
                    >
                        <Message msgId="resourcesCatalog.clearFilters"/>
                    </Button>
                </div>
                <Button
                    variant="default"
                    onClick={() => onClose()}
                    className="square-button-md"
                >
                    <Icon glyph="1-close" type="glyphicon"/>
                </Button>
            </div>
            <div
                className="ms-filter-form-body"
            >
                <div className="ms-filter-form-content">
                    <form
                        style={style}
                    >
                        <FilterItems
                            id={id}
                            items={fields}
                            values={query}
                            extentProps={{ ...extentProps, timeDebounce }}
                            onChange={handleFieldChange}
                            filters={filters}
                            setFilters={setFilters}
                        />
                    </form>
                </div>
            </div>
        </div>
    );
}

FiltersForm.defaultProps = {
    id: PropTypes.string,
    style: PropTypes.object,
    styleContainerForm: PropTypes.object,
    query: PropTypes.object,
    fields: PropTypes.array,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onClear: PropTypes.func,
    extentProps: PropTypes.object,
    submitOnChangeField: PropTypes.bool,
    timeDebounce: PropTypes.number,
    formParams: PropTypes.object

};

FiltersForm.defaultProps = {
    query: {},
    fields: [],
    onChange: () => {},
    onClose: () => {},
    onClear: () => {},
    submitOnChangeField: true,
    timeDebounce: 500,
    formParams: {}
};

const arePropsEqual = (prevProps, nextProps) => {
    return isEqual(prevProps.query, nextProps.query)
        && isEqual(prevProps.fields, nextProps.fields)
        && isEqual(prevProps.filters, nextProps.filters);
};


export default memo(FiltersForm, arePropsEqual);
