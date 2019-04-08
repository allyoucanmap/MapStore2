import React from 'react';
import assign from 'object-assign';
import { Glyphicon } from 'react-bootstrap';

class SaveMock extends React.Component {
    render() {
        return null;
    }
}

export const SaveMockPlugin = assign(SaveMock, {
    BurgerMenu: {
        name: 'save',
        position: 30,
        text: 'Save',
        icon: <Glyphicon glyph="floppy-open"/>
    }
});
