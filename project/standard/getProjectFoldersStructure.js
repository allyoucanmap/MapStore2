/* eslint-disable */

const fs = require('fs');
const path = require('path');

function readDirectories(names, rootPath) {
    return names.filter(name => {
        const currentPath = path.join(rootPath, name);
        return fs.statSync(currentPath).isDirectory();
    }).map((name) => {
        const currentPath = path.join(rootPath, name);
        const subNames = fs.readdirSync(currentPath);
        return [name, ...readDirectories(subNames, currentPath)];
    });
}

// if we use the script from node_modules we should change __dirname to the relative path
// eg: path.join(__dirname, '..', '..');
const projectDirectory = path.join(__dirname, '..', '..', '..');
const exclude = ['.git', 'backend', 'docker', 'MapStore2', 'web', 'node_modules'];
const names = fs.readdirSync(projectDirectory)
    .filter(name => exclude.indexOf(name) === -1);
const directories = readDirectories(names, projectDirectory);

/*
[
    ["assets"],
    ["js"],
    ["themes",
        ["default"]
    ],
    ["translations"]
]
*/
const targets = {
    'translations': {
        get: (info) => {
            return {
                name: 'translations',
                paths: [[info[0]]]
            };
        }
    },
    'themes': {
        get: (info) => {
            return {
                name: 'themes',
                paths: info
                    .filter((theme, idx) => idx > 0)
                    .map((theme) => [info[0], theme[0], 'theme.less'])
            };
        }
    },
    'js': {
        get: (info) => {
            const subNames = fs.readdirSync(path.join(projectDirectory, info[0]));
            const app = subNames.find((name) => name === 'app.jsx');
            if (!app) {
                return null;
            }
            return {
                name: 'js',
                paths: [[info[0], app]]
            };
        }
    }
};

const overrides = directories.map((info) => {
    return targets[info[0]] && targets[info[0]].get(info);
}).filter(val => val);

fs.writeFile(path.join(projectDirectory, 'structure.json'),
    JSON.stringify(overrides),
    function(err) {
        if (err) {
            return console.log(err);
        }
        return console.log(`- structure file created at ${projectDirectory}`);
    }
);

/*
[
    {
        "name": "js",
        "paths": [
            [ 'js', 'app.jsx' ]
        ]
    },
    {
        "name": "themes",
        "paths": [
            [ "themes", "default", "theme.less" ]
        ]
    },
    {
        "name": "translations",
        "paths": [
            [ "translations" ]
        ]
    }
]
*/