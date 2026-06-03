const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const config = require('./prod-webpack.config.js');

// export a standalone report.html in the dist folder and open it when the build completes
config.plugins.push(new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    reportFilename: 'report.html',
    openAnalyzer: true
}));

module.exports = config;
