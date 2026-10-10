module.exports = {
    friendlyName: 'AWorkflowDefinition/load',
    description: 'Load a versioned workflow definition from a JavaScript or JSON file.',
    static: true,
    inputs: {
        file: {type: 'string', required: true},
        replace: {type: 'boolean'}
    },
    outputs: {workflow: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) { return AWorkflowDefinition.load(inputs); }
};
