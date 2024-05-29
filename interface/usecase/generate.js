const AUseCase = require('../../src/Server/AUseCase');
const fs = require("fs");
module.exports = {
    friendlyName: 'generate',
    description: 'Generate',
    static: true,
    inputs: {
        id: {
            description: 'The id of the UseCase',
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
        let retval = await AUseCase[`generate${inputs.target}`](cname);
        return retval; 
    }
};
