module.exports = {
    friendlyName: 'get',
    description: 'Get the referenced object from its remote service.',
    inputs: {opts: {type: 'json'}},
    fn: async function (obj, inputs) {
        const services = global._instances?.AService || {};
        const service = services[obj.service];
        const base = service?.interface ? Object.keys(service.interface)[0] : null;
        if (!base) throw new Error(`No interface is registered for remote service ${obj.service}.`);
        const retval = await obj.call({
            actionName: `${base}/${String(obj.type || '').toLowerCase()}/get`,
            opts: { id: obj.rid}
        });
        return retval;
    }
};
