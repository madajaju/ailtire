const AActor = require('../../src/Server/AActor');
const fs = require("fs");
const path = require("path");

module.exports = {
    friendlyName: 'update',
    description: 'Update the Actor',
    inputs: {
        id: {
            description: 'The name of the model',
            type: 'string',
            required: true
        }
    },

    fn: function (inputs, env) {
        try {
            let cls = AActor.get(inputs.id);
            for(let fname in inputs) {
                if(fname === 'document') {
                    // find the document directory and store the contents.
                    let cfile = path.resolve(`${cls.doc.basedir}/doc.emd`);
                    fs.writeFileSync(cfile, inputs[fname]);
                } else {
                    cls[fname] = inputs[fname];
                }
            }
            AActor.save(cls);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
