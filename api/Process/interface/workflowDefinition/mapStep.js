module.exports = {
    friendlyName: 'AWorkflowDefinition/mapStep',
    description: 'Resolve step inputs and merge step outputs into workflow context.',
    static: true,
    inputs: {
        inputMapping: {type: 'json'},
        outputMapping: {type: 'json'},
        context: {type: 'json'},
        outputs: {type: 'json'}
    },
    outputs: {inputs: {type: 'json'}, context: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        return AWorkflowDefinition.mapStep(inputs);
    }
};
