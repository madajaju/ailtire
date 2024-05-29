const AClass = require('../../src/Server/AClass');
const fs = require("fs");
module.exports = {
    friendlyName: 'generateDocumentation',
    description: 'Generate Documentation',
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
        let documentation = await AClass.generateDocumentation(cname);
        return documentation; 
    }
};
