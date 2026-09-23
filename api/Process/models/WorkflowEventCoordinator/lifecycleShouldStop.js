module.exports = {
    friendlyName: 'lifecycleShouldStop',
    description: 'Evaluate whether a persistent workflow step should stop.',
    inputs: {lifecycle: {type: 'json', required: true}, payload: {type: 'json'}, context: {type: 'json'}},
    fn: function (inputs) {
        const stopWhen = inputs.lifecycle.stopWhen;
        if (!stopWhen) return false;
        const evaluate = clause => {
            if (clause.event || clause.events || clause.guard || clause.condition) {
                const events = clause.events || (clause.event ? [clause.event] : []);
                const present = events.map(type => (this.events?.[type] || []).length > 0);
                const eventMatch = (clause.mode || 'and') === 'or' ? present.some(Boolean) : present.every(Boolean);
                if (!eventMatch) return false;
                const guard = clause.guard || clause.condition;
                if (!guard) return true;
                if (typeof guard === 'function') return Boolean(guard(inputs.payload || {}, inputs.context || {}));
                return Boolean(Function('payload', 'context', `return (${guard});`)(inputs.payload || {}, inputs.context || {}));
            }
            if (clause.any) return clause.any.some(evaluate);
            if (clause.all) return clause.all.every(evaluate);
            return false;
        };
        return evaluate(stopWhen);
    }
};
