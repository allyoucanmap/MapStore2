/**
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the ISC-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */

const path = require('path');
const fs = require('fs-extra');
// write the version on a txt file to be available for other purpose (eg: backend)
const versionFileDestination = process.argv[2] || path.join(__dirname, 'version.txt');
const version = require('child_process')
    .execSync('git rev-parse HEAD')
    .toString().trim();

fs.writeFile(versionFileDestination,
    version,
    function(err) {
        if (err) {
            return console.log(err);
        }
        return console.log(`- version file written ${versionFileDestination}`);
    }
);
