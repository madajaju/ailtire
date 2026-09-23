module.exports = {
    friendlyName: 'readySteps',
    description: 'Find ready workflow steps.',
    static: true,
    inputs: {steps: {type: 'json', required: true}, executions: {type: 'json'}, completionPolicy: {type: 'json'}},
    outputs: {ready: {type: 'json'}, completion: {type: 'json'}},
    fn: function (inputs) {
        const executions = inputs.executions || {};
        const ready = Object.values(inputs.steps || {}).filter(step => (!executions[step.name] || ['Pending', 'Ready'].includes(executions[step.name].state)) && (step.dependencies || []).every(name => ['Completed', 'Skipped'].includes(executions[name]?.state))).map(step => step.name);
        const states = Object.values(inputs.steps || {}).map(step => executions[step.name]?.state);
        const completed = states.filter(state => ['Completed', 'Skipped'].includes(state)).length;
        return {
            ready,
            completion: {
                complete: completed === states.length && states.length > 0,
                failed: states.some(state => ['Failed', 'Cancelled'].includes(state))
            }
        };
    }
};
