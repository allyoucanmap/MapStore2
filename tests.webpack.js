var context = require.context('./web/client/components/data/identify', true, /(-test\.jsx?)|(-test-chrome\.jsx?)$/);
context.keys().forEach(context);
module.exports = context;
