module.exports = {
    friendlyName: 'AWorkflowExecution/start', static: true,
    inputs: {
        workflowName: {type: 'string', required: true},
        workflowVersion: {type: 'string', required: true},
        inputs: {type: 'json'},
        correlationId: {type: 'string'}
    },
    outputs: {execution: {type: 'json'}}, exits: {json: obj => obj},
    fn: async function (inputs) {
        const definition = AWorkflowDefinition.find(`${inputs.workflowName}:${inputs.workflowVersion}`);
        if (!definition) throw new Error(`Workflow definition not found: ${inputs.workflowName}:${inputs.workflowVersion}`);
        const id = `${inputs.workflowName}:${inputs.workflowVersion}:${Date.now()}`;
        const run = new AWorkflowExecution({id});
        run.workflowVersion = inputs.workflowVersion;
        run.correlationId = inputs.correlationId;
        run.rootRunId = id;
        run.inputs = inputs.inputs || {};
        run.context = {inputs: run.inputs, facts: {}, artifacts: {}, decisions: {}, observations: {}, outputs: {}, history: []};
        run.history = [];
        run.definition = definition;
        run._state = 'Running';
        for (const AStepDefinition of Object.values(definition.steps || {})) {
            const step = new AStepExecution({id: `${id}:${AStepDefinition.name}`});
            step.attempt = 1;
            step.stepDefinition = AStepDefinition;
            step.workflow = run;
            step._state = 'Pending';
            step.lifecycleState = AStepDefinition.lifecycle?.mode || 'transient';
            const dependencies = AStepDefinition.dependencyNames || AStepDefinition.dependencies || [];
            const triggers = AStepDefinition.triggers || AStepDefinition.waitFor || [];
            const hasDependencies = Array.isArray(dependencies) ? dependencies.length > 0 : Boolean(dependencies);
            const hasTriggers = Array.isArray(triggers)
                ? triggers.length > 0
                : typeof triggers === 'object'
                    ? Object.keys(triggers).length > 0
                    : Boolean(triggers);
            if (!hasDependencies && !hasTriggers) {
                step._state = 'Ready';
            }
            if (hasDependencies) {
                const dependencyNames = Array.isArray(dependencies) ? dependencies : [dependencies];
                step.waitingFor = dependencyNames.map(name => `workflow.step.${name}.completed`);
            }
            run.addToSteps(step);
            await step.save();
        }
        await run.save();
        return {execution: {...(run._attributes || {}), id: run.id}};
    }
};
