const path = require('path');
const api = require('../../src/Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create an actor',
    static: true,
    inputs: {
        name: {
            description: 'The name of the actor',
            type: 'string',
            required: true
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
        if(inputs.hasOwnProperty('path')) {
            api.actor({name: inputs.name}, inputs.path);
        }
        else {
            api.actor({name: inputs.name}, './actors');
        }
        return `Actor: ${inputs.name} created`;
    }
};

