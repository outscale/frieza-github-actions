const path = require('path');

module.exports = {
	mode: "production",
	entry: {
		entry: {
			import: './index.js',
			dependOn: 'shared',
		},
		post: {
			import: './cleanup.js',
			dependOn: 'shared',
		},
		shared: 'lodash',
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
	target: "node",
	node: false,
};
