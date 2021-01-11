const path = require('path');
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
                env.res.json(usecase);
            }
            return usecase;
        }
       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return null;
    }
};

