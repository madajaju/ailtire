const fs = require('fs');
const path = require('path');
const AEvent = require("ailtire/src/Server/AEvent");

let _activityInstances = {};

class AActivityInstance {
    constructor(opts) {
        const AEvent = require('../../src/Server/AEvent');
        if (opts.load) {
            for (let aname in opts) {
                if (aname !== 'load') {
                    this[aname] = opts[aname];
                }
            }
            if(!_activityInstances.hasOwnProperty(opts.name)) {
                _activityInstances[opts.name] = {};
            }
            _activityInstances[opts.name][this.id] = this;
            this.parent.totalActivities++;
            this.parent.registerActivity(this);
            return this;
        } else {
            // create the activity instance cache
            if (!_activityInstances.hasOwnProperty(opts.name)) {
                _activityInstances[opts.name] = {};
            }
            this.name = opts.name;
            let iid = `${opts.parent.id}.${opts.parent.totalActivities++}`;
            if (opts.number) {
                iid += `-${opts.number}`;
            }
            this.id = iid;
            this.number = opts.number || 0;
            this.activity = opts.activity;
            this.state = "created";
            this.parent = opts.parent;
            this.startTime = new Date();

            if (opts.previous) {
                this.previous = [{id: opts.previous.id, name: opts.previous.name}];
            }
            AEvent.emit("activity.created", {obj: this.toJSON()});
            _activityInstances[opts.name][iid] = this;
            opts.parent.registerActivity(this);

            this.blocked();

            return this;
        }
    }
    static load(dir, parent) {
        if(fs.existsSync(`${dir}/index.js`)) {
            let attrs = require(path.resolve(`${dir}/index.js`));
            attrs.load = true;
            attrs.parent = parent;
            let retval = new AActivityInstance(attrs);
            return retval;
        }
        return null;
    }

    static getInstance(id) {
        return _activityInstances[id];
    }

    static instances() {
        return _activityInstances;
    }

    toJSON() {
        let retval = {};
        for (let i in this) {
            let attr = this[i];
            if (typeof attr === 'string') {
                retval[i] = attr;
            } else {
                switch (i) {
                    case 'obj':
                        retval[i] = attr.name;
                        break;
                    case 'activity':
                        retval[i] = attr.name;
                        break;
                    case 'parent':
                        break;
                    default:
                        retval[i] = attr;
                        break;
                }
            }
        }
        return retval;
    }

    save() {
        let tempObj = {};
        let dir = this.baseDir || `${this.parent?.baseDir}/activity-${this.id}`;
        this.baseDir = dir;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        let wfile = `${dir}/index.js`;
        // let json = this.toJSON();
        // let outputString = `module.exports = ${JSON.stringify(json)};\n`;
        // fs.writeFileSync(wfile, outputString);
        return;
    }

    skip() {
        const AEvent = require('../../src/Server/AEvent');
        this.state = "skipped";
        this.finishedTime = new Date();
        this.save();
        AEvent.emit("activity.skipped", {obj: this.toJSON()});
        return this;
    }

    isFinished() {
        if (this.state === "completed" || this.state === "skipped" || this.state === "error") {
            return true;
        } else {
            return false;
        }
    }

    started() {
        const AEvent = require('../../src/Server/AEvent');
        this.state = "inprogress";
        let variables = {};
        for (let vname in this.variables) {
            variables[vname] = this.variables[vname].value = this.variables[vname].fn(this);
        }
        this.variables = variables;
        this.save();
        AEvent.emit("activity.inprogress", {obj: this.toJSON()});
    }

    complete() {
        const AEvent = require('../../src/Server/AEvent');
        this.state = "completed";
        this.finishedTime = new Date();
        this.save();
        AEvent.emit("activity.completed", {obj: this.toJSON()});
        return this;
    }

    failed(message) {
        const AEvent = require('../../src/Server/AEvent');
        this.state = 'failed';
        this.message = "Error Running Activity:" + message;
        this.finishedTime = new Date();
        this.save();
        AEvent.emit("activity.error", {obj: this.toJSON(), message: "Error Running Activity: " + message})
        return this;
    }

    blocked() {
        const AEvent = require('../../src/Server/AEvent');
        this.state = "blocked";
        this.blockedTime = new Date();
        this.save();
        AEvent.emit("activity.blocked", {obj: this.toJSON()});
    }

