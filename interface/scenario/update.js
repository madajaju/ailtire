const AScenario = require('../../src/Server/AScenario');
const fs = require("fs");
const path = require("path");

module.exports = {
    friendlyName: 'update',
    description: 'Update the Model',
    inputs: {
        id: {
            description: 'The name of the model',
            type: 'string',
            required: true
        }
    },

    fn: function (inputs, env) {
        try {
            let [usecase, scenario] = AScenario.get(inputs.id);
            for(let fname in inputs) {
                scenario[fname] = inputs[fname];
            }
            AScenario.save(usecase, scenario);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
