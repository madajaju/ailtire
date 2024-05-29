const AWorkflow = require('ailtire/src/Server/AWorkflow');
const generator = require('ailtire/src/Documentation/puml');

module.exports = {
    friendlyName: 'uml',
    description: 'plantuml diagram of the Workflow',
    inputs: {
        id: {
            description: 'The name of the workflow',
            type: 'string',
            required: true
        },
    },

    fn: async function (inputs, env) {
        try {
            // Generate the plantuml diagram
            // Or get it from the doc directory.
            
            let actor = AWorkflow.get(inputs.id);
            let results = await generator.workflow(actor, inputs.diagram);
            
            env.res.json(results);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
