var nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const path = require('path');
module.exports = {
    target: 'node',
    entry: './src/server.ts',
    output: {
        filename: './server.js',
    },
    mode: "production",
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js', '.json'],
        modules: [
            `${global}/node_modules`,
            'node_modules'
        ]
    },
    stats: {
        // Configure the console output
        errorDetails: true, //this does show errors
        colors: false,
        modules: true,
        reasons: true,
        chunkModules: true,
        performance:true
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: [/node_modules/],
            },
            {
                test: /\.js(x?)$/,
                exclude: [/node_modules/],
                loader: "babel-loader"
            }
        ]
    },
    externals: [
        nodeExternals()
    ]
}