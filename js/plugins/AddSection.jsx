import React from 'react';
import PropTypes from 'prop-types';
import { Glyphicon } from 'react-bootstrap';

import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import ToolbarPopover from './ToolbarPopover';
import sectionTemplates from './sectionTemplates';

class AddSection extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        type: PropTypes.string,
        onAdd: PropTypes.func
    };

    static defaultProps = {
        id: '',
        type: '',
        onAdd: () => { }
    };

    render() {
        return (
            <ToolbarPopover
                glyph="plus text-primary"
                container={document.querySelector('#ms-parallax-container')}
                placement="top"
                content={
                    <Toolbar
                        btnDefaultProps={{
                            className: 'square-button btn-tray'
                        }}
                        buttons={[
                            {
                                glyph: 'font',
                                tooltip: 'Add title section',
                                onClick: () => {
                                    this.props.onAdd({
                                        id: this.props.id,
                                        section: sectionTemplates('title')
                                    });
                                }
                            },
                            {
                                glyph: 'sheet',
                                tooltip: 'Add paragraph section',
                                onClick: () => {
                                    this.props.onAdd({
                                        id: this.props.id,
                                        section: sectionTemplates('paragraph')
                                    });
                                }
                            }/*,
                            {
                                glyph: 'picture',
                                tooltip: 'Add immersive section'
                            }*/
                        ]} />
                }>
                <Glyphicon
                    glyph="plus"
                    className="text-primary"
                    style={{ padding: 8 }}/>
            </ToolbarPopover>
        );
    }
}

export default AddSection;
