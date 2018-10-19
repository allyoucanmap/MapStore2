/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const SquareCard = ({ selected, title, preview, previewSrc, onClick = () => { } }) => (
    <div
        className={`ms-square-card${selected ? ' ms-selected' : ''}`}
        onClick={() => onClick()}>
        {(preview || previewSrc) && <div className="ms-preview">
            {preview || previewSrc && <img src={previewSrc} />}
        </div>}
        <small>{title}</small>
    </div>
);

module.exports = SquareCard;
