
const Toolbar = require('../misc/toolbar/Toolbar');
const React = require('react');
const {compose, withState, branch, renderComponent, withProps} = require('recompose');
const InlineDateTimeSelector = require('../../plugins/timeline/InlineDateTimeSelector');
const {Form, FormGroup, ControlLabel, FormControl} = require('react-bootstrap');

const collapsible = compose(
    withState("showSettings", "onShowSettings", false),
    withState("collapsed", "setCollapsed", true),
        withProps(({ setCollapsed }) => ({
            buttons: [{
                glyph: 'minus',
                onClick: () => setCollapsed(true)
            }]
    })),
    branch(
        () => false,
        // ({collapsed}) => collapsed,
        renderComponent(({setCollapsed}) => (<Toolbar btnDefaultProps={{
            className: 'square-button-md',
            bsStyle: 'primary'
        }} buttons={[{
                glyph: 'time',
                onClick: () => setCollapsed(false)
            }]} />))
        )
);
module.exports = collapsible(({
    // setCollapsed,
    status,
    // loading,
    // currentTime,
    statusMap,
    showSettings,
    onShowSettings = () => {},
    play = () => {}, pause = () => {}, stop = () => {},
    startPlaybackTime,
    endPlaybackTime
}) => ( <div style={{display: 'flex'}}>
            {showSettings &&
            <Form className="ms-playback-settings">

                <h4>Playback Settings</h4>

                {/* Example form element */}
                <FormGroup controlId="formPlaybackMode">
                    <ControlLabel>Mode</ControlLabel>
                    <FormControl componentClass="select" placeholder="Select mode">
                        <option value="normal">Normal</option>
                        <option value="comulative">Comulative</option>
                        <option value="ranged">Ranged</option>
                    </FormControl>
                </FormGroup>
                {/* End - Example form element */}

                <FormGroup controlId="formPlaybackMode">
                    <ControlLabel>Range</ControlLabel>
                    <InlineDateTimeSelector
                        tooltip="Start time range"
                        glyph="playback-start"
                        date={startPlaybackTime}
                        style={{
                            padding: 0,
                            margin: 0,
                            border: 'none'
                        }}/>
                    <InlineDateTimeSelector
                        glyph="playback-end"
                        tooltip="End time range"
                        date={endPlaybackTime}
                        style={{
                            padding: 0,
                            margin: 0,
                            border: 'none'
                        }}/>
                </FormGroup>
            </Form>}
            <Toolbar
                btnDefaultProps={{
                    className: 'square-button-md',
                    bsStyle: 'primary'
                }}
                buttons={[
                    {
                        glyph: "step-backward",
                        tooltip: 'Step backward'
                    }, {
                        glyph: status === statusMap.PLAY ? "pause" : "play",
                        onClick: () => status === statusMap.PLAY ? pause() : play(),
                        tooltip: 'Play'
                    }, {
                        glyph: "stop",
                        onClick: stop,
                        tooltip: 'Stop'
                    }, {
                        glyph: "step-forward",
                        tooltip: 'Step forward'
                    }, {
                        glyph: "wrench",
                        bsStyle: showSettings ? 'success' : 'primary',
                        active: !!showSettings,
                        onClick: () => onShowSettings(!showSettings),
                        tooltip: 'Playback settings'
                    }
                ]}/>
        </div>
    )
);
