const AEvent = require('../../src/Server/AEvent');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');
const AWorkflow = require('../../src/Server/AWorkflow');

module.exports = {
    friendlyName: 'instance',
    description: 'Return one of the workflow Instances based on the id.',
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
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: async function (inputs, env) {
        let instance = AWorkflow.show({id:inputs.id});
        env.res.json(instance);
    }
};

