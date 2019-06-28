/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import assign from 'object-assign';
import PropTypes from 'prop-types';
import Container from '../components/misc/Container';
import BorderLayout from '../components/layout/BorderLayout';
import Toolbar from '../components/misc/toolbar/Toolbar';
import SLDParser from "geostyler-sld-parser";
import SideGrid from '../components/misc/cardgrids/SideGrid';
import SwitchButton from '../components/misc/switch/SwitchButton';
import ColorSelector from '../components/style/ColorSelector';
import tinycolor from 'tinycolor2';
import Slider from '../components/misc/Slider';
import { Glyphicon } from 'react-bootstrap';
import Editor from '../components/styleeditor/Editor';
import Loader from '../components/misc/Loader';

const parser = new SLDParser();

const SLD_EXAMPLE = `
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor
    xmlns="http://www.opengis.net/sld"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
    xmlns:se="http://www.opengis.net/se"
    version="1.1.0"
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:xlink="http://www.w3.org/1999/xlink">
  <NamedLayer>
    <se:Name>test_style</se:Name>
    <UserStyle>
      <se:Name>test_style</se:Name>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:Name>Polygon</se:Name>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#ff0000</se:SvgParameter>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#aaff33</se:SvgParameter>
              <se:SvgParameter name="stroke-width">2</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">#000000</se:SvgParameter>
              <se:SvgParameter name="stroke-width">2</se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:Mark>
                <sld:WellKnownName>circle</sld:WellKnownName>
                <sld:Fill>
                  <sld:CssParameter name="fill">#000000</sld:CssParameter>
                </sld:Fill>
                <sld:Stroke>
                    <sld:CssParameter name="stroke">#33ff33</sld:CssParameter>
                  <sld:CssParameter name="stroke-width">2</sld:CssParameter>
                </sld:Stroke>
              </sld:Mark>
              <sld:Size>16</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Name>Polygon</se:Name>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill">#33ffaa</se:SvgParameter>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke">#ffaa33</se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
 </StyledLayerDescriptor>
`;

const FieldContainer = ({ children, label }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: 4
            }}>
            <div style={{ flex: 1 }}>{label}</div>
            <div style={{ flex: 1 }}>{children}</div>
        </div>
    );
};

const fields = {
    color: ({ label, value }) => (
        <FieldContainer
            label={label}>
            <ColorSelector
                color={tinycolor(value).toRgb()}
                onChangeColor={() => {}}/>
        </FieldContainer>
    ),
    slider: ({ label, value }) => (
        <FieldContainer
            label={label}>
            <div
                className="mapstore-slider with-tooltip"
                onClick={(e) => { e.stopPropagation(); }}>
                <Slider
                    start={[value]}
                    tooltips={[true]}
                    /*format={{
                        from: value => Math.round(value),
                        to: value => Math.round(value) + ' %'
                    }}*/
                    range={{min: 0, max: 10}}
                    onChange={() => {}}/>
            </div>
        </FieldContainer>
    )
};

const SymbolizerContainer = ({glyph, children}) => (
    <div style={{ padding: 8, margin: 4, border: '1px solid #ddd' }}>
        <div>
            <h4><Glyphicon glyph={glyph}/></h4>
        </div>
        <div>
            {children}
        </div>
    </div>
);

const groups = {
    mark: ({
        properties = {},
        params = {
            // wellKnownName
            color: {
                type: 'color'
            },
            strokeColor: {
                type: 'color'
            },
            strokeWidth: {
                type: 'slider'
            },
            radius: {
                type: 'slider'
            }
        }
    }) => {
        return (
            <SymbolizerContainer glyph="point">
                {Object.keys(properties)
                    .map((key) => {
                        const { type } = params[key] || {};
                        const Field = fields[type];
                        return Field && <Field
                            label={key}
                            value={properties[key]}/>;
                    })}
            </SymbolizerContainer>
        );
    },
    fill: ({
        properties = {},
        params = {
            color: {
                type: 'color'
            },
            outlineColor: {
                type: 'color'
            },
            outlineWidth: {
                type: 'slider'
            }
        }
    }) => {
        return (
            <SymbolizerContainer glyph="polygon">
                {Object.keys(properties)
                    .map((key) => {
                        const { type } = params[key] || {};
                        const Field = fields[type];
                        return Field && <Field
                            label={key}
                            value={properties[key]}/>;
                    })}
            </SymbolizerContainer>
        );
    },
    line: ({
        properties = {},
        params = {
            color: {
                type: 'color'
            },
            width: {
                type: 'slider'
            }
        }
    }) => {
        return (
            <SymbolizerContainer glyph="line">
                {Object.keys(properties)
                    .map((key) => {
                        const { type } = params[key] || {};
                        const Field = fields[type];
                        return Field && <Field
                            label={key}
                            value={properties[key]}/>;
                    })}
            </SymbolizerContainer>
        );
    },
    text: () => null,
    raster: () => null
};

