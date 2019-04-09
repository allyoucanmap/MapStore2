import React from 'react';
import PropTypes from 'prop-types';
import Revealjs from 'reveal.js';
import 'reveal.js/css/reveal.css';

class Reveal extends React.Component {

    static propTypes = {
        configuration: PropTypes.object,
        dependencies: PropTypes.object
    };

    static defaultProps = {
        configuration: {
            hash: true,
            progress: false,
            fragments: false,
            fragmentInURL: false,
            transition: 'none',
            width: "100%",
            height: "100%",
            margin: 0,
            minScale: 1,
            maxScale: 1
        },
        dependencies: []
    };

    componentDidMount() {
        Revealjs.initialize({
            ...this.props.configuration,
            dependencies: this.props.dependencies
        });
    }

    render() {
        return (
            <div className="reveal">
                <div className="slides">
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export class Section extends React.Component {
    render() {
        return (
            <section>
                {this.props.children}
            </section>
        );
    }
}

export default Reveal;
