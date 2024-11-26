import React from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import Box from './components/Box';
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
            <Box
                id="ms-brand-navbar"
                className="ms-brand-navbar ms-main-colors shadow-soft"
                display="flex"
                position="sticky"
                flexVerticalAlign
                flexGap="sm"
                plr="sm"
                ptb="xs"
            >
                <Menu
                    flexFill
                    display="flex"
                    flexVerticalAlign
                    flexGap="xs"
                    size={size}
                    variant={variant}
                    items={[
                        ...leftMenuItems,
                        ...pluginLeftMenuItems
                    ]}
                />
                <Menu
                    display="flex"
                    flexVerticalAlign
                    flexGap="xs"
                    variant={variant}
                    alignRight
                    size={size}
                    items={[
                        ...rightMenuItems,
                        ...pluginRightMenuItems
                    ]}
                />
            </Box>
        </>
    );
}


export default createPlugin('BrandNavbar', {
    component: BrandNavbar
});
