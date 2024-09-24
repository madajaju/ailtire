const fs = require("fs");
const APackage = require("../../src/Server/APackage");

module.exports = {
    friendlyName: 'set',
    description: 'Set an Package documentation',
    static: true,
    inputs: {
        id: {
            description: 'Id of the Package',
            type: 'string',
            required: true
        },
        summary: {
            descritpion: 'Summary of the Package',
            type: 'string',
            required: false
        },
        document: {
            descritpion: 'Documentation of the Package',
            type: 'string',
            required: false
        }
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        // Find the actor from the usecase.
        console.log("INPUTS:", inputs);
        let pkg = APackage.getPackage(inputs.id);
        if(pkg) {
            pkg.description = inputs.summary;
            if(pkg.doc && pkg.doc.basedir) {
                fs.writeFileSync(pkg.doc.basedir + '/doc.emd', inputs.documentation)
            }
            let depends = [];
            for(let i in pkg.depends) {
               depends.push(pkg.depends[i].name);
            }
            let savePkg = {
                shortname: pkg.shortname,
                name: pkg.name,
                description: pkg.description,
                color: pkg.color,
                depends: depends,
            }
            let pkgDef = `module.exports = ${JSON.stringify(savePkg, null, 3)} ;`;
            let filename = pkg.dir + '/index.js';
            fs.writeFileSync(filename, pkgDef);

            if(env.res) {
                env.res.end('updated');
            }
            return pkg;
        } else {
            console.error("Could not find the UseCaser:", ucname);
            env.res.status(500).send({error: "UseCase could not be found"});
        }
        return null;
    }
};
