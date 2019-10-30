/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import LayoutPlugin from './plugins/Layout';
import ConfigurePluginsPlugin from './plugins/ConfigurePlugins';
import GeneralSettingsPlugin from './plugins/GeneralSettings';
import MapPlugin from './plugins/Map';
import NavbarPlugin from './plugins/Navbar';
import StepperPlugin from './plugins/Stepper';
import TOCPlugin from '../plugins/TOC';
import DrawerMenuPlugin from '../plugins/DrawerMenu';
import MapFooterPlugin from '../plugins/MapFooter';
import BackgroundSelectorPlugin from '../plugins/BackgroundSelector';
import CRSSelectorPlugin from '../plugins/CRSSelector';
import AddGroupPlugin from '../plugins/AddGroup';
import MetadataExplorerPlugin from '../plugins/MetadataExplorer';
import BurgerMenuPlugin from '../plugins/BurgerMenu';
import OmniBarPlugin from '../plugins/OmniBar';

export const plugins = {
    LayoutPlugin,
    ConfigurePluginsPlugin,
    GeneralSettingsPlugin,
    MapPlugin,
    NavbarPlugin,
    StepperPlugin,
    TOCPlugin,
    DrawerMenuPlugin,
    MapFooterPlugin,
    BackgroundSelectorPlugin,
    CRSSelectorPlugin,
    AddGroupPlugin,
    MetadataExplorerPlugin,
    BurgerMenuPlugin,
    OmniBarPlugin
};

export const requires = {};

export default {
    plugins,
    requires
};
