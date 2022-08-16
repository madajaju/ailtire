const AEvent = require('../../src/Server/AEvent');
const exec = require('child_process').exec;
const promisify = require('util').promisify;
const execP = promisify(exec);

let _scenarioInstances = {};

module.exports = {
    launch: async (scenario) => {
        AEvent.emit("scenario.started", {obj:scenario});
        if(!_scenarioInstances.hasOwnProperty(scenario.id)) {
            _scenarioInstances[scenario.id] = [];
        }
        let myInstance = { id: scenario.id, scenario:scenario, state:'started', steps:[]};

        _scenarioInstances[scenario.id].push(myInstance);

        for (let i in scenario.steps) {
            let step = scenario.steps[i];
            let stepInstance = {step:step, state:'started'};
            myInstance.steps.push(stepInstance);
            let params = [];
            for(let j in step.parameters) {
                params.push(`--${j}`);
                params.push(`${step.parameters[j]}`);
            }
            scenario.currentstep = i;
            myInstance.currentstep = i;
            AEvent.emit("step.started", {obj:scenario});
            let command = `bash -c "bin/${global.ailtire.config.prefix} ${step.action.replace(/\//g,' ')} ${params.join(" ")}"`;
            console.log("CALLING:", command);
            try {
                console.log("Scenario calling step:", command);
                //let results = await execP('bash -c "pwd"');
                results = await execP(command);
                stepInstance.stdio = { stderr: results.stderr, stdout: results.stdout};
                if(results.error) {
                    console.error("Step Failed: ", command);
                    console.error(results.stderr);
                    stepInstance.state = 'failed';
                    AEvent.emit("step.failed", {obj:scenario});
                } else {
                    stepInstance.state = 'completed';
                    AEvent.emit("step.completed", {obj:scenario});
                }
            }
            catch (e) {
                console.log("Command Failed:", command);
                scenario.error = e;
                stepInstance.stdio = e;
                stepInstance.state = 'failed';
                AEvent.emit("step.failed", {obj:scenario});
                console.error("Scenario Failed:",e);
                throw e;
            }
        }
        myInstance.state = 'completed';
        AEvent.emit("scenario.completed", {obj:scenario});
    },
    instances: () => {
        return _scenarioInstances;
    },
    show: (scenario) => {
        return _scenarioInstances[scenario.id];
    }
}
