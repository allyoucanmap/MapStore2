
import React from 'react';
import Message from '../../../components/I18N/Message';
import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

/**
 *
 * @prop {bool} enabled value to visualize the content
 * @prop {string} title
 */
function HelloWorld({
    enabled,
    title,
    center,
    onZoomToExtent,
    content
}) {

    function handleZoomToExtent() {
        onZoomToExtent([-20, -20, 20, 20], 'EPSG:4326');
    }

    if (!enabled) {
        return null;
    }

    return (
        <div
            className="ms-helloworld"
        >
            {title ?? <Message msgId="helloworld.hello" />}{' '}{center?.x}
            <Button onClick={handleZoomToExtent}>
                <Message msgId="helloworld.hello" />
            </Button>
            <p>
                {content}
            </p>
        </div>
    );
}

HelloWorld.propTypes = {
    enabled: PropTypes.bool,
    title: PropTypes.string,
    center: PropTypes.object,
    onZoomToExtent: PropTypes.func,
    content: PropTypes.string
};

HelloWorld.defaultProps = {
    content: 'WAITING'
};

export default HelloWorld;
