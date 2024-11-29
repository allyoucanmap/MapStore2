var context = require.context('../web/client/plugins/ResourcesCatalog/hooks', true, /(-test\.jsx?)|(-test-chrome\.jsx?)$/);
context.keys().forEach(context);
module.exports = context;
