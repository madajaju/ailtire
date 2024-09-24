const path = require('path');
const fs = require('fs');

module.exports = {
    friendlyName: 'images',
    description: 'Get images from deployments',
    static: true,
    inputs: {
        name: {
            description: 'The name of the component',
            type: 'string',
            required: false
        }
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        if(!global.ailtire.implementation) {
            global.ailtire.implementation = {}
        }
        if(inputs.name) {
            env.res.json(global.ailtire.implementation.images[inputs.name]);
        } else {
            env.res.json(global.ailtire.implementation.images);
        }
    }
};
