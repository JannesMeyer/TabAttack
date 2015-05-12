var webpack = require('webpack');
var path = require('path');
var getAbsolutePath = path.join.bind(path, __dirname);

// Configuration for webpack
var config = module.exports = {
	cache: true,
	entry: {
		index:     './src/index.js',
		output:    './src/output.js',
		options:   './src/options.js',
		selection: './src/selection.js'
	},
	output: {
		path: './firefox/build',
		filename: '[name].bundle.js'
	},
	plugins: [
		new webpack.ProvidePlugin({
			BrowserRuntime: getAbsolutePath('src/BrowserRuntime.firefox.js'),
			ContentRuntime: getAbsolutePath('src/ContentRuntime.firefox.js')
		})
	],
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
			if (/^(sdk|chrome|toolkit)(\/|$)/.test(request)) {
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