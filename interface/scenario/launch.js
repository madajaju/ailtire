const path = require('path');
const AEvent = require('../../src/Server/AEvent');
const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const promisify = require('util').promisify;
const execP = promisify(exec);

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
                env.res.json("started");
                AEvent.emit("scenario.started", {obj:scenario});
                for (let i in scenario.steps) {
                    let step = scenario.steps[i];
                    let params = [];
                    for(let j in step.parameters) {
                        params.push(`--${j}`);
                        params.push(`${step.parameters[j]}`);
                    }
                    scenario.currentstep = i;
                    AEvent.emit("step.started", {obj:scenario});
                    let command = `bash -c "bin/${global.ailtire.config.prefix} ${step.action.replace(/\//g,' ')} ${params.join(" ")}"`;
                    try {
                        let results = await execP('bash -c "pwd"');
                        results = await execP(command);
                        if(results.stderr) {
                            console.log(results.stderr);
                            AEvent.emit("step.failed", {obj:scenario});
                        } else {
                            AEvent.emit("step.completed", {obj:scenario});
                        }
                    }
                    catch (e) {
                        scenario.error = e;
                        AEvent.emit("step.failed", {obj:scenario});
                        console.error(e);
                    }
                }
                AEvent.emit("scenario.completed", {obj:scenario});
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

