const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    buffer: require.resolve('buffer/'),
    stream: require.resolve('stream-browserify'),
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  config.module.rules.forEach(rule => {
    if (rule.enforce === 'pre' && rule.loader === require.resolve('source-map-loader')) {
      if (Array.isArray(rule.exclude)) {
        rule.exclude.push(/node_modules/);
      } else {
        rule.exclude = [rule.exclude, /node_modules/];
      }

    }
  });

  return config;
};