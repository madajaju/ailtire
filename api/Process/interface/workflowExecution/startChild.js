module.exports = {
    friendlyName: 'AWorkflowExecution/startChild',
    description: 'Start a child workflow execution from a parent workflow step.',
    static: true,
    inputs: {
        parentRunId: {type: 'string', required: true},
        stepName: {type: 'string', required: true},
        workflowId: {type: 'string', required: false},
        workflowName: {type: 'string', required: false},
        workflowVersion: {type: 'string', required: false},
        inputs: {type: 'json'},
        correlationId: {type: 'string'}
    },
    outputs: {execution: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const parent = AWorkflowExecution.find(inputs.parentRunId);
        if (!parent) throw new Error(`Parent workflow execution not found: ${inputs.parentRunId}`);
        const step = Object.values(parent.steps || {}).find(item =>
            (item.name || item._attributes?.name) === inputs.stepName
        );
        if (!step) throw new Error(`Step not found on parent execution: ${inputs.stepName}`);
        const definitionId = inputs.workflowId || `${inputs.workflowName}:${inputs.workflowVersion}`;
        const definition = AWorkflowDefinition.find(definitionId);
        if (!definition) throw new Error(`Workflow definition not found: ${definitionId}`);
        if (definition.enabled === false) throw new Error(`Workflow definition is disabled: ${definitionId}`);
        const childId = `${parent.id}:${inputs.stepName}`;
        let child = AWorkflowExecution.find(childId);
        if (!child) child = new AWorkflowExecution({id: childId});
        child.workflowId = definition.id;
        child.workflowVersion = inputs.workflowVersion || definition.version;
        child.correlationId = inputs.correlationId || parent.correlationId;
        child.causationId = parent.id;
        child.rootRunId = parent.rootRunId || parent.id;
        child.inputs = inputs.inputs || {};
        child.definition = definition;
        child.parent = parent;
        child._state = 'Running';
        child.context = {inputs: child.inputs, facts: {}, artifacts: {}, decisions: {}, observations: {}, outputs: {}, history: []};
        for (const definitionStep of Object.values(definition.steps || {})) {
            const childStep = new AStepExecution({id: `\${child.id}:\${definitionStep.name}`});
            childStep.attempt = 1;
            childStep.stepDefinition = definitionStep;
            childStep.workflow = child;
            childStep._state = 'Pending';
            childStep.lifecycleState = definitionStep.lifecycle?.mode || 'transient';
            const dependencies = definitionStep.dependencyNames || definitionStep.dependencies || [];
            const triggers = definitionStep.triggers || definitionStep.waitFor || [];
            const hasDependencies = Array.isArray(dependencies) ? dependencies.length > 0 : Boolean(dependencies);
            const hasTriggers = Array.isArray(triggers) ? triggers.length > 0 : Boolean(triggers);
            if (!hasDependencies && !hasTriggers) childStep._state = 'Ready';
            if (hasDependencies) childStep.waitingFor = (Array.isArray(dependencies) ? dependencies : [dependencies]).map(name => `workflow.step.\${name}.completed`);
            child.addToSteps(childStep);
            await childStep.save();
        }
        step.childWorkflowRunId = child.id;
        step._state = 'Waiting';
        await child.save();
        await step.save();
        if (child.executeReady) await child.executeReady();
        return {execution: {...(child._attributes || {}), id: child.id}};
    }
};
