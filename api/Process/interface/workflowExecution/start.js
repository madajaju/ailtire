module.exports = {
    friendlyName: 'AWorkflowExecution/start', static: true,
    inputs: {
        workflowId: {type: 'string', required: false},
        workflowName: {type: 'string', required: false},
        workflowVersion: {type: 'string', required: false},
        inputs: {type: 'json'},
        correlationId: {type: 'string'}
    },
    outputs: {execution: {type: 'json'}}, exits: {json: obj => obj},
    fn: async function (inputs) {
        const definitionId = inputs.workflowId || `${inputs.workflowName}:${inputs.workflowVersion}`;
        const definition = AWorkflowDefinition.find(definitionId);
        if (!definition) throw new Error(`Workflow definition not found: ${definitionId}`);
        const workflowVersion = inputs.workflowVersion || definition.version;
        const id = `${definition.id}:${Date.now()}`;
        const run = new AWorkflowExecution({id});
        run.workflowId = definition.id;
        run.workflowVersion = workflowVersion;
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
        if (run.executeReady) await run.executeReady();
        return {execution: {...(run._attributes || {}), id: run.id}};
    }
};
