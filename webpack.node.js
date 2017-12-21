var webpack = require('webpack');
var regular = require('./webpack.config.js');

regular.target = 'node';

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


/////////////////////////////////////////////////
// Don't bundle node ws lib in the output package
regular.externals.WebSocket = {
    commonjs:'ws',
    commonjs2: 'ws',
    amd: 'ws',
    global: 'WebSocket',
};

module.exports = regular;
