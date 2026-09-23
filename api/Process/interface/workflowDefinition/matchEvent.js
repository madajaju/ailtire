module.exports = {
    friendlyName: 'AWorkflowDefinition/matchEvent',
    description: 'Find active workflow subscriptions matching an event.',
    static: true,
    inputs: {
        subscriptions: {type: 'json'},
        eventType: {type: 'string', required: true},
        payload: {type: 'json'}
    },
    outputs: {matches: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        return AWorkflowDefinition.matchEvent(inputs);
    }
};
