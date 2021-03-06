const path = require('path');
const devServerPort = 4000;

const isDebugging = false;

module.exports = {
    entry: path.join(__dirname, './src/index.ts'),
    devtool: 'source-map',
    output: {
        filename: 'index.js',
        path: __dirname + '/dist',
        publicPath: '/dist/',
        sourceMapFilename: '[name].map',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['./src', './node_modules'],
    },
    mode: isDebugging ? 'development' : 'production',
    module: {
        rules: [
            {
                test: /\.ts/,
                loader: 'ts-loader',
            },
        ],
    },
    optimization: {
        minimize: !isDebugging,
    },
    watch: true,
    stats: 'minimal',
    devServer: {
        host: '0.0.0.0', // This makes the server public so that others can test by http://hostname ...
        port: devServerPort,
        open: true,
        openPage: '',
        public: 'localhost:' + devServerPort,
    },
};
