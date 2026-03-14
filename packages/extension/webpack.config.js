const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    devtool: isDev ? 'cheap-module-source-map' : false,

    entry: {
      background: './src/background/index.ts',
      popup: './src/popup/index.tsx',
      dashboard: './src/dashboard/index.tsx',
      sidepanel: './src/sidepanel/index.tsx',
      content: './src/content/index.ts',
      inpage: './src/inpage/index.ts',
      offscreen: './src/offscreen/index.ts',
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name][ext]',
          },
        },
        {
          test: /\.(png|svg|jpg|gif)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/icons/[name][ext]',
          },
        },
      ],
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),

      // Popup HTML
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),

      // Dashboard HTML (full-page)
      new HtmlWebpackPlugin({
        template: './src/dashboard/dashboard.html',
        filename: 'dashboard.html',
        chunks: ['dashboard'],
      }),

      // Side Panel HTML
      new HtmlWebpackPlugin({
        template: './src/sidepanel/sidepanel.html',
        filename: 'sidepanel.html',
        chunks: ['sidepanel'],
      }),

      // Offscreen HTML (WASM proof gen)
      new HtmlWebpackPlugin({
        template: './src/offscreen/offscreen.html',
        filename: 'offscreen.html',
        chunks: ['offscreen'],
      }),

      // Copy static assets
      new CopyWebpackPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
          // Circuit artifacts for ZK proof generation in offscreen document
          // Pre-validated by scripts/check-circuits.js (prebuild step)
          { from: '../circuits/deposit/target/deposit.json', to: 'circuits/deposit.json' },
          { from: '../circuits/shielded_transfer/target/shielded_transfer.json', to: 'circuits/shielded_transfer.json' },
          { from: '../circuits/withdraw/target/withdraw.json', to: 'circuits/withdraw.json' },
          { from: '../circuits/anonymous_swap/target/anonymous_swap.json', to: 'circuits/anonymous_swap.json' },
        ],
      }),
    ],

    optimization: {
      minimize: !isDev,
    },

    // WASM support for bb.js
    experiments: {
      asyncWebAssembly: true,
    },
  };
};
