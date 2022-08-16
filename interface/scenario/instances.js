const AEvent = require('../../src/Server/AEvent');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');
module.exports = {
    friendlyName: 'instances',
    description: 'Return all of the scenario Instances',
    static: true,
    inputs: {
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: async function (inputs, env) {
        let instances = AScenarioInstance.instances();
        env.res.json(instances);
    }
};

