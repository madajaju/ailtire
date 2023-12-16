const AEvent = require('../../src/Server/AEvent');
const Action = require('../../src/Server/Action');
const AService = require('../../src/Server/AService');
const exec = require('child_process').exec;
const promisify = require('util').promisify;
const execP = promisify(exec);

let _scenarioInstances = {};

module.exports = {
    launch: async (scenario, args) => {
        let jsonScenario = _toJSON(scenario);
        AEvent.emit("scenario.started", {obj:jsonScenario});
        if(!_scenarioInstances.hasOwnProperty(scenario.id)) {
            _scenarioInstances[scenario.id] = [];
        }
        let myInstance = { id: scenario.id, scenario:scenario, state:'started', args: args, steps:[]};

        _scenarioInstances[scenario.id].push(myInstance);

        for (let i in scenario.steps) {
            let step = scenario.steps[i];
            let stepInstance = {step:step, state:'started'};
            myInstance.steps.push(stepInstance);
            scenario.currentstep = i;
            myInstance.currentstep = i;
            // await _launchStepBinary(scenario,step);
            await _launchStepService(scenario,args, step);
        }
        myInstance.state = 'completed';
        AEvent.emit("scenario.completed", {obj:jsonScenario});
    },
    instances: () => {
        return _scenarioInstances;
    },
    show: (scenario) => {
        return _scenarioInstances[scenario.id];
    },
    toJSON: (scenario) => {
        return _toJSON(scenario);
    }
}

function _toJSON(scenario) {
    let retscenario = {name: scenario.name, description: scenario.description, actors: scenario.actors};
    retscenario.document = scenario.description;
    retscenario.inputs = scenario.inputs;
    retscenario.id = scenario.uid;
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
    let instances = _scenarioInstances[scenario.id];
    retscenario._instances = instances;
    return retscenario;
}
async function _launchStepBinary(scenario, args, step) {
    AEvent.emit("step.started", {obj:scenario});
    let params = [];
    let parameters = _resolveParameters(step.parameters, args);
    for(let j in parameters) {
        params.push(`--${j}`);
        params.push(`${parameters[j]}`);
    }
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
async function _launchStepService(scenario, args, step) {
    AEvent.emit("step.started", {obj:scenario});
    let parameters = _resolveParameters(step.parameters, args);
    try {
        let results = AService.call(step.action.replace(/\//g, '.').replace(/\s/g, '.'), parameters);
        AEvent.emit('step.completed', {obj:scenario})
    } catch (e) {
        console.error("Error launching service:", step, e);
        AEvent.emit('step.failed', {obj:scenario, error: e});
    }
}

// This function will insert the args into the context of the parameters,
// If the parameters have variables in their values and the args resolve to them then
// the parameters returned will have the appropriate values evaluated.
// Variables from the input are identified by :variableName:
// Change the parameters in place.
function _resolveParameters(parameters, args) {
    let retval = {};
    for(let pname in parameters) {
        let parameter = parameters[pname];
        if(typeof parameter === "function") {
            retval[pname] = parameters[pname](args);
        } else {
            retval[pname] = parameters[pname];
        }
    }
    return retval;
}
