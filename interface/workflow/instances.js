const AEvent = require('../../src/Server/AEvent');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');
const AWorkflowInstance = require('../../src/Server/AWorkflowInstance');
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
        let instances = AWorkflowInstance.instances();
        env.res.json(instances);
    }
};

