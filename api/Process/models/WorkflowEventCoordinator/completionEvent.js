module.exports = {
    friendlyName: 'completionEvent',
    description: 'Return the internal event emitted when a workflow step completes.',
    static: true,
    inputs: {stepName: {type: 'string', required: true}},
    fn: function (inputs) {
        return `workflow.step.${inputs.stepName}.completed`;
    }
};
