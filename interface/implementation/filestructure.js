const path = require('path');
const api = require('../src/Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create a Method in a Model',
    static: true,
    inputs: {
        name: {
            description: 'The name of the scenario',
            type: 'string',
            required: true
        },
        model: {
            description: 'The name of the model',
            type: 'string',
            required: false
        },
        package: {
            description: 'The name of the package',
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
        api.method(inputs.package, inputs.model, inputs.name, '.');
        return `Method: ${inputs.name} was created`;
    }
};

