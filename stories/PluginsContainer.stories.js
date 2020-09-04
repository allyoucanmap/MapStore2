

import React from 'react';
import PluginsContainer from '../sdk/framework/plugins/PluginsContainer';
import { Provider } from 'react-redux';

export default {
    title: 'framework/plugins/PluginsContainer',
    component: PluginsContainer
};

const store = {
    subscribe: () => {},
    getState: () => ({}),
    dispatch: () => ({})
};

const Template = (args) => (
    <Provider store={store}>
        <PluginsContainer {...args} />
    </Provider>
);

export const WithPlugins = Template.bind({});
WithPlugins.args = {};
