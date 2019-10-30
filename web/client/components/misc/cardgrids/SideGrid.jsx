/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import SideCard from './SideCard';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
/**
 * Component for rendering a list of SideCard.
 * @memberof components.misc.cardgrids
 * @name SideGrid
 * @class
 * @prop {array} items array of list item
 * @prop {function} onItemClick callback on item click
 * @prop {string} size size of cards, 'sm' for small
 * @prop {element} cardComponent custom component for card in list
 * @prop {object} colProps props for react-bootstrap col component
 */
class SideGrid extends React.Component {
    /* React class needed to retrieve ref of current component */
    static propTypes = {
        size: PropTypes.string,
        onItemClick: PropTypes.func,
        colProps: PropTypes.object,
        items: PropTypes.array,
        cardComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
        className: PropTypes.string,
        list: PropTypes.boolean
    };

    static defaultProps = {
        size: '',
        onItemClick: () => {},
        colProps: {xs: 12},
        className: "",
        items: []
    };

    render() {
        const {cardComponent, items, colProps, onItemClick, size, list} = this.props;
        const Card = cardComponent || SideCard;
        return list
            ? (<div className={"ms-side-list" + (this.props.className ? " " + this.props.className : "")}>
                {items.map((item, i) => (
                    <Card
                        key={item.id || i}
                        onClick={() => onItemClick(item)}
                        size={size}
                        {...item}
                    />
                ))}
            </div>)
            : (<div className={"msSideGrid" + (this.props.className ? " " + this.props.className : "")}>
                <Row className="items-list">
                    {items.map((item, i) =>
                        (<Col key={item.id || i} {...colProps}>
                            <Card
                                onClick={() => onItemClick(item)}
                                size={size}
                                {...item}
                            />
                        </Col>)
                    )}
                </Row>
            </div>);
    }
}

export const CardList = (props) => <SideGrid {...props} list/>;
export default SideGrid;
