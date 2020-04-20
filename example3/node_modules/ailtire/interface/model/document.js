const rst = require('../../src/Documentation/rst.js');
const puml = require('../../src/Documentation/puml.js');
const path = require('path');

module.exports = {
    friendlyName: 'document',
    description: 'Document the model',
    static: true,
    inputs: {
        scope: {
            description: 'The scope of the Data Reference',
            type: 'string',
            required: false
        },
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        let apath = path.resolve('./docs');
        rst.package(global.topPackage, apath);
        rst.actors(global.actors, apath);
        env.res.end("Done");
    }
};



