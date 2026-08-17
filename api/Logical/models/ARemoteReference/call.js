module.exports = {
    friendlyName: 'call',
    description: 'Call an interface on the referenced remote service.',
    inputs: {
        actionName: { type: 'string', required: true },
        opts: { type: 'json' }
    },
    fn: async function (obj, inputs) {
        const opts = { ...(inputs?.opts || {}) };
        if (opts.id === undefined) opts.id = obj.rid;
        return await AService.call({actionName: inputs.actionName, opts: opts});
    }
};
