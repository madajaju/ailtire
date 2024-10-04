const fs = require("fs");
const AApplication = require("../../src/Server/AApplication");
module.exports = {
    friendlyName: 'generate',
    description: 'Generate Items in the architecture',
    static: true,
    inputs: {
        prompt: {
            description: 'Prompt used to generate architectural elements',
            type: 'string',
            required: true
        },
    },

    exits: {
        json: (obj)  => { return obj; },
    },

    fn: async function (inputs, env) {
        // Find the scenario from the usecase.
        let retval = await AApplication.generateItems(inputs.prompt, inputs.filters, null, env);
        return retval;
    }
};
