const path = require('path');
const api = require('../../src/Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create an UseCase',
    static: true,
    inputs: {
        name: {
            description: 'The name of the usecase',
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
        api.usecase(inputs.package, inputs.name, '.');
        return `UseCase: ${inputs.name} created`;
    }
};

