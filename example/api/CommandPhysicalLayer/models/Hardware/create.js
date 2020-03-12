const path = require('path');

module.exports = {
    friendlyName: 'create',
    description: 'Create Hardware',
    static: true, // True is for Class methods. False is for object based.
    inputs: {
        file: {
            description: 'file with the definition',
            type: 'YAML', // string|boolean|number|json
            required: false
        },
    },

    exits: {},

    fn: function (obj, inputs) {
        // inputs contains the obj for the this method.
        for (let name in inputs) {
            if (name === 'file') {
                obj.name = inputs.file.name;
                obj.profile = new PhysicalProfile(inputs.file.capabilities);
            } else if(name === 'capabilities') {
                obj.profile = new PhysicalProfile(inputs.capabilities);
            } else {
                obj[name] = inputs[name];
            }
        }
        if(inputs.name) {
            obj.name = inputs.name;
        }
        return obj;
    }
};
