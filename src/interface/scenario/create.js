const path = require('path');
const api = require('../../Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create an Scenario in a UseCase',
    static: true,
    inputs: {
        name: {
            description: 'The name of the scenario',
            type: 'string',
            required: true
        },
        usecase: {
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
        api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return `Scenario: ${inputs.name} was created`;
    }
};

