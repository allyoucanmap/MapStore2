import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { max, min } from 'lodash';
import AddSection from './AddSection';

class Section extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        type: PropTypes.string,
        viewHeight: PropTypes.number,
        onUpdate: PropTypes.func,
        excludeClassName: PropTypes.string,
        needsUpdate: PropTypes.number,
        onAdd: PropTypes.func,
        readOnly: PropTypes.bool
    };

    static defaultProps = {
        id: '',
        viewHeight: 0,
        onUpdate: () => { },
        excludeClassName: 'ms-cascade-section-exclude',
        needsUpdate: -1,
        onAdd: () => { }
    };

    state = {
        height: 0
    };

    componentDidMount() {
        const data = this.getData();
        this.setState({ ...data });
        this.props.onUpdate(data);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.viewHeight !== this.props.viewHeight
            || prevProps.needsUpdate !== this.props.needsUpdate) {
            const data = this.getData();
            this.setState({ ...data });
            this.props.onUpdate(data);
        }
    }

    getData = () => {
        const div = ReactDOM.findDOMNode(this);
        if (div && div.parentNode && div.parentNode.parentNode && div.children) {
            const children = [...div.children]
                .filter((child) => (child.getAttribute('class') || '').indexOf(this.props.excludeClassName) === -1);
            const minTop = min(children.map(child => {
                const { top } = child.getBoundingClientRect();
                return top;
            }));
            const height = max(children.map(child => {
                const { top, height: childHeight } = child.getBoundingClientRect();
                return top + childHeight - minTop;
            })) || 0;

            const chieldrenFields = div.querySelectorAll('[data-type=\'field\']') || [];

            const fieldsData = [...chieldrenFields].reduce((newFieldsData, childFild) => {
                const fieldId = childFild.getAttribute('data-field-id');
                const { top: fieldTop, height: fieldHeight } = childFild.getBoundingClientRect();
                const offset = (fieldTop - minTop) / this.props.viewHeight;
                const factor = fieldHeight / this.props.viewHeight;
                return {
                    ...newFieldsData,
                    [fieldId]: {
                        offset,
                        factor
                    }
                };
            }, {});

            return {
                id: this.props.id,
                height,
                factor: height / this.props.viewHeight,
                fieldsData
            };
        }
        return 0;
    };

    render() {
        return (
            <div
                className={`ms-cascade-section${this.props.type ? ` ms-${this.props.type}` : ''}`}
                style={{
                    position: 'relative',
                    height: this.state.height,
                    transform: 'translate3d(0px, 0px, 0px)'
                }}>
                {this.props.children}
                {!this.props.readOnly && <div
                    className={`${this.props.excludeClassName || ''} ms-cascade-edit-tools text-center`}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        backgroundColor: '#ffffff',
                        width: '100%',
                        zIndex: 2,
                        pointerEvents: 'auto'
                    }}>
                    <AddSection
                        id={this.props.id}
                        type={this.props.type}
                        onAdd={this.props.onAdd}/>
                </div>}
            </div>
        );
    }
}

export default Section;
