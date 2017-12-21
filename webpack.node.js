var webpack = require('webpack');

var regular = require('./webpack.config.js');

regular.target = 'node';


/////////////////////////////
// Add the websocket resolver
if (!regular.resolve) regular.resolve = {};
if (!regular.resolve.alias) regular.resolve.alias = {};

regular.resolve.alias['WebSocket'] = 'ws';


/////////////////////
// Add provide plugin
if (!regular.plugins) regular.plugins = [];

var provideWebSocket = new webpack.ProvidePlugin({
  'WebSocket': 'WebSocket',
});

regular.plugins.push(provideWebSocket);


//////////////////
// Update filename
regular.output.filename = 'synk.node.js'

module.exports = regular;
