const AActor = require('../../src/Server/AActor');
const fs = require("fs");
module.exports = {
    friendlyName: 'generateWorkflows',
    description: 'Generate Workflows',
    static: true,
    inputs: {
        id: {
            description: 'The id of the Actor',
            type: 'string',
            required: true
        },
        target: {
            description: 'The type of artifact to generate',
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
        let retval = await AActor[`generate${inputs.target}`](cname);
        return retval;
    }
};
