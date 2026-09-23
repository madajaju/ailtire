class AWorkflowDefinition {
    static definition = {
        name: 'AWorkflowDefinition',
        description: 'Versioned reusable workflow graph definition.',
        unique: obj => `${obj.name}:${obj.version}`,
        attributes: {
            name: {type: 'string', required: true},
            version: {type: 'string', required: true},
            description: {type: 'string'},
            mode: {type: 'string', description: 'Execution mode: deterministic, hybrid, or adaptive.'},
            goal: {type: 'string', description: 'Outcome the workflow is intended to achieve.'},
            inputs: {type: 'json'},
            outputs: {type: 'json'},
            tools: {type: 'json', description: 'Tools available to agent activities in this workflow.'},
            capabilities: {type: 'json', description: 'Activities and tools available to an adaptive planner.'},
            contextConfig: {type: 'json', description: 'Rules for building and retaining workflow context.'},
            planning: {type: 'json', description: 'Adaptive planning limits and policies.'},
            completionPolicy: {type: 'json'},
            enabled: {type: 'boolean'}
        },
        associations: {
            steps: {type: 'AStepDefinition', cardinality: 'n', owner: true, composition: true, via: 'workflow'},
            triggers: {type: 'ATrigger', cardinality: 'n', owner: true, composition: true, via: 'workflow'},
            handlers: {type: 'AWorkflowHandlerDefinition', cardinality: 'n', owner: true, composition: true, via: 'workflow'}
        },
        statenet: {
            Init: {events: {publish: {Published: {}}}},
            Published: {events: {retire: {Retired: {}}}},
            Retired: {}
        }
    };
}
module.exports = AWorkflowDefinition;
