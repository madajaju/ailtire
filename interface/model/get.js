const path = require('path');
const AClass = require('../../src/Server/AClass');
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
        if(cls) {
            if(env.res) {
                env.res.json(cls);
            }
            return cls;
        } else {
            console.error("Could not find the Class:", cname);
            env.res.status(500).send({error: "Class could not be found"});
        }
        return null;
    }
};
