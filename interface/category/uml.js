const ACategory = require('ailtire/src/Server/ACategory');
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
             
            let category = ACategory.get(inputs.id);
            if(category) {
                let results = await generator.category(category, inputs.diagram);
                env.res.json(results);
            } else {
                console.error("Category not found: " + inputs.id);
                env.res.json({status: 'error', message:'Category not found'});
            }
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Category not found ${inputs.id}`});
        }
    }
};
