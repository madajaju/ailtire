class AHumanRequest {
    static definition = {
        name: 'AHumanRequest',
        description: 'A durable request for human input during workflow execution.',
        attributes: {
            prompt: {type: 'string', required: true},
            form: {type: 'json'},
            assignee: {type: 'string'},
            requestedAt: {type: 'string'},
            respondedAt: {type: 'string'}
        },
        associations: {
            workflow: {type: 'AWorkflowExecution', cardinality: 1, owner: false, composition: false},
            step: {type: 'AStepExecution', cardinality: 1, owner: false, composition: false},
            response: {type: 'AHumanResponse', cardinality: 1, owner: true, composition: true, via: 'request'}
        },
        statenet: {
            Open: {events: {respond: {Completed: {}}, cancel: {Cancelled: {}}}},
            Completed: {}, Cancelled: {}
        }
    };
}
module.exports = AHumanRequest;
