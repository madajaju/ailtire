const path = require('path');

module.exports = {
    friendlyName: 'dump',
    description: 'Dump the model',
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

    fn: function (obj, inputs, env) {
        if(env) {
            env.res.json(global.classes);
            env.res.end("Done");
        }
        console.log(inputs);
    }
};



