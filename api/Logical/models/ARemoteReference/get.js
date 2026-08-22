module.exports = {
    friendlyName: 'get',
    description: 'Get the referenced object from its remote service.',
    inputs: {opts: {type: 'json'}},
    fn: async function (obj, inputs) {
        const attrs = obj?._attributes && typeof obj._attributes === 'object'
            ? obj._attributes
            : {};
        const serviceNameValue = obj?.service || attrs.service;
        const typeValue = obj?.type || attrs.type || obj?.remoteType || attrs.remoteType;
        const ridValue = obj?.rid || attrs.rid || obj?.id || attrs.id || obj?.name || attrs.name;
        const services = global._instances?.AService || {};
        const serviceMap = Object.create(null);
        for (const [name, registered] of Object.entries(services)) {
            serviceMap[String(name).toLowerCase()] = registered;
        }
        const serviceName = String(serviceNameValue || '').toLowerCase();
        const service = serviceMap[serviceName];
        const base = service?.interface ? Object.keys(service.interface)[0] : null;
        if (!base) throw new Error(`No interface is registered for remote service ${serviceNameValue}.`);
        if (!ridValue) return null;
        console.log(`Getting ${typeValue} from ${serviceNameValue} with id ${ridValue}`);
        try {
            const retval = await obj.call({
                actionName: `${base}/${String(typeValue || '').toLowerCase()}/get`,
                opts: { id: String(ridValue)}
            });
            return retval;
        } catch (error) {
            const status = error?.response?.status || error?.status || error?.statusCode;
            if (status === 404) {
                return null;
            }
            throw error;
        }
    }
};
