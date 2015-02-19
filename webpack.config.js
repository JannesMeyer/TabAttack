var webpack = require('webpack');
var getAbsolutePath = require('path').join.bind(require('path'), __dirname);

/**
 * Webpack configuration
 */
var config = module.exports = {
	cache: true,
	watchDelay: 50,
	entry: {
		background: './src/js/background.js',
		output:     './src/js/output.js',
		selection:  './src/js/selection.js',
		options:    './src/js/options.js'
	},
	output: {
		path: './src/build',
		filename: '[name].bundle.js'
	},
	plugins: [
		new webpack.ProvidePlugin({ Chrome: getAbsolutePath('src/js/lib-chrome/Chrome.js') })
	],
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel', // ?modules=commonStrict
				include: [ getAbsolutePath('src') ],
				exclude: [ getAbsolutePath('node_modules') ]
			}
		]
	}
};


var uglifyConfig = {
	// This is a regex that never matches so that all comments get deleted
	comments: / ^/,
	compress: { warnings: false }
};

// Add extra plugins in production
if (process.env.NODE_ENV === 'production') {
	config.plugins.push(new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }));
	config.plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyConfig));
}