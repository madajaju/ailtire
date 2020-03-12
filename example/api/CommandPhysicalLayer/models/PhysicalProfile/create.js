const path = require('path');

module.exports = {
    friendlyName: 'create',
    description: 'Create Physical Profile',
    static: true, // True is for Class methods. False is for object based.
    inputs: {},

    exits: {},

    fn: function (obj, inputs) {
        // inputs contains the obj for the this method.
        // this is where we look up and assign the type of capability
        obj.capabilities = new MetricComposite({value: inputs});
        obj.available = new MetricComposite({value: inputs});
        obj.reserved = new MetricComposite({value: inputs});
        return obj;
    }
};
