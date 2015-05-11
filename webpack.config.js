var webpack = require('webpack');
var path = require('path');
var getAbsolutePath = path.join.bind(path, __dirname);

// Configuration for webpack
var config = module.exports = {
	cache: true,
	entry: {
		chrome:    './src/index-chrome.js',
		firefox:   './src/index-firefox.js',
		'output-firefox':    './src/output-firefox.js',
		options:   './src/options.js',
		selection: './src/selection.js'
	},
	output: {
		path: './build',
		filename: '[name].bundle.js'
	},
	watchDelay: 50,
	module: {

		loaders: [
			{
				test: /\.js$/,
				loader: 'babel',
				include: [ getAbsolutePath('src') ]
			}
		]
	},
	externals: [
		function(context, request, callback) {
			if (/^(sdk|chrome|toolkit|Services)(\/|$)/.test(request)) {
				return callback(null, 'commonjs ' + request);
			}
			callback();
		}
	]
};

// Production mode
if (process.env.NODE_ENV === 'production') {
	config.plugins = [
		new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
		new webpack.optimize.UglifyJsPlugin({
			comments: / ^/,
			compress: { warnings: false }
		})
	];
}