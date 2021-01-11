const path = require('path');
module.exports = {
    friendlyName: 'get',
    description: 'Get a Scenario in a UseCase',
    static: true,
    inputs: {
        id: {
            description: 'The name of the scenario',
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
        let [ucname, sname] = inputs.id.split(/\./);
        if(global.usecases.hasOwnProperty(ucname)) {
            let usecase = global.usecases[ucname];
            if(usecase.scenarios.hasOwnProperty(sname)) {
                let scenario = usecase.scenarios[sname];
                scenario.id = inputs.id;
                if(env.req) {
                    env.res.json(scenario)
                    return scenario;
                }
                else {
                    return scenario;
                }
            }
        }
       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return null;
    }
};

