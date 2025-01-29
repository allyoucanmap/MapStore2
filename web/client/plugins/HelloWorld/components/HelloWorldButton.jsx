import React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import tooltip from '../../../components/misc/enhancers/tooltip';

const ButtonWithTooltip = tooltip(Button);

function HelloWorldButton({
    enabled,
    onClick
}) {
    function handleOnClick() {
        onClick(!enabled);
    }
    return (
        <ButtonWithTooltip
            tooltipId="helloworld.hello"
            tooltipPosition="left"
            onClick={handleOnClick}
            className="square-button"
            bsStyle={enabled ? 'success' : 'tray'}
        >
            <Glyphicon glyph="audio" />
        </ButtonWithTooltip>
    );
}

export default HelloWorldButton;
