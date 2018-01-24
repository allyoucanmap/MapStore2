/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const {Panel, Accordion} = require('react-bootstrap');
const SideCard = require('../cardgrids/SideCard');
console.log(<Panel />);
class Accordions extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        panels: PropTypes.string,
        activePanel: PropTypes.string,
        onSelect: PropTypes.func,
        fillContainer: PropTypes.bool
    };

    static defaultProps = {
        className: '',
        panels: [],
        activePanel: '0',
        onSelect: () => {},
        fillContainer: true
    };

    state = {
        activeKey: 0
    };

    renderHeader(head) {
        return <a role="tab"><SideCard {...head}/></a>;
    }

    render() {
        const fillContainerClassName = this.props.fillContainer ? 'ms-fill-container ' : '';
        return (
            <Accordion
                defaultActiveKey={0}
                activeKey={this.props.activePanel}
                className={'ms-accordion ' + fillContainerClassName + this.props.className}>
                {
                    this.props.panels.map((panel, i) =>
                        (<Panel
                            key={i}
                            eventKey={panel.id}
                            className={this.props.activePanel === panel.id ? 'ms-selected' : ''}
                            header={panel.head && this.renderHeader({...panel.head, selected: this.props.activePanel === panel.id}) || null}
                            collapsible
                            onClick={() => {
                                this.props.onSelect(panel.id);
                            }}>
                            {panel.body}
                        </Panel>)
                    )
                }
            </Accordion>
        );
    }
}

module.exports = Accordions;
