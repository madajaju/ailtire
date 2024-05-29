const AClass = require('../../src/Server/AClass');
const fs = require("fs");
module.exports = {
    friendlyName: 'generateAttributes',
    description: 'Generate Attributes',
    static: true,
    inputs: {
        id: {
            description: 'The id of the model',
            type: 'string',
            required: true
        },
    },

    exits: {
        json: (obj)  => { return obj; },
    },

    fn: async function (inputs, env) {
        // Find the scenario from the usecase.
        let cname = inputs.id;
        let retval = await AClass.generateAttributes(cname);
        return retval; 
    }
};
