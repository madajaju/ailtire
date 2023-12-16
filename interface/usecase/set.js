const fs = require("fs");
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
        // Find the actor from the usecase.
        let ucname = inputs.id;
        let usecase = null;
        if(global.usecases.hasOwnProperty(ucname)) {
            usecase = global.usecases[ucname];
        }
        if(usecase) {
            usecase.description = inputs.summary;
            if(usecase.doc && usecase.doc.basedir) {
                fs.writeFileSync(usecase.doc.basedir + '/doc.emd', inputs.documentation)
            }

            let saveUsecase = {
                name: usecase.name,
                description: inputs.summary,
                method: usecase.method,
                actors: usecase.actors,
            }
            let ucDef = `module.exports = ${JSON.stringify(saveUsecase, null, 3)} ;`;
            let filename = usecase.dir + '/index.js';
            fs.writeFileSync(filename, ucDef);

            if(env.res) {
                env.res.redirect('/web/');
            }
            return usecase;
        } else {
            console.error("Could not find the UseCaser:", ucname);
            env.res.status(500).send({error: "UseCase could not be found"});
        }
        return null;
    }
};
