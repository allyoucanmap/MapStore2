/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { compose, branch, withProps } from 'recompose';
import find from 'lodash/find';
import Image from '../../components/geostory/media/Image';
import Map from '../../components/geostory/media/Map';
import Video from '../../components/geostory/media/Video';
import connectMap, {withLocalMapState, withMapEditingAndLocalMapState} from '../../components/geostory/common/enhancers/map';
import emptyState from '../../components/misc/enhancers/emptyState';
import { resourcesSelector } from '../../selectors/geostory';
import { SectionTypes } from '../../utils/GeoStoryUtils';

const image = branch(
    ({resourceId}) => resourceId,
    compose(
        connect(createSelector(resourcesSelector, (resources) => ({resources}))),
        withProps(
            ({ resources, resourceId: id }) => {
                const resource = find(resources, { id }) || {};
                return resource.data;
            }
        )
    ),
    emptyState(
        ({src = "", sectionType} = {}) => !src && (sectionType !== SectionTypes.TITLE && sectionType !== SectionTypes.IMMERSIVE),
        () => ({
            glyph: "picture"
        })
    )
)(Image);

const map = compose(
    branch(
        ({ resourceId }) => resourceId,
        connectMap,
    ),
    withLocalMapState,
    withMapEditingAndLocalMapState
)(Map);

const video = branch(
    ({resourceId}) => resourceId,
    compose(
        connect(createSelector(resourcesSelector, (resources) => ({resources}))),
        withProps(
            ({ resources, resourceId: id }) => {
                const resource = find(resources, { id }) || {};
                return resource.data;
            }
        )
    ),
    emptyState(
        ({src = "", sectionType} = {}) => !src && (sectionType !== SectionTypes.TITLE && sectionType !== SectionTypes.IMMERSIVE),
        () => ({
            glyph: "play"
        })
    )
)(Video);

const mediaTypesMap = {
    image,
    map,
    video
};

export default mediaTypesMap;
