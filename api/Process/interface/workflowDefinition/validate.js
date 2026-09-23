
module.exports = {
    friendlyName: 'AWorkflowDefinition/validate',
    description: 'Validate workflow inputs and declared output contracts.',
    static: true,
    inputs: {
        name: {type: 'string', required: true},
        version: {type: 'string', required: true},
        values: {type: 'json'},
        outputs: {type: 'json'}
    },
    outputs: {
        valid: {type: 'boolean'},
        inputErrors: {type: 'json'},
        outputErrors: {type: 'json'}
    },
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const workflow = AWorkflowDefinition.find(`${inputs.name}:${inputs.version}`);
        if (!workflow) throw new Error(`Workflow definition not found: ${inputs.name}:${inputs.version}`);
        const result = AWorkflowDefinition.validate({workflowInputs: workflow.inputs || {}, workflowOutputs: workflow.outputs || {}, values: inputs.values || {}, outputs: inputs.outputs || {}});
        const inputErrors = result.inputErrors;
        const outputErrors = result.outputErrors;
        return {valid: inputErrors.length === 0 && outputErrors.length === 0, inputErrors, outputErrors};
    }
};
