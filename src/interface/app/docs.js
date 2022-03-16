const path = require('path');
const htmlGenerator = require('../../Documentation/html');
const sLoader = require('../../Server/Loader.js');
const server = require('ailtire/src/Server/doc-md');

module.exports = {
    friendlyName: 'docs',
    description: 'Generate Documentation of the app',
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

        let host = process.env.AITIRE_HOST || 'localhost'
        let port = process.env.AITIRE_PORT || 80
        let urlPrefix = process.env.AITIRE_BASEURL || '/docs'

        let project = require(process.cwd() + '/package.json');

        server.docBuild( {
            version: project.version,
            baseDir: '.',
            prefix: project.name,
            routes: {
            },
            host: host,
            urlPrefix: urlPrefix,
            listenPort: port
        });
    }
};


