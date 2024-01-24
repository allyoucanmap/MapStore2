import { omit, flatten } from 'lodash';

export const makePlugins = (plugins = []) =>
    plugins.map(plugin => ({...plugin.pluginConfig, ...(plugin.isUserPlugin ? {active: plugin.active} : {})}));

export const flattenPluginTree = (plugins = []) =>
    flatten(plugins.map(plugin => [omit(plugin, 'children')].concat(plugin.enabled ? flattenPluginTree(plugin.children) : [])));
