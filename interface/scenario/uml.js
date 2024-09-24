const generator = require('../../src/Documentation/puml');
const AScenario = require("../../src/Server/AScenario");

module.exports = {
    friendlyName: 'uml',
    description: 'plantuml diagram of the Scenario',
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

            let [usecase, scenario] = AScenario.get(inputs.id);
            let results = await generator.scenario(usecase, scenario, inputs.diagram);
            
            env.res.json(results);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
