const AEvent = require('../../src/Server/AEvent');
const AService = require('../../src/Server/AService');
const UserActivity = require('../../src/Server/UserActivity');
const AScenarioInstance = require('../../src/Server/AScenarioInstance');
const promisify = require('util').promisify;
const fs = require('fs');
const Action = require('./Action');

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
    toJSON: (activity) => {
        return _toJSON(activity);
    },
    handleEvent: (event, data) => {
        let acti = _activityInstances[data.obj.name][data.obj.id];
        if (event === "activity.completed") {
            acti.state = "completed";
            const AWorkflow = require('../../src/Server/AWorkflow');
            AWorkflow.handleActivityEvent(event, acti.parent, acti);
        } else if (event === "activity.error") {
            console.error("Activity.error:", data);
            acti.state = "error";
            const AWorkflow = require('../../src/Server/AWorkflow');
            AWorkflow.handleActivityEvent(event, acti.parent, acti);
        }
        // Set the variables
        // Iterate over the next activites.
        // create them all first and then execute them.
        for (let i in acti.activity.next) {
            // Get the activity from the parent workflow definition.
            let nextActivity = acti.parent.workflow.activities[i];
            // The acti.activity.next only has the definition not the instance.
            if (!nextActivity) {
                console.error("Declared a next Activity that does not exist:", i);
                throw Error("Declared a next Activity that does not exist");
            }
            let nact = _register(acti.parent, i, nextActivity, acti);
            // Get the next activity instance definition. This primarily contains the inputs conversions.
            let nextActivityInstance = acti.activity.next[i];

            nact.inputs = _processInputs(acti, nextActivityInstance);
            // Test the condition to see if it should be fired
            if (nact.condition?.fn) {
                if (nact.condition.fn(acti)) {
                    // Evaluate the args
                    _execute(nact, nact.inputs);
                }
            } else {
                _execute(nact, nact.inputs);
            }
        }
    },
    execute: (nact, args) => {
        return _execute(nact, args);
    }
};

function _processInputs(acti, nacti) {
    let args = {};
    for (let aname in nacti.inputs) {
        let input = nacti.inputs[aname];
        if (typeof input === 'function') {
            try {
                args[aname] = input(acti);
            } catch (e) {
                console.error(e);
            }
        } else {
            args[aname] = input;
        }
    }
    return args;
}

function _register(parent, name, activity, previous) {

    if (!_activityInstances.hasOwnProperty(activity.name)) {
        _activityInstances[activity.name] = {};
    }

    // This means that the workload needs to help set the instance id not just the number of activities of the same kind of instance.
    // When the activity is launched the parent id need to be appended.
    // First check and see if there is a activity that is not completed or error that should be used.
    // this prevents multiple instances of the same activity being created.
    if(_activityInstances.hasOwnProperty(name)) {
        for(let i in _activityInstances[name]) {
           // Check that the parent is the same. 
            let checkID = i.split('.');
            checkID.pop();
            let check = checkID.join('.');
            if(check == parent.id) {
                let newActivity = _activityInstances[name][i];
                // If the activity is not in a finished state then use it.
                if(newActivity.state !== "completed" && newActivity.state !== "error") {
                    if(!newActivity.previous) { newActivity.previous = []; }
                    newActivity.previous.push(previous);
                    newActivity.activity.previous.push({id: previous.id, name: previous.name});
                    AEvent.emit("activity.blocked", {obj: _toJSON(newActivity)});
                    return newActivity;
                }
            }
        }
    }
    let iid = `${parent.id}.${Object.keys(parent.activities).length}`;
    let myInstance = {name: name, id: iid, activity: activity, state: 'created', parent: parent, previous: [previous]};
    if (!_activityInstances.hasOwnProperty(name)) {
        _activityInstances[name] = {};
    }
    _activityInstances[name][iid] = myInstance;
    activity.name = myInstance.name;
    activity.id = myInstance.id;
    activity.state = "created";
    activity.parent = parent.id;
    if(previous) {
        activity.previous = [{id: previous.id, name: previous.name}];
    }
    AEvent.emit("activity.created", {obj: _toJSON(activity)});

    // Add the activity instance to the parent.
    if (!parent.activities.hasOwnProperty(name)) {
        parent.activities[name] = [];
    }
    parent.activities[name].push(myInstance);

    myInstance.state = 'blocked';
    activity.state = "blocked";
    AEvent.emit("activity.blocked", {obj: _toJSON(activity)});
    return myInstance;
}