    execute(args) {
        const AEvent = require('../../src/Server/AEvent');
        // Evaluate the args
        let variables = {};
        // Check to see if all of the previous activities are in a finished state.
        // If they are then proceed.
        // If not then set the state to blocked and return.
        // We also need to check that all of the activityInstances have been created based on the workflow definition.

        // All must be finished before you can execute
        let finished = true;
        this.inputs = args;
        this.started();
        // This is where you check to see if there is a workflow or a scenario that matches the name.
        try {
            if (this.activity.type === "workflow") {
                // Set a handler to be notified when the workflow is finished.
                // Now call the launch on the workflow.
                const AWorkflowInstance = require('../../src/Server/AWorkflowInstance');
                // dont wait for the workflow to launch and manage execution through the events.
                AWorkflowInstance.launch(this.activity.obj, this.inputs, this);
                // do not processes the  output because it is not done yet.
                return this;
                // When it finishes the activity.precomplete should be handled.
            } else if (this.activity.type === "scenario") {
                const AScenarioInstance = require('../../src/Server/AScenarioInstance');
                // Find the scenario and then launch it.
                // Call the AScenarioInstance waiting for the results.
                try {
                    let scenario = this.activity.obj;
                    let retval = AScenarioInstance.launch(scenario, this.inputs);
                    if (retval instanceof Promise) {
                        retval.then(result => {
                            this.variables.returnValue = result;
                            this.outputs = this.processOutputs();
                            this.complete();
                            return this;
                        }).catch(e => {
                            this.failed(e);
                        });
                    } else {
                        this.variables.returnValue = retval;
                        this.outputs = this.processOutputs(this);
                        this.complete();
                        return this;
                    }
                } catch (e) {
                    this.failed("Error Calling Scenario:" + e);
                }
            } else {
                const UserActivity = require('../../src/Server/UserActivity');
                // Check to see if the owner is an actor. If it is then create a UserActivity
                // User Activites will prompt the user for the inputs.
                if (this.activity.actor && this.name !== "Init") {
                    let uactivity = new UserActivity({actor: this.activity.actor, activity: this});
                    return;
                } else { // This is trying to find an action that can be run.
                    // Check to see if the activity has an action in the system.
                    const Action = require('./Action');

                    let action = Action.find(this.name);
                    if (action) {
                        try {
                            let retval = Action.execute(action, this.inputs);
                            if (retval instanceof Promise) {
                                retval.then(result => {
                                    this.variables.returnValue = result;
                                    this.outputs = this.processOutputs();
                                    this.complete();
                                    return this;
                                }).catch(e => {
                                    this.failed("Error Executing Action:" + e);
                                });
                            } else {
                                this.variables.returnValue = retval;
                                this.outputs = this.processOutputs();
                                this.complete();
                                return this;
                            }
                        } catch (e) {
                            this.failed("Error Executing Action:" + e);
                        }
                    } else {
                        console.log("Do Nothing");
                        this.outputs = this.processOutputs();
                        this.complete();
                    }
                }
            }
        } catch (e) {
            this.failed("Error Running Activity:" + e);
        }
        return this;
    }

    processOutputs() {
        let outputs = {};
        for (let oname in this.activity.outputs) {
            // Need to handle await activities.
            outputs[oname] = this.activity.outputs[oname].fn(this);
        }
        return outputs;
    }

    processInputs(acti, nacti) {
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
        this.inputs = args;
    }

    // The acti has already been set to the correct state.
    // This is what is handling that change in state.
    static handleEvent(event, data) {
        const AWorkflowInstance = require('../../src/Server/AWorkflowInstance');
        let acti = _activityInstances[data.obj.name][data.obj.id];

        if (event === "activity.completed") {
            AWorkflowInstance.handleActivityEvent(event, acti.parent, acti);
        } else if (event === "activity.error") {
            AWorkflowInstance.handleActivityEvent(event, acti.parent, acti);
        }
        // Set the variables
        // Iterate over the next activites.
        // create them all first and then execute them.
        for (let aname in acti.activity.next) {
            // This is the calling of the next activity. this has the conditions to run the activity.
            let nextActivityCall = acti.activity.next[aname];
            nextActivityCall.name = aname;
            // Get the activity from the parent workflow definition. This has the complete activity definition.
            let nextActivity = acti.parent.workflow.activities[aname];
            // The acti.activity.next only has the calling definition not the instance.
            if (!nextActivity) {
                console.error("Declared a next Activity that does not exist:", i);
                throw Error("Declared a next Activity that does not exist");
            }
            nextActivity.name = aname;

            // ok now we are going to figure out what to start next.
            // First call the canExecute for the WorkflowInstance to make sure it can execute
            if (acti.parent.canExecute(nextActivity)) {
                // If there is a condition then add the activityinstance and then test the condition
                // If there is a loop then iterate over the loop and add an activityinstance for each one.
                // If there are niether then add the activityinstance and execute.
                // Set the blocking condition for the nextActivity. This comes from the acti.activity.next
                if (nextActivityCall.condition) {
                    let nact = new AActivityInstance({
                        parent: acti.parent,
                        name: aname,
                        activity: nextActivity,
                        previous: acti
                    });
                    nact.condition = nextActivityCall.condition;
                    nact.processInputs(acti, nextActivityCall);
                    if (nact.condition.hasOwnProperty('fn')) {
                        if (nact.condition.fn(acti)) {
                            // Evaluate the args
                            nact.execute(nact.inputs);
                        } else {
                            nact.skip();
                        }
                    } else {
                        // No function to evaluate so run it anyway.
                        nact.execute(nact.inputs);
                    }
                } else if (nextActivityCall.loop) {
                    if (nextActivityCall.loop.hasOwnProperty('fn')) {
                        let items = nextActivityCall.loop.fn(acti);
                        let nextActivities = [];
                        // Create all of the instances in the loop first and then run them. This will make sure all of them are complete before continuing on to the next activity.
                        for (let j in items) {
                            let nact = new AActivityInstance({
                                parent: acti.parent,
                                name: aname,
                                number: j,
                                activity: nextActivity,
                                previous: acti
                            });
                            nact.processInputs(acti, nextActivityCall);
                            nextActivities.push(nact);
                        }
                        for (let j in nextActivities) {
                            nextActivities[j].execute(nextActivities[j].inputs);
                        }
                    }
                } else {
                    let nact = new AActivityInstance({
                        parent: acti.parent,
                        name: aname,
                        activity: nextActivity,
                        previous: acti
                    });
                    nact.processInputs(acti, nextActivityCall);
                    nact.blocked();
                    nact.execute(nact.inputs);
                }
            } else {
                console.error("Could not execute");
            }

        }
    }
}

module.exports = AActivityInstance;
