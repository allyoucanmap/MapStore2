
const {get} = require('lodash');

const additionalLayersSelector = state => get(state, 'additionallayers', []);
const additionalLayersByOwnerSelector = (owner, state) => {
    const additionalLayers = additionalLayersSelector(state);
    return additionalLayers.filter(layer => layer.owner === owner);
};

module.exports = {
    additionalLayersByOwnerSelector
};
