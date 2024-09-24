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
    },

    fn: function (inputs, env) {
        // Find the scenario from the usecase.
        if(typeof inputs.id !== "string") {
            inputs.id = inputs.id[0];
        }
        let uact = UserActivity.getInstance(inputs.id);
        if(uact) {
            uact.complete(inputs);
            return uact;
        } else {
            return "No UserActivity found with id: " + inputs.id;
        }
    }
};

