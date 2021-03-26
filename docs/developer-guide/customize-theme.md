# Styling and Theming

The look and feel is completely customizable either using one of the included themes, or building your own. Themes are built using [scss](https://sass-lang.com/).  
You can find the default theme here: https://github.com/geosolutions-it/MapStore2/tree/master/web/client/themes/default

## Theme Structure

```
.
+-- themes/
|   +-- theme-name/
|       +-- icons/
|           +-- icons.eot
|           +-- icons.svg
|           +-- icons.ttf
|           +-- icons.woff
|       +-- img/
|       +-- scss/
|           +-- _common.scss
|           +-- _style-module.scss
|       +-- bootstrap-theme.scss
|       +-- bootstrap-variables.scss
|       +-- icons.scss
|       +-- ms2-theme.scss
|       +-- theme.scss
|       +-- variables.scss
```

`theme.scss` is the entry point for all the main imports and it needs to be properly required in `buildConfig.js`.

imports:
- icons.scss contains font-face declaration for glyphs, it extends the bootstrap glyphicons to use custom MapStore icons
- bootstrap-theme.scss contains all the scss style for bootstrap components
- ms2-theme.scss contains all the scss style for MapStore components
- variable.scss

below an example of entry configuration:
```js
entry: assign({
    ...other entries,
    'themes/theme-name': path.join(__dirname, 'path-to', 'theme-name', 'theme.scss')
}, ...args),
```

MapStore uses a `themeEntries` function to automatically create the entries for default themes that can be found under the `web/client/themes` directory.

Note: we suggest to place the theme folder inside a `themes` directory for MapStore project

### variables.scss
MapStore uses basic scss variables to change theme colors, buttons sizes and fonts.
It possible also to override bootstrap scss variable for advanced customization.
Basic variables can be found in the variable.scss file

New declarations in MapStore should have the following structure:

global: `$ms-rule-value`

local: `$ms-name-of-plugin--rule-value`

- `$ms` suffix for MapStore variable
- `name-of-plugin` for local variable it's important to write the name of plugin in kebab-case
- `rule-value` value to use in compiled CSS, some examples:
    - `color` generic color variable
    - `text-color` color for text
    - `background-color` color for background
    - `border-color` color for border

### scss/ directory

The scss/ directory contains all the modules needed to create the final CSS of MapStore.

Each file in this directory is related to a specific plugin or component and the files are named based on the plugin's name are referring to.

common.scss file can be used for generic styles. 

### inline styles

Inline styles should be applied only for values that change dynamically during the lifecycle of the application, all others style should be moved to the related .scss file.

Main reason of this choice is to allow easier overrides of styles in custom projects.

## Add New Theme

To add a new theme:     

1. create a new folder in the themes folder with the name of your theme
1. create scss files in the folder (at least `theme.scss`, as the main file, and `variables.scss`, to customize standard variables)
1. add the new theme to the [index file](https://github.com/geosolutions-it/MapStore2/blob/master/web/client/themes/index.js), with the id corresponding to the theme folder name

You can then switch your application to use the theme adding a new section in the `appConfig.js` file:

```
initialState: {
    defaultState: {
        ...
        theme: {
            selectedTheme: {
                id: <your theme id>
            }
        },
        ...
     }
}
```

## Override Styles in a Project

Styles can be overridden declaring the same rules in a scss module placed in a new project.

Below steps to configure a custom theme and override styles:

- add the following files to the themes folder of the project:

```
.
+-- themes/
|   +-- default/
|       +-- scss/
|           +-- _my-custom-module.scss
|       +-- theme.scss
|       +-- variables.scss
```

- import in theme.scss all the needed scss module

```scss
@import
    'variables.scss',
    '../../MapStore2/web/client/themes/default/theme.scss',
    './scss/my-custom-module.scss'
;
```

- update webpack configuration to use the custom style (webpack.config.js, prod-webpack.config.js)

```diff
module.exports = require('./MapStore2/buildConfig')(
    {
        '__PROJECTNAME__': path.join(__dirname, "js", "app"),
        '__PROJECTNAME__-embedded': path.join(__dirname, "MapStore2", "web", "client", "product", "embedded"),
        '__PROJECTNAME__-api': path.join(__dirname, "MapStore2", "web", "client", "product", "api")
    },
-   themeEntries,
+   {
+       "themes/default": path.join(__dirname, "themes", "default", "theme.scss")
+   },
    ...
```

- update `variables.scss` to override existing variables

```scss
/* change primary color to blue */
$ms2-color-primary: #0000ff;
```

- update `_my-custom-module.scss` to override existing rules or add new rules

```scss
/* change the background color of the page*/
.page {
    background-color: #d9e6ff;
}
```
