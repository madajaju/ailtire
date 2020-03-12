const path = require('path');

module.exports = {
    friendlyName: 'create',
    description: 'Create a Device',
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

                for(let name in inputs.file.hardware) {
                    let hw = inputs.file.hardware[name];
                    hw.name = name;
                    hw.ename = obj.name + '-' + name;
                    hw.device = obj;
                    obj.addToHardware(hw)
                }
            } else {
                obj[name] = inputs[name];
            }
        }
        if(inputs.name) {
            obj.name = inputs.name;
        }
        // Now create the profile of the device based on the hardware.
        obj.profile = new PhysicalProfile();
        for(let i in obj.hardware) {
            obj.profile = obj.profile.combine({profile: obj.hardware[i].profile});
        }
        return obj;
    }
};
