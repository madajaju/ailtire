const AEvent = require('../../src/Server/AEvent');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');

module.exports = {
    friendlyName: 'launch',
    description: 'Launch a Scenario in a UseCase',
    static: true,
    inputs: {
        id: {
            description: 'The id of the scenario',
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

    fn: async function (inputs, env) {
        // Find the scenario from the usecase.
        let [ucname, sname] = inputs.id.split(/\./);
        if(global.usecases.hasOwnProperty(ucname)) {
            let usecase = global.usecases[ucname];
            if(usecase.scenarios.hasOwnProperty(sname)) {
                let scenario = usecase.scenarios[sname];
                scenario.id = inputs.id;
                let instances = AScenarioInstance.show({id:scenario.id});
                let instanceid = 0;
                if(instances) {
                    instanceid = instances.length;
                }
                env.res.json({id: instanceid});
                AScenarioInstance.launch(scenario);
            } else {
                AEvent.emit("scenario.failed", {obj:{error: "Scenario not found"}});
            }
        } else {
            AEvent.emit("scenario.failed", {obj:{error: "Use Case not found"}});
        }
       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return null;
    }
};

