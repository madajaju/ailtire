const UserActivity = require('../../src/Server/UserActivity')
module.exports = {
    friendlyName: 'complete',
    description: 'Complete a UserActivity',
    static: true,
    inputs: {
        id: {
            description: 'The id of the workflow',
            type: 'string',
            required: true
        },
    },

    exits: {
        success: {},
        json: {
        },
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        // Find the scenario from the usecase.
        let uact = UserActivity.getInstance(inputs.id);
        uact.complete(inputs);
        return;
    }
};

