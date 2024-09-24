const path = require('path');
const api = require('../../src/Documentation/api');
module.exports = {
    friendlyName: 'create',
    description: 'Create an app',
    static: true,
    inputs: {
        name: {
            description: 'The name of the application',
            type: 'string',
            required: true
        },
        path: {
            description: 'The path to install the application',
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
        if(inputs.hasOwnProperty('path')) {
            api.app(inputs.name, inputs.path);
        }
        else {
            inputs.path = './' + inputs.name;
            api.app(inputs.name, inputs.path);
        }
        return `Application ${inputs.name} has been created at ${inputs.path}.\nType 'npm install' to populate dependencies.\nThen 'npm start' to start the application.`;
    }
};

