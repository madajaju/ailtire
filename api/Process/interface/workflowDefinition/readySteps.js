module.exports = {
    friendlyName: 'AWorkflowDefinition/readySteps',
    description: 'Find executable workflow steps and evaluate completion.',
    static: true,
    inputs: {
        steps: {type: 'json', required: true},
        executions: {type: 'json'},
        completionPolicy: {type: 'json'}
    },
    outputs: {ready: {type: 'json'}, completion: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        return AWorkflowDefinition.readySteps(inputs);
    }
};
