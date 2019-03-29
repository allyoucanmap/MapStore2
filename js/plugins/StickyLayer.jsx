import React from 'react';
import ReactDOM from 'react-dom';
import ScrollListener from './ScrollListener';

class StickyLayer extends React.Component {

    state = {
        position: 0,
        isSticky: false
    }

    onScroll = (container) => {
        const div = ReactDOM.findDOMNode(this);
        const parent = div && div.parentNode;
        if (parent && container) {
            const { top: parentTop, height: parentHeight } = parent.getBoundingClientRect();
            const { top: containerTop } = container.getBoundingClientRect();
            const { height: layerHeight } = div.getBoundingClientRect();
            const topAndHeight = containerTop - parentTop + layerHeight;
            const position = topAndHeight > parentHeight ? parentHeight - layerHeight : containerTop - parentTop;
            if (position !== this.state.position) {
                this.setState({
                    position,
                    isSticky: topAndHeight < parentHeight && parentTop < 0
                });
            }
        }
    };

    render() {
        return (
            <ScrollListener
                querySelector="#ms-parallax-container"
                onScroll={(container) => this.onScroll(container)}
                closest
                style={{
                    position: 'absolute',
                    width: '100%',
                    top: this.state.position < 0 ? 0 : this.state.position,
                    opacity: this.state.isSticky ? 0 : 1
                }}>
                {this.props.children}
            </ScrollListener>
        );
    }
}

export default StickyLayer;
