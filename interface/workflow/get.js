const path = require('path');
module.exports = {
    friendlyName: 'get',
    description: 'Get a Workflow',
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

    fn: function (inputs, env) {
        // Find the scenario from the usecase.

       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        if(global.workflows.hasOwnProperty(inputs.id)) {
            let workflow = global.workflows[inputs.id];
            // If the workflow does not have inputs then grab the inputs from the Init Activity
            env.res.json(workflow);
            return;
        }
        return env.res.json({status:'error', data: 'Workflow not found!'});
    }
};

