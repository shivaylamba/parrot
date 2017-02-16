import path from 'path';

module.exports = {
  entry: './index.dev.js',
  eslint: {
    configFile: path.resolve('.eslintrc')
  },
  module: {
    loaders: [{ test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel' }]
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.scss']
  }
};
