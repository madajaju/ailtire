const fs = require('fs');
const path = require('path');

function workflowNamespace(directory) {
    const parts = [];
    let current = directory;
    while (current && current !== path.dirname(current)) {
        const name = path.basename(current);
        if (name.toLowerCase() === 'workflows') return parts.reverse().join('/');
        parts.push(name);
        current = path.dirname(current);
    }
    return parts.reverse().join('/') || path.basename(directory);
}

function registerWorkflowActivities(file) {
    const directory = path.dirname(file);
    const activitiesDirectory = path.join(directory, 'activities');
    if (!fs.existsSync(activitiesDirectory)) return [];
    global.actions = global.actions || {};
    global.interface = global.interface || {};
    const namespace = workflowNamespace(directory).replace(/\\/g, '/');
    const registered = [];
    for (const entry of fs.readdirSync(activitiesDirectory, {withFileTypes: true})) {
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.js')) continue;
        const activityFile = path.join(activitiesDirectory, entry.name);
        delete require.cache[require.resolve(activityFile)];
        const action = require(activityFile);
        if (!action || typeof action.fn !== 'function') continue;
        const actionName = `${namespace}/${path.basename(entry.name, '.js')}`.toLowerCase();
        action.path = `/${actionName}`;
        action.name = action.name || actionName;
        action.package = global.topPackage;
        global.actions[actionName] = action;
        global.interface[actionName] = action;
        global.actions[`/${actionName}`] = action;
        global.interface[`/${actionName}`] = action;
        registered.push(actionName);
    }
    return registered;
}

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
    fn: async function (inputs) {
        if (!fs.existsSync(inputs.file)) throw new Error(`Workflow definition file not found: ${inputs.file}`);
        let definition;
        if (inputs.file.toLowerCase().endsWith('.json')) {
            definition = JSON.parse(fs.readFileSync(inputs.file, 'utf8'));
        } else {
            delete require.cache[require.resolve(inputs.file)];
            definition = require(inputs.file);
        }
        registerWorkflowActivities(inputs.file);
        if (!definition.name) throw new Error('Workflow definition requires name');
        if (!definition.version) throw new Error(`Workflow ${definition.name} requires version`);
        const id = `${definition.name}:${definition.version}`;
        let workflow = AWorkflowDefinition.find(id);
        if (workflow && !inputs.replace) throw new Error(`Workflow definition already exists: ${id}`);
        if (!workflow) workflow = new AWorkflowDefinition({id, name: definition.name, version: definition.version});
        workflow.id = id;
        workflow.name = definition.name;
        workflow.version = definition.version;
        workflow.description = definition.description;
        workflow.inputs = definition.inputs || {};
        workflow.outputs = definition.outputs || {};
        workflow.tools = definition.tools || [];
        workflow.mode = definition.mode || 'deterministic';
        workflow.goal = definition.goal;
        workflow.capabilities = definition.capabilities || [];
        workflow.contextConfig = definition.contextConfig || {};
        workflow.planning = definition.planning || {};
        workflow.completionPolicy = definition.completionPolicy || {mode: 'all'};
        workflow.enabled = definition.enabled !== false;
        for (const [name, stepData] of Object.entries(definition.steps || definition.activities || {})) {
            const step = new AStepDefinition({id: `${id}:${name}`, name, type: stepData.type || 'task'});
            step.name = name;
            step.type = stepData.type || 'task';
            step.ref = stepData.ref;
            step.workflow = stepData.workflow;
            step.agent = stepData.agent;
            step.policy = stepData.policy;
            step.description = stepData.description;
            step.emits = stepData.emits || {};
            step.lifecycle = stepData.lifecycle;
            step.triggers = stepData.triggers || [];
            step.inputs = stepData.inputs || {};
            step.outputs = stepData.outputs || {};
            step.capabilities = stepData.capabilities || [];
            step.appliesTo = stepData.appliesTo || {};
            step.dependencies = stepData.dependencies || stepData.dependsOn || [];
            step.dependencyNames = stepData.dependencies || stepData.dependsOn || [];
            step.executionMode = stepData.executionMode || 'async';
            step.retryPolicy = stepData.retryPolicy || {};
            step.timeoutSeconds = stepData.timeoutSeconds;
            step.waitFor = stepData.waitFor;
            step.AHumanRequest = stepData.AHumanRequest;
            step.workflow = workflow;
            workflow.addToSteps(step);
        }
        for (const step of Object.values(workflow.steps || {})) {
            step.dependencies = (step.dependencyNames || [])
                .map(name => workflow.steps[name] || AStepDefinition.find(`${id}:${name}`))
                .filter(Boolean);
        }
        workflow._state = 'Draft';
        await workflow.save();
        return {workflow: {...(workflow._attributes || {}), steps: Object.values(workflow.steps || {}).map(step => step._attributes || step)}};
    }
};
