const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const extractTextPlugin = require('extract-text-webpack-plugin');
const uglifyJsPlugin = require('uglifyjs-webpack-plugin');
const cleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  watch: true,
  watchOptions: {
    aggregateTimeout: 0,
    poll: 500
  },
  mode: 'development',
  module: {
    rules: [{
      test: /\.s?css$/,
      use: extractTextPlugin.extract({
        fallback: 'style-loader',
        use: [{
          loader: 'css-loader',
          options: {modules:true,localIdentName:'[local]_[hash:4]',minimize:true}
        }, {
          loader: 'resolve-url-loader'
        }, {
          loader: 'sass-loader',
          options: {sourceMap: true}
        }]
      })
    }]
  },
  plugins: [
    new extractTextPlugin({
      filename: 'main.css',
      ignoreOrder: true
    }),
    new uglifyJsPlugin({
      parallel: true,
      sourceMap: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new cleanWebpackPlugin(['dist'],{
      root: path.join(__dirname,'..')
    })
  ]
});