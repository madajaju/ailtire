module.exports = {
    friendlyName: 'AWorkflowDefinition/publish',
    description: 'Publish an immutable workflow definition version.',
    static: true,
    inputs: {
        name: {type: 'string', required: true},
        version: {type: 'string', required: true}
    },
    outputs: {workflow: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const workflow = AWorkflowDefinition.find(`${inputs.name}:${inputs.version}`);
        if (!workflow) throw new Error(`Workflow definition not found: ${inputs.name}:${inputs.version}`);
        if (!workflow.steps || Object.keys(workflow.steps).length === 0) throw new Error(`Workflow has no steps: ${inputs.name}:${inputs.version}`);
        workflow._state = 'Published';
        workflow.enabled = true;
        await workflow.save();
        return {workflow: {...(workflow._attributes || {})}};
    }
};
