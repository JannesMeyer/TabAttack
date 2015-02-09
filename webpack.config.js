var webpack = require('webpack');
var getPath = require('path').join.bind(require('path'), __dirname);

/**
 * Webpack configuration
 */
var config = module.exports = {
	cache: true,
	watchDelay: 50,
	entry: {
		background: getPath('src', 'js', 'background.js'),
		output:     getPath('src', 'js', 'output.js'),
		selection:  getPath('src', 'js', 'selection.js')
	},
	output: {
		path: getPath('src', 'build'),
		filename: '[name].bundle.js'
	},
	plugins: [
		new webpack.ProvidePlugin({ Chrome: getPath('src', 'js', 'lib-chrome', 'Chrome.js') })
	],
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: '6to5', // ?modules=commonStrict
				include: [ getPath('src') ],
				exclude: [ getPath('src', 'node_modules'), getPath('src', 'ace-builds') ] // TODO: include ace by hand
			},
			{
				test: /\.styl$/,
				loaders: ['style', 'css', 'stylus']
			}
		]
	}
};

// Add extra plugins in production
if (process.env.NODE_ENV === 'production') {
	// Replace `proces.env.NODE_ENV` with a string
	config.plugins.push(new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }));

	// UglifyJS
	var options = {
		// This is a regex that never matches so that all comments get deleted
		comments: / ^/,
		mangle: { sort: true },
		compress: { drop_console: true, hoist_vars: true, warnings: false }
	};
	config.plugins.push(new webpack.optimize.UglifyJsPlugin(options));
}