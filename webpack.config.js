var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'synk.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'synk',
    libraryTarget: 'umd',
  },
  externals: {
    kefir: {
      commonjs: 'kefir',
      commonjs2: 'kefir',
      global: 'Kefir',
    },
  },
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
