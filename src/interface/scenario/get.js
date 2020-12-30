const path = require('path');
const api = require('../../Documentation/api');
module.exports = {
    friendlyName: 'get',
    description: 'Get a Scenario in a UseCase',
    static: true,
    inputs: {
        id: {
            description: 'The name of the scenario',
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
        // Find the scenario from the usecase.

       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return `Scenario: ${inputs.name} was created`;
    }
};

