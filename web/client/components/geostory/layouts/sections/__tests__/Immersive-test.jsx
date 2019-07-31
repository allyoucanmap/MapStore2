/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import ReactDOM from 'react-dom';

import expect from 'expect';
import Immersive from '../Immersive';
describe('Immersive component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('Immersive rendering with defaults', () => {
        ReactDOM.render(<Immersive />, document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.ms-section-immersive');
        expect(el).toExist();
    });
});
