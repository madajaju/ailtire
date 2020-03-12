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
        // Check if the input  is a MetricComposite. If so then iterate over the values and call plus.
        if(typeof inputs.value === 'object') {
            if(inputs.value.definition) {
                if(inputs.value.definition.name === 'MetricComposite') {
                   for(let i in inputs.value.values) {
                       let val = inputs.value.values[i];
                       obj = obj.plus({value:val});
                   }
                }
                else {
                    if(!obj.hasInValues(inputs.value.name)) {
                        obj.addToValues(inputs.value);
                    }
                    else {
                        obj.values[inputs.value.name].plus({value: inputs.value.value});
                    }
                }
            }
            else {
                obj.values[inputs.value.name].plus({value: inputs.value.value});
            }
        } else {
            console.error("Do not know the name of the metric:", inputs.value);
        }
        return obj;
    }
};
