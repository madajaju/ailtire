const generator = require('../../src/Documentation/puml');
const AUseCase = require("../../src/Server/AUseCase");

module.exports = {
    friendlyName: 'uml',
    description: 'plantuml diagram of the Model',
    inputs: {
        id: {
            description: 'The name of the package',
            type: 'string',
            required: true
        },
    },

    fn: async function (inputs, env) {
        try {
            // Generate the plantuml diagram
            // Or get it from the doc directory.

            let cls = AUseCase.getUseCase(inputs.id);
            let results = await generator.usecase(cls, inputs.diagram);
            
            env.res.json(results);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
