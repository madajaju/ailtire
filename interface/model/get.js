const AClass = require('../../src/Server/AClass');
const fs = require("fs");
module.exports = {
    friendlyName: 'get',
    description: 'Get a Model',
    static: true,
    inputs: {
        id: {
            description: 'The id of the model',
            type: 'string',
            required: true
        },
        doc: {
            description: 'Get the documentation of the model',
            type: 'boolean',
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
        // Find the scenario from the usecase.
        let cname = inputs.id;
        let cls = AClass.getClass(cname);
        cls.name = cname;
        cls.id = cname;
        let jcls = cls.definition;
        if(cls) {
            if(env.res) {
                if(inputs.doc) {
                    if(cls.doc && cls.doc.basedir) {
                        if(fs.existsSync(cls.doc.basedir + '/doc.emd')) {
                            jcls.document = fs.readFileSync(cls.doc.basedir + '/doc.emd', 'utf8');
                        } else {
                            jcls.document = "Enter documentation here.";
                        }
                    }
                }
                env.res.json(jcls);
            }
            return cls;
        } else {
            console.error("Could not find the Class:", cname);
            env.res.status(500).send({error: "Class could not be found"});
        }
        return null;
    }
};
