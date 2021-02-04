const path = require('path');
const Action = require('../../src/Server/Action');
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
        let retscenario;
        let [ucname, sname] = inputs.id.split(/\./);
        if (global.usecases.hasOwnProperty(ucname)) {
            let usecase = global.usecases[ucname];
            if (usecase.scenarios.hasOwnProperty(sname)) {
                let scenario = usecase.scenarios[sname];
                retscenario = {name: scenario.name, description: scenario.description, actors: scenario.actors};

                retscenario.id = inputs.id;
                let steps = [];
                for (let i in scenario.steps) {
                    let step = scenario.steps[i];
                    let rstep = {parameters: step.parameters};
                    if (step.action) {
                        let retaction = {name: step.action};
                        let action = Action.find(step.action);
                        if (action) {
                            retaction = {
                                name: step.action,
                                cls: action.cls,
                                pkg: {shortname: action.pkg.shortname, name: action.pkg.name, color: action.pkg.color},
                                obj: {obj: action.pkg.obj}
                            };
                        }
                        rstep.action = retaction;
                    }
                    steps.push(rstep);
                }
                retscenario.steps = steps;
            }
        }
        if (env.req) {
            env.res.json(retscenario)
            return retscenario;
        } else {
            return retscenario;
        }
        // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        return null;
    }
};

