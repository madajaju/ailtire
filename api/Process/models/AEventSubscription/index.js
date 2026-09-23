class AEventSubscription {
    static definition = {
        name: 'AEventSubscription',
        description: 'Durable subscription connecting an event to a workflow execution.',
        attributes: {
            eventType: {type: 'string', required: true},
            filter: {type: 'json'},
            action: {type: 'json'},
            expiresAt: {type: 'string'},
            active: {type: 'boolean'}
        },
        associations: {
            workflow: {type: 'AWorkflowExecution', cardinality: 1, owner: false, composition: false}
        }
    };
}
module.exports = AEventSubscription;
