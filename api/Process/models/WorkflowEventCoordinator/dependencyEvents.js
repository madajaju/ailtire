module.exports = {
    friendlyName: 'dependencyEvents',
    description: 'Convert workflow step dependencies into internal completion events.',
    static: true,
    inputs: {dependencies: {type: 'json'}},
    fn: function (inputs) {
        const dependencies = inputs.dependencies || [];
        return dependencies.map(stepName => `workflow.step.${stepName}.completed`);
    }
};
