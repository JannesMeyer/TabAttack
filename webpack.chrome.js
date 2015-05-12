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
		path: './chrome/build',
		filename: '[name].bundle.js'
	},
	plugins: [
		new webpack.ProvidePlugin({
			BrowserRuntime: getAbsolutePath('src/chrome/BrowserRuntime'),
			ContentRuntime: getAbsolutePath('src/chrome/ContentRuntime'),
			Exporter:       getAbsolutePath('src/chrome/Exporter'),
			TabActions:     getAbsolutePath('src/chrome/TabActions'),
			ToolbarButton:  getAbsolutePath('src/chrome/ToolbarButton')
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
	}
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