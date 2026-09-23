const AEvent = require('../../../../src/Server/AEvent');

module.exports = {
    friendlyName: 'receiveEvent',
    description: 'Record an event and release workflow steps whose triggers are satisfied.',
    inputs: {event: {type: 'json', required: true}},
    fn: async function (inputs) {
        const event = inputs.event;
        if (!event.type) throw new Error('Workflow events require a type');
        this.events = this.events || {};
        if (!this.events[event.type]) this.events[event.type] = [];
        this.events[event.type].push({
            id: event.id || `${event.type}:${Date.now()}`,
            type: event.type,
            timestamp: event.timestamp || new Date().toISOString(),
            correlationId: event.correlationId,
            payload: event.payload || {}
        });

        const evaluate = (rule, payload) => {
            if (rule.any) return rule.any.some(item => evaluate(item, payload));
            if (rule.all) return rule.all.every(item => evaluate(item, payload));
            const types = rule.events || (rule.event ? [rule.event] : []);
            if (types.length) {
                const present = types.map(type => (this.events[type] || []).length > 0);
                if ((rule.mode || 'and') === 'or' ? !present.some(Boolean) : !present.every(Boolean)) return false;
            }
            const guard = rule.guard || rule.condition;
            return !guard || (typeof guard === 'function'
                ? Boolean(guard(payload, this.context || {}))
                : Boolean(Function('payload', 'context', `return (${guard});`)(payload, this.context || {})));
        };

        let released = true;
        while (released) {
            released = false;
            for (const step of Object.values(this.steps || {})) {
                const definition = step.stepDefinition || {};
                if (step._state === 'Waiting' && definition.lifecycle?.stopWhen && evaluate(definition.lifecycle.stopWhen, event.payload || {})) {
                    step._state = 'Completed';
                    step.completedAt = new Date().toISOString();
                    const completionType = `workflow.step.${step.name}.completed`;
                    this.events[completionType] = this.events[completionType] || [];
                    const completionEvent = {
                        type: completionType,
                        correlationId: this.correlationId,
                        timestamp: new Date().toISOString(),
                        payload: step.outputs || {}
                    };
                    this.events[completionType].push(completionEvent);
                    AEvent.emit(completionType, completionEvent);
                    released = true;
                    continue;
                }
                if (step._state !== 'Pending') continue;
                const dependencies = definition.dependencyNames || definition.dependencies || [];
                const dependencyEvents = (Array.isArray(dependencies) ? dependencies : [dependencies])
                    .filter(Boolean).map(name => `workflow.step.${name}.completed`);
                const triggers = definition.triggers || definition.waitFor || [];
                const triggerList = Array.isArray(triggers) ? triggers : (triggers ? [triggers] : []);
                const dependenciesReady = dependencyEvents.every(type => (this.events[type] || []).length > 0);
                const triggersReady = triggerList.length === 0 || triggerList.some(trigger =>
                    typeof trigger === 'string'
                        ? (this.events[trigger] || []).length > 0
                        : evaluate(trigger, event.payload || {}));
                if ((dependencyEvents.length === 0 || dependenciesReady) && triggersReady) {
                    step._state = 'Ready';
                    released = true;
                }
            }
        }
        const steps = Object.values(this.steps || {});
        if (steps.length && steps.every(step => ['Completed', 'Skipped'].includes(step._state))) {
            this._state = 'Completed';
            if (global.AFileSystemWatcher?.stop) {
                global.AFileSystemWatcher.stop({correlationId: this.correlationId});
            }
        }
        await this.save();
        if (!Object.values(this.steps || {}).some(step => step._state === 'Ready') && this.planNext) {
            await this.planNext();
        }
        if (Object.values(this.steps || {}).some(step => step._state === 'Ready') && this.executeReady) {
            await this.executeReady();
        }
        return {event, released: Object.values(this.steps || {}).filter(step => step._state === 'Ready').map(step => step.name)};
    }
};
