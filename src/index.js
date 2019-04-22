/* eslint-disable global-require */

const Package = require('../package.json'),
    development = require('../config/development.json'),
    test = require('../config/test.json'),
    production = require('../config/production.json');

// bootstrap registers
require('app-module-path/register');
require('@babel/register')(
    {
        cache: false,
        extends: require('path').resolve(__dirname, '../.babelrc')
    }
);

// launch application
require('./core').app({
    name: Package.name,
    rootPath: __dirname,
    configs: {development, test, production}
});
