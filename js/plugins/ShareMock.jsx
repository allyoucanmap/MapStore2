import React from 'react';
import assign from 'object-assign';
import { Glyphicon } from 'react-bootstrap';

class ShareMock extends React.Component {
    render() {
        return null;
    }
}

export const ShareMockPlugin = assign(ShareMock, {
    BurgerMenu: {
        name: 'share',
        position: 31,
        text: 'Share',
        icon: <Glyphicon glyph="share"/>
    }
});
