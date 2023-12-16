const AEvent = require('../../src/Server/AEvent');
const AActivity = require('../../src/Server/AActivity');
const AService = require('../../src/Server/AService');

let _workflowInstances = { _total: 0 };

module.exports = {
    launch: async (workflow, args, callingActivity) => {
        AEvent.emit("workflow.started", {obj:workflow});
        console.log("start Workflow", workflow.name, args);
        // First activity is Init.
        if(!workflow.activities.hasOwnProperty("Init")) {
            AEvent.emit("workflow.failed", {obj:workflow, error:"Init Activity does not exist!"});
            return;
        }
        if(!_workflowInstances.hasOwnProperty(workflow.name)) {
            _workflowInstances[workflow.name] = [];
        }
        // Has to be the total number of woflow instances running not how many of a specific type.
        // so _workflowInstances hos a total attribute that needs to be incremented.
        let id = _workflowInstances._total++;
        if(callingActivity) {
            id = callingActivity.id + '.' + _workflowInstances._total;
        }
        let myInstance = {
            name: workflow.name,
            id: id,
            workflow:workflow,
            currentActivity:'Init',
            args:args,
            inputs: args,
            activities: {},
            parent: callingActivity,
        };
        _workflowInstances[workflow.name].push(myInstance);
        // Setup the workflow to handle events.
        // Create the Activities and attach them to the workflo
        let init = AActivity.register(myInstance, "Init", workflow.activities.Init);
        AEvent.emit("workflow.inprogress", {obj:_toJSON(myInstance)});

        // If the owner is an actor then create a activity for the user to interact with the system.

        await AActivity.execute(init,args);
    },
    instances: () => {
        return _workflowInstances;
    },
    show: (workflow) => {
        return _workflowInstances[workflow.name];
    },
    handleActivityEvent: async (event, workflow, acti) => {
        if(!acti.activity.next || Object.keys(acti.activity.next).length === 0) {
            // Iterate over the workflow.activities and check the state
            let calculatedState = "";
            // Need to iterate over all of the activties because of parallelism.
            if(event === "activity.completed" || event === "activity.error") {
                for (let i in workflow.activities) {
                    let activity = workflow.activities[i];
                    // I only care about the last run of the activity. This gives the ability to re-try activities that fail.
                    let subacti = activity[activity.length - 1];
                    if (subacti.state === "inprogress") {
                        calculatedState = "inprogress";
                        break;
                    } else if (subacti.state === 'error') {
                        calculatedState = "error";

                    } else if (subacti.state === "completed" && calculatedState !== "error") {
                        calculatedState = "completed";
                    }
                }
                if (calculatedState === "error") {
                    workflow.state = "error";
                    AEvent.emit("workflow." + workflow.state, {
                        obj: _toJSON(workflow),
                        message: `Workflow Finished with ${acti.name} in ${workflow.state} state`
                    });
                    if (workflow.parent) {
                        workflow.parent.state = "error";
                        AEvent.emit("activity.error", {
                            obj: AActivity.toJSON(workflow.parent),
                            message: "Activity Finished from workflow with an error"
                        });
                    }
                } else if (calculatedState === "completed") {
                    workflow.state = "completed";
                    workflow.outputs = acti.outputs;
                    AEvent.emit("workflow.completed", {
                        obj: _toJSON(workflow),
                        message: `Workflow Finished with ${acti.name} in ${workflow.state} state`
                    });
                    if (workflow.parent) {
                        workflow.parent.state = "completed";

                        let outputs = {};
                        for (let oname in workflow.parent.activity.outputs) {
                            outputs[oname] = workflow.parent.activity.outputs[oname].fn(workflow);
                        }
                        workflow.parent.outputs = outputs;
                        AEvent.emit("activity.completed", {
                            obj: AActivity.toJSON(workflow.parent),
                            message: "Activity Finished from workflow",
                        });
                    }
                } else if (calculatedState === "error") {
                    workflow.state = "error";
                    workflow.outputs = acti.outputs;
                    AEvent.emit("workflow.error", {
                        obj: _toJSON(workflow),
                        message: `Workflow Finished with ${acti.name} in ${workflow.state} state`
                    });
                    if (workflow.parent) {
                        workflow.parent.state = "error";

                        let outputs = {};
                        for (let oname in workflow.parent.activity.outputs) {
                            outputs[oname] = workflow.parent.activity.outputs[oname].fn(workflow);
                        }
                        workflow.parent.outputs = outputs;
                        AEvent.emit("activity.error", {
                            obj: AActivity.toJSON(workflow.parent),
                            message: "Activity Finished from workflow",
                        });
                    }
                }
            }
        }
    }
}

function _toJSON(obj) {
    let retval = {};
    for(let aname in obj) {
        let item = obj[aname];
        if(typeof item !== "object") {
            retval[aname] = item;
        } else if(aname === 'inputs') {
            retval[aname] = obj.inputs;
        } else if(aname === 'outputs') {
            retval[aname] = obj.outputs;
        } else if(aname === 'parent') {
            retval.parent = obj.parent.id;
        }
    }
    return retval;
}
