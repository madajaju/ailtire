const Action = require('../../src/Server/Action');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');

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
                retscenario = {name: scenario.name, description: scenario.description, actors: scenario.actors};
                retscenario.document = scenario.description;

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
        // Now get any scenario instances and put them with the scenario.
        let instances = AScenarioInstance.show({id:inputs.id});
        retscenario._instances = instances;
        if(!retscenario) {
           throw new Error({type:'notFound'});
        } else {
            return retscenario;
        }
    }
};

