/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import Button from '../../../components/layout/Button';
import FlexBox, { FlexFill } from '../../../components/layout/FlexBox';
import InputControl from '../../ResourcesCatalog/components/InputControl';
import { getMessageById } from '../../../utils/LocaleUtils';
import { getCredentials } from '../../../utils/SecurityUtils';
import { isEmpty } from 'lodash';
import tooltip from '../../../components/misc/enhancers/tooltip';

const ButtonWithTooltip = tooltip(Button);

function ResourcesSearchTool({
    glyph,
    className,
    onClick,
    tooltipId,
    labelId,
    variant
}) {
    return (
        <ButtonWithTooltip
            square
            variant={variant}
            borderTransparent
            className={className}
            onClick={onClick}
            tooltipId={labelId || tooltipId}
        >
            <Glyphicon glyph={glyph} />
        </ButtonWithTooltip>
    );
}


const CatalogSearchInput = ({
    searchText,
    onChangeText,
    messages,
    services,
    selectedService,
    onShowSecurityModal,
    onSetProtectedServices,
    search,
    onReset,
    isCentered = false
}) => {
    const onSearchTextChange = (value) => {
        onChangeText(value);
        const currentService = services?.[selectedService];
        const protectedId = currentService?.protectedId;
        const creds = getCredentials(protectedId);

        if (protectedId && isEmpty(creds)) {
            onShowSecurityModal(true);
            onSetProtectedServices([currentService]);
        } else {
            search({
                services,
                selectedService,
                searchText: value
            });
        }
    };

    const reset = () => {
        search({
            services,
            selectedService,
            searchText: ""
        });
        if (onReset) {
            onReset();
        }
    };

    return (
        <FlexBox className="ms-resources-search-field" gap="xs" centerChildrenVertically style={{ width: '100%', margin: 0 }}>
            <Glyphicon glyph="search" />
            <InputControl
                placeholder={'Search layers...'}
                debounceTime={300}
                value={searchText}
                onChange={onSearchTextChange}
            />
            {searchText ? <ResourcesSearchTool
                glyph={'1-close'}
                onClick={() => reset()}
            /> : null}
        </FlexBox>
    );

    // return (
    //     <FlexFill flexBox centerChildrenVertically>
    //         <InputControl
    //             placeholder={getMessageById(messages, "catalog.textSearchPlaceholder")}
    //             debounceTime={300}
    //             value={searchText}
    //             onChange={onSearchTextChange}
    //         />
    //         {!isCentered && (
    //             <Button onClick={reset}>
    //                 <Glyphicon glyph="remove" />
    //             </Button>
    //         )}
    //     </FlexFill>
    // );
};

export default CatalogSearchInput;
