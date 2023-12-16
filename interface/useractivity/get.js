const path = require('path');
const UserActivity = require('../../src/Server/UserActivity');

module.exports = {
    friendlyName: 'get',
    description: 'Get a UserActivity',
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
        json: (obj) => {
            return obj.toJSON();
        },
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        // Find the scenario from the usecase.
        let result = UserActivity.getInstance(inputs.id);
        if(result) {
            return result;
        }
        return {status:'error', data: 'UserActivity not found!'};
    }
};

