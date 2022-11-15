const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
//const MiniCssExtractPlugin = require("mini-css-extract-plugin");



 module.exports = merge(common, {
   mode: 'production',
   devtool: 'source-map',
   plugins: [
    // new MiniCssExtractPlugin({
    //   filename :'styles.css'
    // }),
  ],
  module: {
    rules: [
      // {
      //   test: /\.css$/i,
      //   use: [MiniCssExtractPlugin.loader,"css-loader"],
      // },
    ],
   },
   optimization: {
    minimizer: [new CssMinimizerPlugin(),'...'],
  },
 });