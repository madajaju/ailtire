module.exports = {
    friendlyName: 'matches',
    description: 'Determine whether a trigger matches recorded workflow events and its guard.',
    inputs: {trigger: {type: 'json', required: true}, payload: {type: 'json'}, context: {type: 'json'}},
    fn: function (inputs) {
        const trigger = inputs.trigger;
        const events = trigger.events || (trigger.event ? [trigger.event] : []);
        const present = events.map(type => (this.events?.[type] || []).length > 0);
        const matches = (trigger.mode || 'and') === 'or' ? present.some(Boolean) : present.every(Boolean);
        if (!matches) return false;
        let payload = inputs.payload || {};
        if (!Object.keys(payload).length) {
            const latest = events.map(type => this.events[type]?.at(-1)).filter(Boolean).at(-1);
            payload = latest?.payload || {};
        }
        const guard = trigger.guard || trigger.condition;
        if (!guard) return true;
        if (typeof guard === 'function') return Boolean(guard(payload, inputs.context || {}));
        return Boolean(Function('payload', 'context', `return (${guard});`)(payload, inputs.context || {}));
    }
};
