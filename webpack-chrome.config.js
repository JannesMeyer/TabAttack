var webpack = require('webpack');
var path = require('path');

var getAbsolutePath = path.join.bind(path, __dirname);
var config = module.exports = {
	cache: true,
	entry: {
		background: './chrome/index.js'
	},
	output: {
		path: './build',
		filename: '[name].bundle.js'
	},
	watchDelay: 50,
	plugins: [
		new webpack.ProvidePlugin({ React: 'react' })
	],
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel',
				include: [ getAbsolutePath('src'), getAbsolutePath('chrome') ],
				exclude: [ getAbsolutePath('node_modules') ]
			}
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