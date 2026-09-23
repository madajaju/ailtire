class AWorkflowHandlerDefinition {
    static definition = {
        name: 'AWorkflowHandlerDefinition',
        description: 'Workflow-scoped reaction to a matching event.',
        attributes: {
            eventType: {type: 'string', required: true},
            filter: {type: 'json'},
            action: {type: 'json'},
            description: {type: 'string'}
        },
        associations: {
            workflow: {type: 'AWorkflowDefinition', cardinality: 1, owner: false, composition: false}
        }
    };
}
module.exports = AWorkflowHandlerDefinition;
