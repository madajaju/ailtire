const generator = require('ailtire/src/Documentation/puml');
const AClass = require("ailtire/src/Server/AClass");

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

            let cls = AClass.getClass(inputs.id);
            let results = await generator.model(cls, inputs.diagram);
            
            env.res.json(results);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
