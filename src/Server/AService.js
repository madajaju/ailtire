const bent = require('bent');

module.exports = {
    call: async (action, opts) => {
        let actions = action.split('.');
        let fn = findService(global.services[global.topPackage.shortname], actions);
        if (fn) {
            return fn(opts);
        } else {
            let url = 'http://localhost:3000/';
            const post = bent(url, 'POST', 'string', 200);
            const astring = action.replace(/\./g, '/');
            try {
                return await post(astring, opts);
            } catch (e) {
                console.error("Response Error:", e);
            }
        }
    },
};

const findService = (services, actions) => {
    if (typeof services === 'object') {
        let action = actions.shift();
        for (let i in services) {
            let service = services[i];
            if (i.toLowerCase() === action.toLowerCase()) {
                return findService(service, actions);
            }
        }
    } else if (typeof services === 'function') {
        return services;
    } else {
        return false;
    }
}
