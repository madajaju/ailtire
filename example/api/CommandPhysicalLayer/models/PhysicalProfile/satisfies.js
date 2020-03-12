const path = require('path');

module.exports = {
    friendlyName: 'satisfies',
    description: 'Satisfies the requirements, part or all of the requirements',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
        request: {
            description: 'Requirements to satisfy',
            type: 'object',
            required: true
        }
    },

    exits: {},

    fn: function (obj, inputs) {
        // inputs contains the obj for the this method.
        // inputs.request
        let found = false;
        for (let j in inputs.request.requirements) {
            let requirement = inputs.request.requirements[j];
            if (requirement.lessThanEq({value: obj.available})) {
                found = true;
            } else {
                found = false;
            }
        }
        return found;
    }
};



