const path = require('path');
const fs = require('fs');

module.exports = {
    friendlyName: 'executeReady',
    description: 'Execute ready workflow steps and publish their completion events.',
    inputs: {},
    fn: async function (obj, inputs) {
        const completed = [];
        const resolve = value => {
            if (typeof value !== 'string' || !value.startsWith('$')) return value;
            const source = value.slice(1).split('.');
            const events = Object.fromEntries(Object.entries(obj.events || {}).map(([type, values]) => [type, values.at(-1)?.payload || {}]));
            let current;
            if (source[0] === 'event') {
                current = Object.values(obj.events || {}).flat().at(-1)?.payload || {};
                source.shift();
            } else if (source[0] === 'steps') {
                current = Object.fromEntries(Object.entries(obj.steps || {}).map(([name, step]) => [name, {outputs: step.outputs || {}}]));
                source.shift();
            } else {
                current = {inputs: obj.inputs || {}, context: obj.context || {}, events};
            }
            for (const part of source) current = current?.[part];
            return current;
        };
        for (const step of Object.values(obj.steps || {})) {
            if (step.state !== 'Ready') continue;
            const definition = step.stepDefinition || {};
            step.execute();
            step.startedAt = new Date().toISOString();
            try {
                const inputDefinition = definition.inputs || {};
                const inputs = Object.fromEntries(Object.entries(inputDefinition).map(([name, value]) => [name, resolve(value)]));
                if (definition.type === 'human' || definition.humanRequest || definition.AHumanRequest) {
                    if (!global.AHumanRequest) throw new Error('AHumanRequest is not available');
                    const requestId = `${obj.id}:${step.name}:${Date.now()}`;
                    const request = new global.AHumanRequest({id: requestId});
                    request.baseDir = path.join(process.cwd(), 'podcasts', 'ahumanrequest', request.id);
                    fs.mkdirSync(request.baseDir, {recursive: true});
                    request.prompt = definition.humanRequest?.prompt || definition.description || `Complete ${step.name}`;
                    request.form = definition.humanRequest?.form || definition.inputs || {};
                    request.assignee = definition.humanRequest?.assignee;
                    request.requestedAt = new Date().toISOString();
                    request.workflow = obj;
                    request.step = step;
                    request.state = 'Open';
                    step.request = request;
                    step.wait();
                    obj.wait();
                    if (!obj.requests) obj.requests = {};
                    obj.requests[request.id] = request;
                    await request.save();
                    continue;
                }
                let result;
                if (definition.type === 'agent') {
                    const runner = global.AAgentRunner || global.ailtire?.agentRunner;
                    if (!runner) throw new Error(`No AAgentRunner configured for activity ${step.name}`);
                    const context = {
                        workflow: obj,
                        step,
                        activity: definition,
                        correlationId: obj.correlationId,
                        inputs,
                        values: obj.context || {},
                        event: Object.values(obj.events || {}).flat().at(-1)
                    };
                    const workflowTools = obj.definition?.tools || obj.workflow?.tools || [];
                    const declaredTools = definition.agent?.tools || definition.tools || [];
                    context.toolCatalog = workflowTools;
                    context.allowedTools = declaredTools.length
                        ? declaredTools
                        : workflowTools.map(tool => typeof tool === 'string' ? tool : tool.name).filter(Boolean);
                    result = typeof runner === 'function'
                        ? await runner(definition.agent || definition.ref, inputs, context)
                        : await runner.run(definition.agent || definition.ref, inputs, context);
                } else {
                    try {
                        result = definition.ref ? await AService.call({actionName: definition.ref, opts: inputs}) : {};
                    }
                    catch(e) {
                        console.error(e);
                    }
                }
                step.outputs = result?.outputs || result || {};
                obj.context = obj.context || {};
                obj.context.outputs = obj.context.outputs || {};
                obj.context.outputs[step.name] = step.outputs;
                obj.context[step.name] = step.outputs;
                obj.context.history = obj.context.history || [];
                obj.context.history.push({
                    type: 'activity.completed',
                    activity: step.name,
                    outputs: step.outputs,
                    timestamp: new Date().toISOString()
                });
                obj.history = obj.history || [];
                obj.history.push({
                    type: 'activity.completed',
                    activity: step.name,
                    timestamp: new Date().toISOString()
                });
                if (definition.lifecycle?.mode === 'presistent') {
                    step.wait();
                } else {
                    step.complete();
                }
                step.completedAt = step.state === 'Completed' ? new Date().toISOString() : undefined;
                if (step.state === 'Completed') {
                    const declaredEvents = Array.isArray(definition.emits)
                        ? definition.emits
                        : Object.keys(definition.emits || {});
                    for (const eventType of declaredEvents) {
                        AEvent.emit({
                            event: eventType, data: {
                                type: eventType,
                                correlationId: obj.correlationId,
                                payload: step.outputs
                            }
                        });
                    }
                    const eventType = `workflow.step.${step.name}.completed`;
                    AEvent.emit({
                        event: eventType,
                        data: {type: eventType, correlationId: obj.correlationId, payload: step.outputs}
                    });
                    completed.push(step.name);
                }
            } catch (error) {
                step.error = {message: error.message, stack: error.stack};
                step.fail();
                obj.fail();
                if (global.AFileSystemWatcher?.stop) {
                    global.AFileSystemWatcher.stop({correlationId: obj.correlationId});
                }
                throw error;
            }
        }
        const steps = Object.values(obj.steps || {});
        if (steps.length && steps.every(step => ['Completed', 'Skipped'].includes(step.state))) {
            obj.completed();
            if (global.AFileSystemWatcher?.stop) {
                global.AFileSystemWatcher.stop({correlationId: obj.correlationId});
            }
        }
        await obj.save();
        return {completed};
    }
};
