const path = require('path');

module.exports = {
    friendlyName: 'list',
    description: 'list stuff',
    static: true,
    inputs: {
        name: {
            description: 'Name of the list',
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
        env.res.end("SDS Done: " + inputs.name);
    }
};



