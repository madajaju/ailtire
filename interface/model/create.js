const path = require('path');
const api = require('../../src/Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create an model',
    static: true,
    inputs: {
        name: {
            description: 'The name of the model',
            type: 'string',
            required: true
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
        api.model(inputs.package, inputs.name, '.');
        return `Model: ${inputs.name} created`;
    }
};

