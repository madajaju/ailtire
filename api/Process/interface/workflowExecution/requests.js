module.exports = {
    friendlyName: 'workflowExecution/requests',
    description: 'List open human requests.',
    static: true,
    inputs: {},
    outputs: {requests: {type: 'json'}},
    exits: {json: obj => obj},
    fn: async function () {
        const loaded = await AHumanRequest.instances();
        const requests = Array.isArray(loaded) ? loaded : Object.values(loaded || {});
        return {
            requests: requests.filter(item => item._state === 'Open').map(item => ({
                ...(item._attributes || {}),
                id: item.id
            }))
        };
    }
};
