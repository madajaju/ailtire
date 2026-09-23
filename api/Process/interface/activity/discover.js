
module.exports = {
    friendlyName: 'activity/discover',
    description: 'Find enabled activities matching workflow capabilities and context.',
    static: true,
    inputs: {
        capabilities: {type: 'json'},
        appliesTo: {type: 'json'}
    },
    outputs: {activities: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function (inputs) {
        const activities = await AActivityDefinition.instances();
        return {activities: AActivityDefinition.discover(activities, inputs)};
    }
};
