const AEvent = require('../../src/Server/AEvent');
const AService = require('../../src/Server/AService');
const UserActivity = require('../../src/Server/UserActivity');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');
const promisify = require('util').promisify;

let _activityInstances = {};

module.exports = {
    register: (parent, name, activity, previous) => {
        return _register(parent, name, activity, previous);
    },
    instances: () => {
        return _activtyInstances;
    },
    show: (activity) => {
        return _activityInstances[activity.name][activity.id];
    },
    toJSON: (activity) => { return _toJSON(activity); },
    handleEvent: async (event, data) => {
        let acti = _activityInstances[data.obj.name][data.obj.id];
        if(event === "activity.completed") {
            acti.state = "completed";
            const AWorkflow = require('../../src/Server/AWorkflow');
            await AWorkflow.handleActivityEvent(event, acti.parent, acti);
        } else if(event === "activity.error") {
            acti.state = "error";
            const AWorkflow = require('../../src/Server/AWorkflow');
            await AWorkflow.handleActivityEvent(event, acti.parent, acti);
        }
        // Set the variables
        for(let i in acti.activity.next) {
            // Get the activity from the parent workflow definition.
            let nextActivity = acti.parent.workflow.activities[i];
            // The acti.activity.next only has the definition not the instance.
            let nact = _register(acti.parent, i, nextActivity, acti);

            // Get the next activity instance definition. This primarily contains the inputs conversions.
            let nextActivityInstance = acti.activity.next[i];

            let args = {};
            for(let aname in nextActivityInstance.inputs) {
                let input = nextActivityInstance.inputs[aname];
                if(typeof input === 'function') {
                    try {
                        args[aname] = input(acti);
                    }
                    catch(e) {
                        console.error(e);
                    }
                } else {
                    args[aname] = input;
                }
            }
            nact.inputs = args;
            // Test the condition to see if it should be fired
            if(nact.condition?.fn) {
                if(nact.condition.fn(acti)) {
                   // Evaluate the args
                    _execute(nact,args);
                }
            } else {
                _execute(nact,args);
            }
        }
    },
    execute: async (nact, args) => {
        return _execute(nact, args);
    }
};


function _register(parent, name, activity, previous) {

    if(!_activityInstances.hasOwnProperty(activity.name)) {
        _activityInstances[activity.name] = {};
    }

    // This means that the workload needs to help set the instance id not just the number of activities of the same kind of instance.
    // When the activity is launched the parent id need to be appended.
    let iid = `${parent.id}.${Object.keys(parent.activities).length}`;
    let myInstance = { name: name, id: iid, activity:activity, state:'created', parent: parent, previous: previous};
    if(!_activityInstances.hasOwnProperty(name)) {
        _activityInstances[name] = {};
    }
    _activityInstances[name][iid] = myInstance;
    activity.name = myInstance.name;
    activity.id = myInstance.id;
    activity.state = "created";
    activity.parent = parent.id;
    activity.previous = previous?.id;
    AEvent.emit("activity.created", {obj:_toJSON(activity)});

    // Add the activity instance to the parent.
    if(!parent.activities.hasOwnProperty(name)) {
        parent.activities[name] = [];
    }
    parent.activities[name].push(myInstance);

    myInstance.state = 'blocked';
    activity.state = "blocked";
    AEvent.emit("activity.blocked", {obj:_toJSON(activity)});
    return myInstance;
}

async function _execute(nact, args) {
    // Evaluate the args
    let variables = {};
    nact.state = "inprogress";
    nact.inputs = args;
    AEvent.emit("activity.inprogress", {obj:_toJSON(nact)});
    for(let vname in nact.variables ) {
        variables[vname] = nact.variables[vname].value = nact.variables[vname].fn(nact);
    }
    nact.variables = variables;
    // This is where you check to see if there is a workflow or a scenario that matches the name.
    try {
        if (nact.activity.type === "workflow") {
            // Set a handler to be notified when the workflow is finished.
            // Now call the launch on the workflow.
            const AWorkflow = require('../../src/Server/AWorkflow');
            await AWorkflow.launch(nact.activity.obj, nact.inputs, nact);
            return nact;
            // When it finishes the activity.precomplete should be handled.
        } else if (nact.activity.type === "scenario") {
            // Find the scenario and then launch it.
            // When it finished the activity.precomplete should be handled.
            try {
                let scenario = nact.activity.obj;
                nact.returnValue = await AScenarioInstance.launch(scenario, nact.inputs);
            }
            catch(e) {
                console.error("Error Running Activity:", e);
                AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error running Activity" + e});
            }
        } else {
            // Check to see if the owner is an actor. If it is then create a UserActivity
            // User Activites will prompt the user for the inputs.
            if(nact.activity.actor && nact.name !== "Init") {
                let uactivity = new UserActivity({actor: nact.activity.actor, activity:nact});
                return;
            } else {
                console.log("Do Nothing");
            }
        }

        let outputs = {};
        for (let oname in nact.activity.outputs) {
            outputs[oname] = nact.activity.outputs[oname].fn(nact);
        }
        nact.outputs = outputs;
        nact.state = "completed";
        AEvent.emit("activity.completed", {obj: _toJSON(nact) });
    } catch(e) {
        console.error("Error Running Activity:", e);
        AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error Running Activity" + e});
    }
    return nact;
}
function _toJSON(activity) {
    let retval = {};
    for(let aname in activity) {
        let item = activity[aname];
        if(typeof item !== "object") {
            retval[aname] = item;
        } else if(aname === 'inputs') {
            retval[aname] = activity.inputs;
        } else if(aname === 'outputs') {
            retval[aname] = activity.outputs;
        } else if(aname === 'next') {
            if(!retval.next) { retval.next = {}; }
            for(let nname in activity[aname]) {
                retval[aname][nname] = activity[aname][nname].id || activity[aname][nname].name || 1;
            }
        } else if(aname === 'parent') {
            retval.parent = activity.parent.id;
        }
    }
    return retval;
}