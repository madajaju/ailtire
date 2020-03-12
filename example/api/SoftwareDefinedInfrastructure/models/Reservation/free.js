const path = require('path');

module.exports = {
    friendlyName: 'free',
    description: 'Description of the method',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
    },

    exits: {
    },

    fn: function (obj, inputs, env) {
        // inputs contains the obj for the this method.
        // obj has the obj for the method.
        console.log("Free Reservation:", obj);
    }
};
