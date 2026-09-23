module.exports = {
    friendlyName: 'start',
    description: 'Start a workflow execution from a published workflow definition.',
    static: true,
    inputs: {
        workflowName: {type: 'string', required: true},
        workflowVersion: {type: 'string', required: true},
        inputs: {type: 'json'},
        correlationId: {type: 'string'}
    },
    fn: async function (inputs) {
        
        const definition = AWorkflow.find({name: inputs.workflowName});
        const id = `${inputs.workflowName}:${Date.now()}`;
        const run = new AWorkflowExecution({id});
            run.workflowVersion = inputs.workflowVersion,
            run.rootRunId = id,
            run.inputs =  inputs.inputs,
            run.context =  {
                inputs: inputs.inputs,
                facts: {},
                artifacts: {},
                decisions: {},
                observations: {},
                outputs: {},
                history: []
            },
            run.history = [],
            run.definition = definition,
            run.state = 'Running'
        for (const definitionStep of Object.values(definition.activities || {})) {
            const step = new AStepExecution({id: `${id}:${definitionStep.name}`});
            step.attempt = 1;
            step.stepDefinition = definitionStep;
            step.workflow = run;
            step.prepare();
            const dependencies = definitionStep.dependencyNames || definitionStep.dependencies || [];
            const triggers = definitionStep.triggers || definitionStep.waitFor || [];
            const hasDependencies = Array.isArray(dependencies) ? dependencies.length > 0 : Boolean(dependencies);
            const hasTriggers = Array.isArray(triggers) ? triggers.length > 0 : Boolean(triggers);
            if (!hasDependencies && !hasTriggers) step.ready();
            if (hasDependencies) step.waitingFor = (Array.isArray(dependencies) ? dependencies : [dependencies]).map(name => `workflow.step.${name}.completed`);
            run.addToSteps(step);
            await step.save();
        }
        await run.save();
        await run.executeReady();
        return {execution: {...(run._attributes || {}), id: run.id}};
    }
};
