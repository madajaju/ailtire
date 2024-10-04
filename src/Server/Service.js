const axios = require('axios');

module.exports = {
    call: async (action, opts) => {
        let actions = action.split('.');
        let fn = findService(global.services[global.topPackage.shortname], actions);
        if (fn) {
            return fn(opts);
        } else {

            const url = 'http://localhost/';
            const astring = action.replace(/\./g, '/');

            try {
                const response = await axios.post(`${url}${astring}`, opts);
                return response.data;
            } catch (e) {
                console.error("POST:", astring);
                console.error("AService call Response Error:", e);
            }
        }
    },
};

const findService = (services, actions) => {
    if (typeof services === 'object') {
        let action = actions.shift();
        for (let i in services) {
            let service = services[i];
            if (i === action) {
                return findService(service, actions);
            }
        }
    } else if (typeof services === 'function') {
        return services;
    } else {
        return false;
    }
}
