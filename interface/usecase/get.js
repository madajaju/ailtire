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
        json: (obj) => {
            return obj;
        }
    },
    fn: function (inputs, env) {
        // Find the scenario from the usecase.
        let ucname = inputs.id.replace(/\s/g, '');
        if (global.usecases.hasOwnProperty(ucname)) {
            let usecase = global.usecases[ucname];
            if (inputs.doc) {
                if (usecase.doc && usecase.doc.basedir) {
                    if (fs.existsSync(usecase.doc.basedir + '/doc.emd')) {
                        usecase.document = fs.readFileSync(usecase.doc.basedir + '/doc.emd', 'utf8');
                    } else {
                        usecase.document = "Enter documentation here.";
                    }
                }
            }
            usecase.id = ucname;
            return usecase;
        } else {
            throw new Error({type: 'notFound"', inputs: inputs});
        }
    }
};

