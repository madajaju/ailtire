const path = require('path');
const htmlGenerator = require('../../Documentation/html');
const sLoader = require('../../Server/Loader.js');

module.exports = {
    friendlyName: 'docs',
    description: 'Generate Documention of the app',
    static: true,
    inputs: {
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        let apath = path.resolve('.');
        let topPackage = sLoader.processPackage(apath);
        htmlGenerator.package(global.topPackage, apath + '/docs');
        htmlGenerator.actors(global.actors, apath + '/docs');
    }
};


