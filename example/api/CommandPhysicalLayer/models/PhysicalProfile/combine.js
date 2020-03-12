const path = require('path');

module.exports = {
    friendlyName: 'combine',
    description: 'Combine Physical Profile',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
        profile: {
            description: 'Profile to add to the current profile',
            type: 'object',
            required: true
        }
    },

    exits: {},

    fn: function (obj, inputs) {
        // inputs contains the obj for the this method.
        for (let name in inputs.profile.definition.associations) {
            if(obj[name]) {
                obj[name].plus({value: inputs.profile[name]});
            }
        }
        return obj;
    }
};