class Visual extends Component {

    static propTypes = {
        styleBody: PropTypes.string,
        format: PropTypes.string
    };

    state = {};

    componentWillMount() {
        this.parseStyle(this.props.styleBody);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.styleBody !== this.props.styleBody) {
            this.parseStyle(newProps.styleBody);
        }
    }

    render() {
        const { style = {} } = this.state;
        const { rules = [], name: styleName } = style;
        return (
            <BorderLayout
                header={
                    <div style={{ padding: 8, display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            {styleName}
                        </div>
                        <div>
                            <Toolbar
                                btnDefaultProps={{
                                    className: 'square-button-md no-border'
                                }}
                                buttons={[
                                    {
                                        glyph: 'plus',
                                        tooltip: 'Add rule'
                                    }
                                ]}/>
                        </div>
                    </div>}>
                    <SideGrid
                        size="sm"
                        items={
                            rules.map(rule => {
                                const { name, symbolizers = [] } = rule;
                                return {
                                    title: name,
                                    tools: <Toolbar
                                    btnDefaultProps={{
                                        className: 'square-button-md no-border'
                                    }}
                                    buttons={[
                                        {
                                            glyph: 'point-plus',
                                            tooltip: 'Add point style'
                                        },
                                        {
                                            glyph: 'line-plus',
                                            tooltip: 'Add line style'
                                        },
                                        {
                                            glyph: 'polygon-plus',
                                            tooltip: 'Add polygon style'
                                        },
                                        {
                                            glyph: '1-raster',
                                            tooltip: 'Add raster style'
                                        },
                                        {
                                            glyph: 'font',
                                            tooltip: 'Add label'
                                        }
                                    ]}/>,
                                    body: symbolizers.map(({ kind = '', ...properties }) => {
                                        const Symbolizer = groups[kind.toLowerCase()];
                                        return Symbolizer &&
                                            <Symbolizer
                                                properties={properties}/>;
                                    })
                                };
                            })
                        }/>
            </BorderLayout>
        );
    }

    parseStyle = (styleBody) => {
        parser.readStyle(styleBody)
            .then((style) => this.setState({ style }))
            .catch(() => {
                // console.log(error);
            });
    }
}

class VisualStyleEditor extends Component {
    static propTypes = {
        items: PropTypes.array
    };

    static defaultProps = {
        items: []
    };

    state = {
        styleBody: SLD_EXAMPLE,
        visual: true
    };

    render() {
        const {
            styleBody,
            visual,
            loading
        } = this.state;
        return (
            <Container>
                <BorderLayout
                    header={
                        <div style={{ display: 'flex', padding: 8, borderBottom: '1px solid #ddd' }}>
                            <div style={{ flex: '1' }}>
                                Layer
                            </div>
                            <div style={{ display: 'flex' }}>
                                {loading && <Loader size={17}/>}
                                <Glyphicon
                                    glyph="tasks"
                                    className={visual && 'text-primary'}
                                    style={{ padding: '0 8px'}}/>
                                <SwitchButton
                                        checked={!visual}
                                        onChange={() => {
                                            if (loading) return null;
                                            this.setState({ loading: true });
                                            return setTimeout(() => {
                                                this.setState({ visual: !visual, loading: false });
                                            }, 500);
                                        }}/>
                                <Glyphicon
                                    glyph="code"
                                    className={!visual && 'text-primary'}
                                    style={{ padding: '0 8px'}}/>
                            </div>
                        </div>
                    }>
                    {visual
                        ? <Visual
                            styleBody={styleBody}/>
                        : <Editor
                            code={styleBody}
                            mode="xml"/>}
                </BorderLayout>
            </Container>
        );
    }
}

export const VisualStyleEditorPlugin = assign(VisualStyleEditor, {});

export const reducers = {};
