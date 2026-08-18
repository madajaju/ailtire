module.exports = {
    friendlyName: 'get',
    description: 'Get the referenced object from its remote service.',
    inputs: {opts: {type: 'json'}},
    fn: async function (obj, inputs) {
        const services = global._instances?.AService || {};
        const serviceMap = Object.create(null);
        for (const [name, registered] of Object.entries(services)) {
            serviceMap[String(name).toLowerCase()] = registered;
        }
        const serviceName = String(obj.service || '').toLowerCase();
        const service = serviceMap[serviceName];
        const base = service?.interface ? Object.keys(service.interface)[0] : null;
        if (!base) throw new Error(`No interface is registered for remote service ${obj.service}.`);
        const retval = await obj.call({
            actionName: `${base}/${String(obj.type || '').toLowerCase()}/get`,
            opts: { id: obj.rid}
        });
        return retval;
    }
};
