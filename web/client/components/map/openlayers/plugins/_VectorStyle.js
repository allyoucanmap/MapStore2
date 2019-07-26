

import { head } from 'lodash';
import SLDParser from "geostyler-sld-parser";
import OpenLayersParser from "geostyler-openlayers-parser";

const sldParser = new SLDParser();
const olParser = new OpenLayersParser();

export const applyStyle = ({ style, availableStyles = [] }, layer) => {
    const styleObj = style && head(availableStyles.filter(({ name }) => name === style))
        || head(availableStyles.filter(({ link }) => link && link.type.indexOf('sld') !== -1 ));

    sldParser
        .readStyle(styleObj.styleBody)
        .then(parsedStyle =>
            olParser
                .writeStyle(parsedStyle)
                .then(olStyle => layer.setStyle(olStyle))
                .catch(error => console.log(error))
        )
        .catch(error => console.log(error));
};
