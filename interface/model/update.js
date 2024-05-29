const AClass = require('../../src/Server/AClass');
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
            let cls = AClass.getClass(inputs.id);
            for(let fname in inputs) {
                if(fname === 'document') {
                    // find the document directory and store the contents.
                    let cfile = path.resolve(`${cls.doc.basedir}/doc.emd`);
                    fs.writeFileSync(cfile, inputs[fname]);
                } else {
                    cls[fname] = inputs[fname];
                }
            }
            AClass.save(cls);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
