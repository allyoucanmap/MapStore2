/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const { delay } = require('lodash');
const Select = require('react-select');

module.exports = class extends React.Component {

    static propTypes = {
        onOpen: PropTypes.func,
        scrollableContainer: PropTypes.string
    };

    static defaultProps = {
        onOpen: () => { }
    };

    onOpen = () => {
        if (this.props.scrollableContainer) {
            const scrollContainer = document.querySelector(this.props.scrollableContainer);
            if (scrollContainer && scrollContainer.getBoundingClientRect && scrollContainer.scrollTo
                && this.wrapper && this.wrapper.getBoundingClientRect) {
                delay(() => {
                    const { top: wrapperY } = this.wrapper.getBoundingClientRect();
                    const { top: scrollContainerY } = scrollContainer.getBoundingClientRect();
                    const selectY = Math.floor(wrapperY - scrollContainerY);
                    const top = scrollContainer.scrollTop;
                    const bottom = top + scrollContainer.clientHeight;
                    const isInsedeView = selectY >= top && selectY + 300 <= bottom;
                    if (!isInsedeView) {
                        scrollContainer.scrollTo(0, selectY);
                    }
                }, 50);
            }
        }
        this.props.onOpen();
    }

    render() {
        const { loadOptions, options, creatable, ...otherProps } = this.props;
        /**
         * If it is async & creatable return asynccreatable component
         * if it is async only, return async
         * if it is creatable only return creatable
         * otherwise return default select
         */
        return creatable && loadOptions ? <Select.AsyncCreatable {...otherProps}
            loadOptions={loadOptions}
            ref={(select) => {
                if (select && select.wrapper) {
                    this.wrapper = select.wrapper;
                }
            }}
            onOpen={this.onOpen} /> : loadOptions ? <Select.Async
                {...otherProps}
                loadOptions={loadOptions}
                ref={(select) => {
                    if (select && select.wrapper) {
                        this.wrapper = select.wrapper;
                    }
                }}
                onOpen={this.onOpen}
            /> : creatable ? <Select.Creatable {...otherProps}
                options={options}
                ref={(select) => {
                    if (select && select.wrapper) {
                        this.wrapper = select.wrapper;
                    }
                }}
                onOpen={this.onOpen} /> : <Select
                        {...otherProps}
                        options={options}
                        ref={(select) => {
                            if (select && select.wrapper) {
                                this.wrapper = select.wrapper;
                            }
                        }}
                        onOpen={this.onOpen} />;
    }
};
