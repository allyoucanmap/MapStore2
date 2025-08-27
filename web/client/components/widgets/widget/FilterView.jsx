/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';

import FlexBox from '../../layout/FlexBox';
import Text from '../../layout/Text';
import { getTagColorVariables } from '../../../utils/ResourcesFiltersUtils';
import { Checkbox, Glyphicon } from 'react-bootstrap';


const FilterView = () => {
    return (
        <FlexBox column gap="sm" className="_padding-sm">
            <FlexBox column gap="xs">
                <Text fontSize="sm">
                    Sub regions
                </Text>
                <FlexBox component="ul" gap="xs" wrap>
                    {[
                        [
                            "N Eng",
                            6380000
                        ],
                        [
                            "W N Cen",
                            8599083
                        ],
                        [
                            "Pacific",
                            18708447
                        ],
                        [
                            "Mtn",
                            6711227
                        ],
                        [
                            "E S Cen",
                            7688093
                        ],
                        [
                            "S Atl",
                            21116170
                        ],
                        [
                            "E N Cen",
                            19915182
                        ],
                        [
                            "Mid Atl",
                            18055623
                        ],
                        [
                            "W S Cen",
                            13128627.00000001
                        ]
                    ].sort((a, b) =>a[0] > b[0] ? 1 : -1).map((entry) => {
                        return (
                            <Text fontSize="sm" key={entry[0]} className="ms-tag" style={getTagColorVariables('#eee')}>
                                {entry[0]}
                            </Text>
                        );
                    })}
                </FlexBox>
            </FlexBox>
            <div style={{ width: '100%', height: 1, background: '#ddd' }} />
            <FlexBox column gap="xs">
                <Text fontSize="sm">
                    Year
                </Text>
                <FlexBox component={Text} fontSize="sm" gap="sm" centerChildrenVertically>
                    <Glyphicon glyph="checkbox-off" /> 2022
                </FlexBox>
                <FlexBox component={Text} fontSize="sm" gap="sm" centerChildrenVertically>
                    <Glyphicon glyph="checkbox-off" /> 2023
                </FlexBox>
                <FlexBox component={Text} fontSize="sm" gap="sm" centerChildrenVertically>
                    <Glyphicon glyph="checkbox-off" /> 2024
                </FlexBox>
                <FlexBox component={Text} fontSize="sm" gap="sm" centerChildrenVertically>
                    <Glyphicon glyph="checkbox-off" /> 2025
                </FlexBox>
            </FlexBox>
            <div style={{ width: '100%', height: 1, background: '#ddd' }} />
            <FlexBox column gap="xs">
                <Text fontSize="sm">
                    Category
                </Text>
                <FlexBox component={Text} fontSize="sm" gap="sm" centerChildrenVertically>
                    <Glyphicon glyph="radio-off" /> Category A
                </FlexBox>
                <FlexBox component={Text} fontSize="sm" gap="sm" centerChildrenVertically>
                    <Glyphicon glyph="radio-off" /> Category B
                </FlexBox>
            </FlexBox>
        </FlexBox>
    );
};

export default FilterView;
