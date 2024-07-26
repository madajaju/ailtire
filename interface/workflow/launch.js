const AEvent = require('../../src/Server/AEvent');
const AWorkflow = require('../../src/Server/AWorkflow');
const AWorkflowInstance = require('../../src/Server/AWorkflowInstance');

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

    fn: function (inputs, env) {
        // Find the Workflow
        let id = inputs.id.replace(/\s/g,'');
        if(global.workflows.hasOwnProperty(id)) {
            let workflow = global.workflows[id];
            let instances = AWorkflow.show({id:id});
            let instanceid = 0;
            if(instances) {
                instanceid = instances.length;
            }
            env.res.json({id: instanceid});
            AWorkflowInstance.launch(workflow, inputs);
        } else {
            AEvent.emit("workflow.failed", {message:"Workflow not found"});
        }
        return null;
    }
};

