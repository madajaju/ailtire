const path = require('path');

module.exports = {
    friendlyName: 'create',
    description: 'Create an app',
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
        env.res.json("Made it!");
        env.res.end("Done");
    }
};



