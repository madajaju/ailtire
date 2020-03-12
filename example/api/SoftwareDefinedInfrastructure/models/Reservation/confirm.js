const path = require('path');

module.exports = {
    friendlyName: 'confirm',
    description: 'Confirm the Reservation',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
    },

    exits: {
    },

    fn: function (obj, inputs, env) {
        console.log("Confirm Reservation");
        // inputs contains the obj for the this method.
        // obj has the obj for the method.
    }
};
