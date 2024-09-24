const fs = require("fs");
const AClass = require("../../src/Server/AClass");
module.exports = {
    friendlyName: 'set',
    description: 'Set an UseCase documentation',
    static: true,
    inputs: {
        id: {
            description: 'Id of the UseCase',
            type: 'string',
            required: true
        },
        summary: {
            descritpion: 'Summary of the UseCase',
            type: 'string',
            required: false
        },
        document: {
            descritpion: 'Documentation of the UseCase',
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
        // Find the Class
        console.log("INPUTS:", inputs);
        let cls = AClass.getClass(inputs.id);
        cls.name = inputs.id;
        cls.id = inputs.id;
        console.log("CLS:", cls);
        if (cls) {
            cls.description = inputs.summary;
            if (cls.doc && cls.doc.basedir) {
                fs.writeFileSync(cls.doc.basedir + '/doc.emd', inputs.documentation)
            }

            // Read the current definition in to saveCls
            // let myCls = cls.definition;
            // Overwrite the updated values.
            // saveCls.description = inputs.summary;
            // console.log("SAVECLS:", cls.toJSON());
            // let clsDef = `module.exports = ${JSON.stringify(myCls, null, 3)} ;`;
            // console.log("CLS:", clsDef);
            // let filename = cls.dir + '/index.js';

            // fs.writeFileSync(filename, clsDef);

            if (env.res) {
                env.res.end('done');
            }
            return cls;
        } else {
            console.error("Could not find the UseCaser:", mname);
            env.res.status(500).send({error: "UseCase could not be found"});
        }
        return null;
    }
};
