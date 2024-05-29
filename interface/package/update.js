const APackage = require('../../src/Server/APackage');
const fs = require("fs");
const path = require("path");

module.exports = {
    friendlyName: 'update',
    description: 'Update the Package',
    inputs: {
        id: {
            description: 'The name of the package',
            type: 'string',
            required: true
        },
        data: {
            description: 'Contains the fields and values to update.',
            type: 'json',
            required: false
        }
    },

    fn: function (inputs, env) {
        try {
            let pkg = APackage.getPackage(inputs.id);
            for(let fname in inputs) {
                if(fname === 'document') {
                    // find the document directory and store the contents.
                    let cfile = path.resolve(`${pkg.doc.basedir}/doc.emd`);
                    fs.writeFileSync(cfile, inputs[fname]);
                } else {
                    pkg[fname] = inputs[fname];
                }
            }
            APackage.save(pkg);
        }
        catch(e) {
            console.error(e);
            env.res.json({error:`Package not found ${inputs.id}`});
        }
    }
};
