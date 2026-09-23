module.exports = {
    friendlyName: 'AWorkflowExecution/progress',
    description: 'Return workflow execution progress and step status for UI clients.',
    static: true,
    inputs: {id: {type: 'string', required: true}},
    outputs: {progress: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const run = AWorkflowExecution.find(inputs.id);
        if (!run) throw new Error(`Workflow execution not found: ${inputs.id}`);
        const steps = Object.values(run.steps || {}).map(step => ({
            id: step.id,
            name: step.name || step._attributes?.name,
            state: step._state,
            attempt: step.attempt || 1,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            error: step.error,
            childWorkflowRunId: step.childWorkflowRunId
        }));
        const completed = steps.filter(step => ['Completed', 'Skipped'].includes(step.state)).length;
        return {progress: {
            id: run.id,
            state: run._state,
            total: steps.length,
            completed,
            percent: steps.length ? Math.round((completed / steps.length) * 100) : 0,
            steps
        }};
    }
};
