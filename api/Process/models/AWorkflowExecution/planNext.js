module.exports = {
    friendlyName: 'planNext',
    description: 'Ask the configured planner for the next allowed workflow capability.',
    inputs: {},
    fn: async function () {
        const definition = this.definition || {};
        const mode = definition.mode || 'deterministic';
        if (!['adaptive', 'hybrid'].includes(mode)) return {planned: false, reason: 'deterministic'};
        const planner = global.AWorkflowPlanner || global.ailtire?.workflowPlanner;
        if (!planner) return {planned: false, reason: 'no planner configured'};
        this.history = this.history || [];
        const planning = definition.planning || {};
        const maxSteps = planning.maxSteps || 20;
        if (this.history.filter(item => item.type === 'planner.decision').length >= maxSteps) throw new Error('Workflow planning step limit exceeded');
        const capabilities = definition.capabilities || [];
        const pending = Object.values(this.steps || {}).filter(step => step._state === 'Pending');
        const envelope = {goal: definition.goal, mode, inputs: this.inputs || {}, context: this.context || {}, capabilities, availableTools: definition.tools || [], pendingSteps: pending.map(step => step.name), history: this.history};
        const decision = typeof planner === 'function' ? await planner(envelope) : await planner.plan(envelope);
        if (!decision || !decision.activity) throw new Error('Workflow planner must return an activity');
        const step = this.steps[decision.activity];
        if (!step || step._state !== 'Pending') throw new Error(`Planner selected unavailable activity: ${decision.activity}`);
        const capability = capabilities.find(item => (typeof item === 'string' ? item : item.activity) === decision.activity);
        if (capabilities.length && !capability) throw new Error(`Planner selected activity outside workflow capabilities: ${decision.activity}`);
        const dependencies = step.stepDefinition?.dependencyNames || step.stepDefinition?.dependencies || [];
        const names = Array.isArray(dependencies) ? dependencies : [dependencies];
        if (names.some(name => !['Completed', 'Skipped'].includes(this.steps[name]?._state))) throw new Error(`Planner selected activity before dependencies completed: ${decision.activity}`);
        step._state = 'Ready';
        this.history.push({type: 'planner.decision', activity: decision.activity, reason: decision.reason, confidence: decision.confidence, timestamp: new Date().toISOString()});
        await this.save();
        return {planned: true, activity: decision.activity};
    }
};
