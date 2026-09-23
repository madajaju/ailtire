module.exports = {
    friendlyName: 'AWorkflowExecution/list',
    static: true,
    inputs: {state: {type: 'string'}},
    outputs: {executions: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const runs = await AWorkflowExecution.instances();
        return {
            executions: runs.filter(run => !inputs.state || run._state === inputs.state).map(run => ({
                ...(run._attributes || {}),
                id: run.id
            }))
        };
    }
};
