class AStepDefinition {
    static definition = {
        name: 'AStepDefinition',
        description: 'A discoverable node in a workflow graph.',
        unique: obj => obj.name,
        attributes: {
            name: {type: 'string', required: true},
            type: {type: 'string', required: true},
            ref: {type: 'string'},
            agent: {type: 'json', description: 'Agent capability and execution metadata for type="agent" steps.'},
            policy: {type: 'json', description: 'Execution policy for the step or agent.'},
            description: {type: 'string'},
            emits: {type: 'json'},
            lifecycle: {type: 'json'},
            triggers: {type: 'json'},
            inputs: {type: 'json'},
            outputs: {type: 'json'},
            capabilities: {type: 'json'},
            appliesTo: {type: 'json'},
            dependencies: {type: 'json'},
            dependencyNames: {type: 'json', description: 'Stable dependency names from the workflow definition.'},
            executionMode: {type: 'string'},
            retryPolicy: {type: 'json'},
            timeoutSeconds: {type: 'number'},
            waitFor: {type: 'json'},
            AHumanRequest: {type: 'json'}
        },
        associations: {
            workflow: {type: 'AWorkflowDefinition', cardinality: 1, owner: false, composition: false},
            dependencies: {type: 'AStepDefinition', cardinality: 'n', owner: false, composition: false}
        }
    };
}
module.exports = AStepDefinition;
