var webpack = require('webpack');
var path = require('path');
var getAbsolutePath = path.join.bind(path, __dirname);

var config = module.exports = {
	entry: {
		background: './src/js/background.js',
		output:     './src/js/output.js',
		selection:  './src/js/selection.js',
		options:    './src/js/options.js'
	},
	output: {
		path: getAbsolutePath('src/build'),
		filename: '[name].bundle.js'
	},
	// plugins: [
	// 	new webpack.ProvidePlugin({
	// 		React: 'react'
	// 	})
	// ],
	module: {
		loaders: [
			{ test: /\.tsx?$/, loader: 'ts-loader' }
		]
	}
};

if (process.env.NODE_ENV === 'production') {
	config.plugins.push(new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }));
	config.plugins.push(new webpack.optimize.UglifyJsPlugin({
		comments: / ^/,
		compress: { warnings: false }
	}));
}