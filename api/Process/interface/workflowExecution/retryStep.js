module.exports = {
    friendlyName: 'AWorkflowExecution/retryStep',
    description: 'Retry a failed workflow step when its retry policy allows another attempt.',
    static: true,
    inputs: {
        runId: {type: 'string', required: true},
        stepName: {type: 'string', required: true}
    },
    outputs: {step: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const run = AWorkflowExecution.find(inputs.runId);
        if (!run) throw new Error(`Workflow execution not found: ${inputs.runId}`);
        const step = Object.values(run.steps || {}).find(item =>
            (item.name || item._attributes?.name) === inputs.stepName
        );
        if (!step) throw new Error(`Step not found: ${inputs.stepName}`);
        if (step._state !== 'Failed') throw new Error(`Only failed steps can be retried: ${inputs.stepName}`);
        const definition = step.stepDefinition;
        if (!AStepExecution.canRetry(step, definition)) throw new Error(`Retry limit reached: ${inputs.stepName}`);
        step.attempt = Number(step.attempt || 1) + 1;
        step.error = null;
        step.startedAt = null;
        step.completedAt = null;
        step._state = 'Ready';
        await step.save();
        return {step: {...(step._attributes || {}), id: step.id}};
    }
};
