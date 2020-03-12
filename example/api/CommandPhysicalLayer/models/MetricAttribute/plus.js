const path = require('path');

module.exports = {
    friendlyName: 'plus',
    description: 'Add metric to the current value',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
        value: {
            description: 'Value to add to the metric',
            type: 'object', // string|boolean|number|json
            required: true
        },
    },

    exits: {},

    fn: function (obj, inputs) {
        // inputs contains the obj for the this method.
        let value = inputs.value;
        if(typeof inputs.value === 'object') {
           value = inputs.value.value;
        }
        if(typeof obj.value === 'object') {
            obj.value.push(value);
        }
        else {
            obj.value = [obj.value, value];
        }
        return obj;
    }
};
