import React from 'react';
import PropTypes from 'prop-types';
import stickybits from 'stickybits';
import ScrollListener from './ScrollListener';
import Media from './Media';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

class Background extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        sections: PropTypes.array,
        sectionsData: PropTypes.object,
        parallax: PropTypes.object
    };

    static defaultProps = {
        width: 0,
        height: 0,
        sections: [],
        sectionsData: {}
    };

    state = {
        page: 0
    };

    componentDidMount() {
        this._stickybits = stickybits('.ms-cascade-bg-container');
    }

    componentWillUnmount() {
        this._stickybits.cleanup();
    }

    render() {
        return (
            <ScrollListener
                className="ms-cascade-bg-container"
                querySelector="#ms-parallax-container"
                onScroll={() => {
                    const parallax = this.props.parallax;
                    if (parallax) {
                        const page = parallax.current / parallax.space;
                        if (page !== this.state.page) {
                            this.setState({ page });
                        }
                    }
                }}
                style={{
                    width: this.props.width,
                    height: this.props.height,
                    overflow: 'hidden'
                }}>
                {this.props.sections.map(({ id: sectionId, contents }) => {
                    const sectionData = this.props.sectionsData[sectionId] && this.props.sectionsData[sectionId];
                    if (!sectionData) return null;
                    const fieldsData = sectionData && sectionData.fieldsData || {};
                    const offset = sectionData.offset || 0;
                    const top = this.props.height * offset - this.state.page * this.props.height;
                    const relativePage = this.state.page - offset;
                    const page = relativePage < 0 ? 0 : relativePage;
                    const backgrounds = contents
                        .map(({ id, background: bg }) => {
                            const bgData = fieldsData[id] || { offset: 0, factor: 1 };
                            return bg ? { id, ...bg, ...bgData } : null;
                        })
                        .filter(val => val);
                    return (
                        <div
                            key={sectionId}
                            className={`ms-cascade-bg${top > 0 ? ' ms-disabled' : ''}`}
                            style={
                                {
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    top: top < 0 ? 0 : top
                                }
                            }>
                            <CSSTransitionGroup
                                transitionName="ms-cascade-bg"
                                transitionEnterTimeout={300}
                                transitionLeaveTimeout={300}>
                                {backgrounds
                                    .filter((bg) =>
                                        page >= bg.offset - 0.5 && page < bg.offset + bg.factor - 0.5
                                        || backgrounds.length === 1
                                    )
                                    .map(({ cover, src, id: bgId, type, invert }) => {
                                        return (
                                            <Media
                                                key={bgId}
                                                id={bgId}
                                                type={type}
                                                cover={cover}
                                                src={src}
                                                invert={invert} />
                                        );
                                    }
                                    )}
                            </CSSTransitionGroup>
                        </div>
                    );
                })}
            </ScrollListener>
        );
    }
}

export default Background;
