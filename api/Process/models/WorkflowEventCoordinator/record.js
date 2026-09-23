module.exports = {
    friendlyName: 'record',
    description: 'Record an event received by a workflow execution.',
    inputs: {event: {type: 'json', required: true}},
    fn: function (inputs) {
        const event = inputs.event;
        if (!event.type) throw new Error('Workflow events require a type');
        this.events = this.events || {};
        if (!this.events[event.type]) this.events[event.type] = [];
        const recorded = {
            id: event.id || `${event.type}:${Date.now()}`,
            type: event.type,
            timestamp: event.timestamp || new Date().toISOString(),
            correlationId: event.correlationId,
            payload: event.payload || {}
        };
        this.events[event.type].push(recorded);
        return recorded;
    }
};
