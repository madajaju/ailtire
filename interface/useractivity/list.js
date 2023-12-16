const UserActivity = require('../../src/Server/UserActivity');

module.exports = {
    friendlyName: 'list',
    description: 'List the UserActivities',
    inputs: {
    },
    exits: {
        json: (obj) => {
            return obj;
        },
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },
    fn: function (inputs, env) {
        let retval = [];
        let instances = UserActivity.instances();
        for(let i in instances) {
            retval.push(instances[i].toJSON());
        }
        return retval;
    }
};


