const path = require('path');
const api = require('../../Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create an Workflow',
    static: true,
    inputs: {
        name: {
            description: 'The name of the usecase',
            type: 'string',
            required: true
        },
        package: {
            description: 'The name of the package for the workflow',
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
        api.workflow(inputs.package, inputs.name, '.');
        return `Workflow: ${inputs.name} created`;
    }
};

