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
      WebSocket: path.resolve(__dirname, 'src/WebSocketStub.es6.js'),
    },
  },
  plugins: [
    // Stub Websocket for testing
    new webpack.ProvidePlugin({ 'WebSocket': ['WebSocket', 'default'] }),
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
