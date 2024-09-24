const AWorkflow = require('../../src/Server/AWorkflow');
const generator = require('../../src/Documentation/puml');

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
            
            let workflow = AWorkflow.get(inputs.id);
            if(workflow) {
                let results = await generator.workflow(workflow, inputs.diagram);
                env.res.json(results);
            } else {
                console.error("Workflow not found: " + inputs.id);
                env.res.json({status: 'error', message:'Workflow not found'});
            }
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
