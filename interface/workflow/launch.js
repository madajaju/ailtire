const AEvent = require('../../src/Server/AEvent');
const AWorkflow = require('../../src/Server/AWorkflow');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');

module.exports = {
    friendlyName: 'launch',
    description: 'Launch a Workflow in a UseCase',
    static: true,
    inputs: {
        id: {
            description: 'The id of the scenario',
            type: 'string',
            required: true
        },
    },

    exits: {
    },

    fn: async function (inputs, env) {
        // Find the Workflow
        if(global.workflows.hasOwnProperty(inputs.id)) {
            let workflow = global.workflows[inputs.id];
            let instances = AWorkflow.show({id:inputs.id});
            let instanceid = 0;
            if(instances) {
                instanceid = instances.length;
            }
            env.res.json({id: instanceid});
            AWorkflow.launch(workflow, inputs);
        } else {
            AEvent.emit("workflow.failed", {obj:{error: "Workflow not found"}});
        }
       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return null;
    }
};

