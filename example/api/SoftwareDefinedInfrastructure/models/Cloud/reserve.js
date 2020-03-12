const path = require('path');

module.exports = {
    friendlyName: 'reserve',
    description: 'Reserve a resource',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
        request: {
            description: 'Request for the reservation',
            type: 'object', // string|boolean|number|json
            required: true
        },
    },

    exits: {
    },

    fn: function (obj, inputs, env) {
        let reservations = [];
        // Iterate through the datacenters
        for(let i in obj.datacenters) {
            let dc = obj.datacenters[i];
            let tres = dc.reserve({request:inputs.request});
            for(let j in tres) {
                obj.addToReservations(tres[j]);
                reservations.push(tres[j]);
            }
        }
        // Iterate through the adevices
        for(let i in obj.adevices) {
            let ad = obj.adevices[i];
            let tres = ad.reserve({request:inputs.request});
            for(let j in tres) {
                obj.addToReservations(tres[j]);
                reservations.push(tres[j]);
            }
        }
        // Iterate through the devices
        for(let i in obj.devices) {
            let device = obj.devices[i];
            let tres = device.reserve({request:inputs.request});
            for(let j in tres) {
                obj.addToReservations(tres[j]);
                reservations.push(tres[j]);
            }
        }
        // return all of the reservations.
        return reservations;
    }
};
