const AWorkflow = require('../../src/Server/AWorkflow');
const APackage = require('../../src/Server/APackage');
const fs = require("fs");
const path = require("path");

module.exports = {
    friendlyName: 'update',
    description: 'Update the Workflow',
    inputs: {
        id: {
            description: 'The name of the workflow',
            type: 'string',
            required: true
        }
    },

    fn: function (inputs, env) {
        try {
            let workflow = AWorkflow.get(inputs.id);
            let package = APackage.getPackage(workflow.pkg);
            for(let fname in inputs) {
                workflow[fname] = inputs[fname];
            }
            AWorkflow.save(workflow,package);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
