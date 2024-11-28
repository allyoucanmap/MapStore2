import React from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import FlexBox from './components/FlexBox';
import Menu from './components/Menu';
import usePluginItems from '../../hooks/usePluginItems';

function BrandNavbar({
    size,
    variant,
    leftMenuItems = [],
    rightMenuItems = [],
    items
}, context) {
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });
    const pluginLeftMenuItems = configuredItems.filter(({ target }) => target === 'left-menu').map(item => ({ ...item, type: 'plugin' }));
    const pluginRightMenuItems = configuredItems.filter(({ target }) => target === 'right-menu').map(item => ({ ...item, type: 'plugin' }));
    return (
        <>
            <FlexBox
                id="ms-brand-navbar"
                classNames={[
                    'ms-brand-navbar',
                    'ms-main-colors',
                    'shadow-md',
                    '_sticky',
                    '_corner-tl',
                    '_padding-lr-sm',
                    '_padding-tb-xs'
                ]}
                centerChildrenVertically
                gap="sm"
            >
                <FlexBox.Fill
                    component={Menu}
                    centerChildrenVertically
                    gap="xs"
                    size={size}
                    variant={variant}
                    items={[
                        ...leftMenuItems,
                        ...pluginLeftMenuItems
                    ]}
                />
                <Menu
                    centerChildrenVertically
                    gap="xs"
                    variant={variant}
                    alignRight
                    size={size}
                    items={[
                        ...rightMenuItems,
                        ...pluginRightMenuItems
                    ]}
                />
            </FlexBox>
        </>
    );
}


export default createPlugin('BrandNavbar', {
    component: BrandNavbar
});
