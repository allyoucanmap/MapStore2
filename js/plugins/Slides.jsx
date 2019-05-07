/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Reveal, { Section } from './Reveal';
import fields from './fileds';
import Media from './Media';

class Slides extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        sections: PropTypes.array,
        onEdit: PropTypes.func,
        onAdd: PropTypes.func,
        readOnly: PropTypes.bool,
        onUpdate: PropTypes.func
    };

    render() {
        return (
            <Reveal>
                {this.props.sections.map(({ contents = [], id: sectionId }) => {
                    return (
                        <Section
                            key={sectionId}>
                            {contents.map(({ id: contentId, type, foreground, background }) => {
                                const Field = fields[type];
                                const { cover, src, id: bgId, type: bgType, invert } = background || {};
                                return (
                                    <Section
                                        key={contentId}>
                                        <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%' }}>
                                            <Media
                                                key={bgId + contentId}
                                                id={bgId + contentId}
                                                type={bgType}
                                                cover={cover}
                                                src={src}
                                                readOnly={this.props.readOnly}
                                                invert={invert} />
                                        </div>
                                        <Field
                                            {...foreground}
                                            id={contentId}
                                            readOnly={this.props.readOnly}
                                            onChange={(key, value) => this.props.onEdit({ sectionId, contentId, key, value })} />
                                    </Section>
                                );
                            })}
                        </Section>
                    );
                })}
            </Reveal>
        );
    }
}

/*import Media from './Media';
import createTheme from 'spectacle/lib/themes/default';
import {
    Appear,
    BlockQuote,
    Cite,
    CodePane,
    Code,
    Deck,
    Fill,
    Fit,
    Heading,
    Image,
    Layout,
    ListItem,
    List,
    Quote,
    Slide,
    Text
} from 'spectacle';
import fields from './fileds';

const theme = createTheme(
    {
        primary: 'white',
        secondary: '#333333',
        tertiary: '#333333',
        quaternary: '#333333'
    }
);

class Slides extends React.Component {

    static propTypes = {
        width: PropTypes.number,
        height: PropTypes.number,
        sections: PropTypes.array,
        onEdit: PropTypes.func,
        onAdd: PropTypes.func,
        readOnly: PropTypes.bool,
        onUpdate: PropTypes.func
    };

    render() {
        return (
            <Deck
                progress={this.props.readOnly ? 'bar' : 'none'}
                showFullscreenControl={false}
                theme={theme}>
                {this.props.sections.map(({ contents = [], id: sectionId, type: sectionType }) => {
                    return (
                        <Slide
                            key={sectionId}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%'
                                }}>
                                {contents && contents[0] && [contents[0]].map(({ background }) => {
                                    const { cover, src, id: bgId, type, invert } = background || {};
                                    return type && src
                                        ? <Media
                                            key={bgId}
                                            id={bgId}
                                            type={type}
                                            cover={cover}
                                            src={src}
                                            invert={invert} />
                                        : null;
                                })}
                            </div>
                            <div style={{
                                position: sectionType === 'immersive' ? 'absolute' : 'relative',
                                top: 0, left: 0,
                                width: '100%',
                                height: '100%',
                                overflowY: 'auto'
                            }}>
                                {contents.map(({ id: contentId, type, foreground }) => {
                                    const Field = fields[type];
                                    return Field
                                        ? <Text>
                                            <Field
                                                {...foreground}
                                                id={contentId}
                                                readOnly={this.props.readOnly}
                                                onChange={(key, value) => this.props.onEdit({ sectionId, contentId, key, value })} />
                                        </Text>
                                        : null;
                                })}
                            </div>
                        </Slide>
                    );
                })}
            </Deck>
        );
    }
}*/

export default Slides;
