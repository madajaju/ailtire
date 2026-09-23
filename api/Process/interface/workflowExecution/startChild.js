module.exports = {
    friendlyName: 'AWorkflowExecution/startChild',
    description: 'Start a child workflow execution from a parent workflow step.',
    static: true,
    inputs: {
        parentRunId: {type: 'string', required: true},
        stepName: {type: 'string', required: true},
        workflowName: {type: 'string', required: true},
        workflowVersion: {type: 'string', required: true},
        inputs: {type: 'json'},
        correlationId: {type: 'string'}
    },
    outputs: {execution: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const parent = AWorkflowExecution.find(inputs.parentRunId);
        if (!parent) throw new Error(`Parent workflow execution not found: ${inputs.parentRunId}`);
        const step = Object.values(parent.steps || {}).find(item =>
            (item.name || item._attributes?.name) === inputs.stepName
        );
        if (!step) throw new Error(`Step not found on parent execution: ${inputs.stepName}`);
        const definitionId = `${inputs.workflowName}:${inputs.workflowVersion}`;
        const definition = AWorkflowDefinition.find(definitionId);
        if (!definition) throw new Error(`Workflow definition not found: ${definitionId}`);
        if (definition.enabled === false) throw new Error(`Workflow definition is disabled: ${definitionId}`);
        const childId = `${parent.id}:${inputs.stepName}`;
        let child = AWorkflowExecution.find(childId);
        if (!child) child = new AWorkflowExecution({id: childId});
        child.workflowVersion = inputs.workflowVersion;
        child.correlationId = inputs.correlationId || parent.correlationId;
        child.causationId = parent.id;
        child.rootRunId = parent.rootRunId || parent.id;
        child.inputs = inputs.inputs || {};
        child.definition = definition;
        child.parent = parent;
        child._state = 'Running';
        step.childWorkflowRunId = child.id;
        step._state = 'Waiting';
        await child.save();
        await step.save();
        return {execution: {...(child._attributes || {}), id: child.id}};
    }
};
