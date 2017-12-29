const path = require('path');
const webpack = require('webpack');

console.log('node ' + process.version);

const isProduction = process.argv.includes('-p');

module.exports = config = {
	entry: {
		background: './src/js/background.ts',
		output:     './src/js/output.tsx',
		selection:  './src/js/selection.ts',
		options:    './src/js/options.tsx'
	},
	output: {
		path: path.join(__dirname, 'src/build'),
		filename: '[name].js'
	},
	module: {
		loaders: [
			{ test: /\.tsx?$/, loader: 'ts-loader' }
		]
	},
	plugins: [],
};

if (isProduction) {
	config.plugins.push(new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }));
	config.plugins.push(new webpack.optimize.UglifyJsPlugin({
		comments: / ^/,
		compress: { warnings: false }
	}));
}