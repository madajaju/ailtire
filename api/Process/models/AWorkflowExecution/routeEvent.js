module.exports = {
    friendlyName: 'routeEvent',
    description: 'Route a normalized event to all matching active workflow executions.',
    static: true,
    inputs: {event: {type: 'json', required: true}},
    fn: async function (inputs) {
        const event = inputs.event;
        const loaded = await AWorkflowExecution.instances();
        const executions = Array.isArray(loaded) ? loaded : Object.values(loaded || {});
        const results = [];
        for (const run of executions) {
            if (!run || !['Running', 'Waiting'].includes(run._state)) continue;
            if (event.correlationId && run.correlationId && event.correlationId !== run.correlationId) continue;
            if (run.receiveEvent) results.push(await run.receiveEvent({event}));
        }
        return results;
    }
};
