
const { head, get } = require('lodash');
const uuidv1 = require('uuid/v1');

const STYLE_ID_SEPARATOR = '___';
const STYLE_OWNER_NAME = 'styleeditor';

const EDITOR_MODES = {
    css: 'geocss',
    sld: 'xml'
};

const getGeometryType = (geomProperty = {}) => {
    const localPart = geomProperty.type && geomProperty.type.localPart && geomProperty.type.localPart.toLowerCase() || '';
    if (localPart.indexOf('polygon') !== -1
        || localPart.indexOf('surface') !== -1) {
        return 'polygon';
    } else if (localPart.indexOf('linestring') !== -1) {
        return 'linestring';
    } else if (localPart.indexOf('point') !== -1) {
        return 'point';
    }
    return 'vector';
};

const extractLayerSettings = (layer = {}) => {

    const {
        id,
        url,
        name: layerName,
        describeLayer = {},
        style,
        availableStyles,
        describeFeatureType = {}
    } = layer;

    const owsType = describeLayer && describeLayer.owsType || null;
    const descProperties = get(describeFeatureType, 'complexType[0].complexContent.extension.sequence.element') || null;
    const geomProperty = descProperties && head(descProperties.filter(({ type }) => type && type.prefix === 'gml'));
    const geometryType = geomProperty && (owsType === 'WCS' && 'raster' || owsType === 'WFS' && getGeometryType(geomProperty)) || null;
    const properties = descProperties && descProperties.reduce((props, { name, type = {} }) => ({
        ...props,
        [name]: {
            localPart: type.localPart,
            prefix: type.prefix
        }
    }), {});
    return {
        id,
        url,
        name: layerName,
        geometryType,
        properties,
        owsType,
        availableStyles,
        style
    };
};

const parseAdditionalLayerSettings = (additionalLayers, selectedLayer) => {
    const { settings = {} } = head(additionalLayers) || {};
    const availableStyles = settings.availableStyles || [];
    const { name: defaultStyle } = head(availableStyles) || {};
    const enabledStyle = selectedLayer.style || selectedLayer && !selectedLayer.style && defaultStyle;
    return {
        availableStyles: availableStyles.map(style => {
            const splittedName = style.title && style.title.split(STYLE_ID_SEPARATOR);
            const label = splittedName[0] || style.name;
            return {
                ...style,
                label
            };
        }),
        defaultStyle,
        enabledStyle
    };
};

const getEditorMode = format => EDITOR_MODES[format] || format;

module.exports = {
    STYLE_OWNER_NAME,
    generateTemporaryStyleId: () => `${uuidv1()}_ms_${Date.now().toString()}`,
    generateStyleId: ({title = ''}) => `${title.toLowerCase().replace(/\s/g, '_')}${STYLE_ID_SEPARATOR}${uuidv1()}`,
    extractLayerSettings,
    parseAdditionalLayerSettings,
    getEditorMode
};
