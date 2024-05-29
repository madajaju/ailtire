const Action = require('../../src/Server/Action');
const AScenario = require('../../src/Server/AScenario');

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
        doc: {
            description: 'Get the documentation of the scenario',
            type: 'boolean',
            required: false
        }
    },

    exits: {
        json: (retval) => {
            return retval;
        },
        notFound: (inputs) => {
            return  { error: `No item with the specified ID was found in the database. ${inputs.id}` };
        }
    },

    fn: function (inputs, env) {
        // Find the scenario from the usecase.
        let retscenario = undefined;
        let [ucname, sname] = inputs.id.split(/\./);
        if (global.usecases.hasOwnProperty(ucname)) {
            let usecase = global.usecases[ucname];
            if (usecase.scenarios.hasOwnProperty(sname)) {
                let scenario = usecase.scenarios[sname];
                retscenario = AScenario.toJSON(scenario);
            }
        }
        if(!retscenario) {
            throw new Error({type:'notFound'});
        } else {
            return retscenario;
        }
    }
};

