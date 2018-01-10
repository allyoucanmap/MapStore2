/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


const React = require('react');
const {Glyphicon} = require('react-bootstrap');

module.exports = ({onClick=() => {}, title, preview, description, caption, tools, selected, className, draggable, ...more} = {}) =>
<div className={`mapstore-side-card${selected ? ' selected' : ''} ` + className} onClick={(event) => onClick({event, title, preview, description, caption, tools, ...more})}>
  {draggable && <div className="mapstore-side-grab">
      <Glyphicon glyph="menu-hamburger"/>
  </div>}
  <div className="mapstore-side-preview">
      {preview}
  </div>
  <div className="mapstore-side-card-info">
      <div className="mapstore-side-card-title">
          {title}
      </div>
      <div className="mapstore-side-card-desc">
          {description}
      </div>
      <div className="mapstore-side-card-caption">
          {caption}
      </div>
  </div>
  <div className="mapstore-side-card-tool text-center">
      {tools}
  </div>
</div>;
