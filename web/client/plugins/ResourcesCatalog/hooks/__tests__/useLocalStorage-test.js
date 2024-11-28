
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import useLocalStorage from '../useLocalStorage';

function MockApp({ key, value }) {
    const [inTest, setInTest] = useLocalStorage(key);
    setInTest(value);
    return (
        <div className="MockApp">
            <p id="lsValue" >{inTest}</p>
        </div>
    );
}
describe('useLocalStorage', () => {

    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render with default', () => {
        ReactDOM.render(<MockApp key="test_key" value="test_value" />
            , document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.MockApp');
        expect(el).toBeTruthy();
    });

    it('should use the localStorage prop', () => {
        ReactDOM.render(<MockApp key="test_key" value="test_value" />, document.getElementById("container"));
        const el = document.getElementsByClassName('MockApp');
        expect(el).toBeTruthy();
        const element = el[0].childNodes[0];
        expect(element).toBeTruthy();
        expect(element.innerHTML).toBe('test_value');
    });
});
