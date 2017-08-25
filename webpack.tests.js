var path = require('path');
var nodeExternals = require('webpack-node-externals');
var webpack = require('webpack');

module.exports = {
  target: 'node',
  externals: [nodeExternals()],
  resolve: {
    extensions: [".js", ".json", ".es6.js"],
    // Stub WebSocket
    alias: {
      WebSocket: 'eventemitter3',
    },
  },
  plugins: [
    // Stub Websocket for testing
    new webpack.ProvidePlugin({ 'WebSocket': 'WebSocket' }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
