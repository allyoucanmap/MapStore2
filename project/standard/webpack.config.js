const path = require("path");

const themeEntries = require('../../build/themes.js').themeEntries;
const extractThemesPlugin = require('../../build/themes.js').extractThemesPlugin;
const packageJSON = require('../../../package.json');

const appName = packageJSON.name;

const fs = require('fs-extra');
const versionData = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'version.txt'), 'utf8');
const version = versionData.toString();

const structureJSON = require('../../../structure.json');
const jsEntries = structureJSON.find(({name}) => name === 'js');

module.exports = require('../../build/buildConfig')(
    {
        [appName]: jsEntries && jsEntries.paths
            ? path.join(__dirname, '..', '..', '..', ...jsEntries.paths[0])
            : path.join(__dirname, '..', '..', '..', "MapStore2", "web", "client", "product", "app")// ,
        // [appName + '-embedded']: path.join(__dirname, '..', '..', '..', "MapStore2", "web", "client", "product", "embedded")
        /* ,
        'mapstore-product-api': path.join(__dirname, "MapStore2", "web", "client", "product", "api")*/
    },
    themeEntries,
    {
        base: path.join(__dirname, '..', '..', '..'),
        dist: path.join(__dirname, '..', '..', '..'),
        framework: path.join(__dirname, '..', '..', '..', "MapStore2", "web", "client"),
        code: [path.join(__dirname, '..', '..', '..', "js"), path.join(__dirname, '..', '..', '..', "MapStore2", "web", "client")],
        // this is a temporary path and should not be used as is
        // the html templates should be located in a fixed directory
        templates: path.join(__dirname, '..', '..', '..', 'MapStore2', 'web', 'client'),
        // to use ~ as relative paths for less loader we should include both paths
        less: [
            path.join(__dirname, '..', '..', '..', 'node_modules'),
            path.join(__dirname, '..', '..', '..', '..', 'node_modules')
        ]
    },
    extractThemesPlugin,
    false,
    "/",
    '.' + appName,
    [],
    {
        "@mapstore": path.resolve(__dirname, '..', '..', '..', "MapStore2", "web", "client"),
        "@js": path.resolve(__dirname, '..', '..', '..', "js")
    },
    undefined,
    {
        appBundleName: appName,
        embeddedBundleName: 'MapStore Home',
        appTitle: appName + '-embedded',
        embeddedTitle: 'MapStore Home',
        version
    }
);
