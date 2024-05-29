const AUseCase = require('../../src/Server/AUseCase');
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
            let usecase = AUseCase.getUseCase(inputs.id);
            for(let fname in inputs) {
                if(fname === 'document') {
                    // find the document directory and store the contents.
                    let cfile = path.resolve(`${usecase.doc.basedir}/doc.emd`);
                    fs.writeFileSync(cfile, inputs[fname]);
                } else {
                    usecase[fname] = inputs[fname];
                }
            }
            AUseCase.save(usecase);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