function _execute(nact, args) {
    // Evaluate the args
    let variables = {};
    // Check to see if all of the previous activities are in a finished state.
    // If they are then proceed.
    // If not then set the state to blocked and return.
    // We also need to check that all of the activityInstances have been created based on the workflow definition.
    let expectedActivities = {};
    for(let aname in nact.parent.workflow.activities) {
        let testAct = nact.parent.workflow.activities[aname];
        if(testAct.next && testAct.next.hasOwnProperty(nact.name)) {
            expectedActivities[testAct.name] = false;
        }
    }
    let finished = true;
    for(let i in nact.previous) {
        if(nact.previous[i]) {
            let pact = _activityInstances[nact.previous[i].name][nact.previous[i].id];
            if (pact.state !== "completed" && pact.state !== 'error') {
                finished = false;
                expectedActivities[pact.name] = false;
            } else {
                expectedActivities[pact.name] = true;
            }
        }
    }
    if(!finished) {
        nact.state = "blocked";
        AEvent.emit("activity.blocked", {obj: _toJSON(nact)});
        return;
    }
    // Now check the expectedActivities that they are all there and finished.
    for(let i in expectedActivities) {
        if(!expectedActivities[i]) {
            nact.state = "blocked";
            AEvent.emit("activity.blocked", {obj: _toJSON(nact)});
            return;
        }
    }
    nact.state = "inprogress";
    nact.inputs = args;
    AEvent.emit("activity.inprogress", {obj: _toJSON(nact)});
    for (let vname in nact.variables) {
        variables[vname] = nact.variables[vname].value = nact.variables[vname].fn(nact);
    }
    nact.variables = variables;
    // This is where you check to see if there is a workflow or a scenario that matches the name.
    try {
        if (nact.activity.type === "workflow") {
            // Set a handler to be notified when the workflow is finished.
            // Now call the launch on the workflow.
            const AWorkflow = require('../../src/Server/AWorkflow');
            // dont wait for the workflow to launch and manage execution through the events.
            AWorkflow.launch(nact.activity.obj, nact.inputs, nact);
            // do not processes the  output because it is not done yet.
            return nact;
            // When it finishes the activity.precomplete should be handled.
        } else if (nact.activity.type === "scenario") {
            // Find the scenario and then launch it.
            // Call the AScenarioInstance waiting for the results.
            // Then process the 
            try {
                try {
                    let scenario = nact.activity.obj;
                    let retval = AScenarioInstance.launch(scenario, nact.inputs);
                    if (retval instanceof Promise) {
                        retval.then(result => {
                            nact.variables.returnValue = result;
                            nact.outputs = _procesOutputs(nact);
                            nact.state = "completed";
                            AEvent.emit("activity.completed", {obj: _toJSON(nact)});
                            return nact;
                        }).catch(e => {
                            AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error calling scenario:" + e});
                            console.error("Error executing action:", e);
                        });
                    } else {
                        nact.variables.returnValue = retval;
                        nact.outputs = _procesOutputs(nact);
                        nact.state = "completed";
                        AEvent.emit("activity.completed", {obj: _toJSON(nact)});
                        return nact;
                    }
                } catch (e) {
                    console.error("Error Calling Scenario:", e);
                    AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error calling scenario:" + e});
                }
            } catch (e) {
                console.error("Error Running Activity:", e);
                AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error running Activity" + e});
            }
        } else {
            // Check to see if the owner is an actor. If it is then create a UserActivity
            // User Activites will prompt the user for the inputs.
            if (nact.activity.actor && nact.name !== "Init") {
                let uactivity = new UserActivity({actor: nact.activity.actor, activity: nact});
                return;
            } else { // This is trying to find an action that can be run.
                // Check to see if the activity has an action in the system.
                let action = Action.find(nact.name);
                if (action) {
                    try {
                        let retval = Action.execute(action, nact.inputs);
                        if (retval instanceof Promise) {
                            retval.then(result => {
                                nact.variables.returnValue = result;
                                nact.outputs = _procesOutputs(nact);
                                nact.state = "completed";
                                AEvent.emit("activity.completed", {obj: _toJSON(nact)});
                                return nact;
                            }).catch(e => {
                                AEvent.emit("activity.error", {
                                    obj: _toJSON(nact), message: "Error calling" +
                                        " action:" + e
                                });
                                console.error("Error executing action:", e);
                            });
                        } else {
                            nact.variables.returnValue = retval;
                            nact.outputs = _procesOutputs(nact);
                            nact.state = "completed";
                            AEvent.emit("activity.completed", {obj: _toJSON(nact)});
                            return nact;
                        }
                    } catch (e) {
                        AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error calling scenario:" + e});
                        console.error("Error executing action:", e);
                    }
                } else {
                    console.log("Do Nothing");
                    nact.outputs = _procesOutputs(nact);
                    nact.state = "completed";
                    AEvent.emit("activity.completed", {obj: _toJSON(nact)});
                }
            }
        }
    } catch (e) {
        console.error("Error Running Activity:", e);
        AEvent.emit("activity.error", {obj: _toJSON(nact), message: "Error Running Activity" + e});
    }
    return;
}

function _procesOutputs(nact) {
    let outputs = {};
    for (let oname in nact.activity.outputs) {
        // Need to handle await activities.
        outputs[oname] = nact.activity.outputs[oname].fn(nact);
    }
    return outputs;
}

function _toJSON(activity) {
    let retval = {};
    for (let aname in activity) {
        let item = activity[aname];
        if (typeof item !== "object") {
            retval[aname] = item;
        } else if (aname === 'inputs') {
            retval[aname] = activity.inputs;
        } else if (aname === 'outputs') {
            retval[aname] = activity.outputs;
        } else if (aname === 'next') {
            if (!retval.next) {
                retval.next = {};
            }
            for (let nname in activity[aname]) {
                retval[aname][nname] = activity[aname][nname].id || activity[aname][nname].name || 1;
            }
        } else if (aname === 'parent') {
            retval.parent = activity.parent.id;
        } else if (aname === 'previous') {
            retval.previous = [];
            for(let i in activity.previous) {
                if(activity.previous[i]) {
                    retval.previous.push({id: activity.previous[i].id, name: activity.previous[i].name})
                }
            }
        }
    }
    return retval;
}
