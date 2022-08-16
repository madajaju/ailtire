const fs = require("fs");
module.exports = {
    friendlyName: 'get',
    description: 'Get a UseCase',
    static: true,
    inputs: {
        id: {
            description: 'The id of the usecase',
            type: 'string',
            required: true
        },
        doc: {
            description: 'This is the documentation of the use case',
            type: 'boolean',
            required: true
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
        // Find the scenario from the usecase.
        let ucname = inputs.id;
        if(global.usecases.hasOwnProperty(ucname)) {
            let usecase = global.usecases[ucname];
            if(env.res) {
                if(inputs.doc) {
                    if(usecase.doc && usecase.doc.basedir) {
                        if(fs.existsSync(usecase.doc.basedir + '/doc.emd')) {
                            usecase.document = fs.readFileSync(usecase.doc.basedir + '/doc.emd', 'utf8');
                        } else {
                            usecase.document = "Enter documentation here.";
                        }
                    }
                }
                usecase.id = ucname;
                env.res.json(usecase);
            }
            return usecase;
        }
       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return null;
    }
};

