const PropTypes = require('prop-types');
/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { Button: ButtonRB, Glyphicon } = require('react-bootstrap');
const tooltip = require('../misc/enhancers/tooltip');
const Button = tooltip(ButtonRB);

/*
class ThemeSwitcher extends React.Component {
    static propTypes = {
        themes: PropTypes.array,
        selectedTheme: PropTypes.object,
        onThemeSelected: PropTypes.func,
        style: PropTypes.object
    };

    static defaultProps = {
        onThemeSelected: () => {},
        style: {}
    };

    onChangeTheme = (themeId) => {
        const theme = head(this.props.themes.filter((t) => t.id === themeId));
        this.props.onThemeSelected(theme);
    };

    render() {
        return (
            <FormGroup className="theme-switcher" style={this.props.style} bsSize="small">
                <Label><Message msgId="manager.theme_combo"/></Label>
                <FormControl
                    value={this.props.selectedTheme && this.props.selectedTheme.id}
                    componentClass="select" ref="mapType" onChange={(e) => this.onChangeTheme(e.target.value)}>
                    {this.props.themes.map( (t) => <option key={t.id} value={t.id}>{t.label || t.id}</option>)}
                </FormControl>
            </FormGroup>);
    }
}
*/
function ThemeButton({
    themes,
    selectedTheme,
    onThemeSelected = () => {}
}) {
    const selectedThemeId = selectedTheme && selectedTheme.id;
    const filteredThemes = themes.filter((theme, idx) => idx < 2);
    return (
        <div>
            <Button
                className="square-button-md"
                tooltip={selectedThemeId === 'dark'
                    ? 'Switch to bright theme'
                    : 'Switch to dark theme'}
                bsStyle="primary"
                onClick={() => {
                    const currentTheme = filteredThemes.find(({ id }) => id !== selectedThemeId);
                    onThemeSelected(currentTheme);
                }}>
                <Glyphicon glyph={selectedThemeId === 'dark' ? 'moon' : 'sun'}/>
            </Button>
        </div>
    );
}

ThemeButton.propTypes = {
    themes: PropTypes.array,
    selectedTheme: PropTypes.object,
    onThemeSelected: PropTypes.func
};

ThemeButton.defaultProps = {
    onThemeSelected: () => {}
};

module.exports = ThemeButton;
