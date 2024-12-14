const fs = require('fs');
const path = require('path');
const AWorkflow = require('./AWorkflow');
let _workflowInstances = {_total: 0};

class AWorkflowInstance {
    constructor(opts) {
        const AActivityInstance = require('../../src/Server/AActivityInstance');
        const AEvent = require('../../src/Server/AEvent');
        if (opts.load) {
            for (let aname in opts) {
                if (aname !== 'load') {
                    this[aname] = opts[aname];
                }
            }
            // Now find the workflow definition to attach it.
            let workflow = AWorkflow.get(this.name);
            if(workflow) {
                this.workflow = workflow;
            }
            if (!_workflowInstances.hasOwnProperty(this.name)) {
                _workflowInstances[this.name] = [];
            }
            _workflowInstances[this.name].push(this);
            _workflowInstances._total = this.id +1; 
            this.#createLookAheadGraph();
            return this;
        } else {
            AEvent.emit("workflow.started", {obj: opts.workflow});
            console.log("start Workflow", opts.workflow.name, opts.args);
            let id = _workflowInstances._total++;

            if (opts.callingActivity) {
                id = opts.callingActivity.id + '.' + _workflowInstances._total;
            }

            this.name = opts.workflow.name;
            this.id = id;
            this.workflow = opts.workflow;
            this.currentActivity = 'Init';
            this.state = 'inprogress';
            this.args = opts.args;
            this.inputs = opts.args;
            this.activities = {};
            this.totalActivities = 0;
            this.parent = opts.callingActivity;

// First activity is Init.
            if (!opts.workflow.activities.hasOwnProperty("Init")) {
                AEvent.emit("workflow.failed", {obj: opts.workflow, error: "Init Activity does not exist!"});
                this.state = 'Failed';
                return this;
            }
            if (!_workflowInstances.hasOwnProperty(opts.workflow.name)) {
                _workflowInstances[opts.workflow.name] = [];
            }
// Has to be the total number of woflow instances running not how many of a specific type.
// so _workflowInstances hos a total attribute that needs to be incremented.
            _workflowInstances[opts.workflow.name].push(this);
            this.#createLookAheadGraph();
            this.startTime = new Date();
            this.save();

// Setup the workflow to handle events.
// Create the Activities and attach them to the workflo
            let init = new AActivityInstance({parent: this, name: "Init", activity: opts.workflow.activities.Init});
            AEvent.emit("workflow.inprogress", {obj: this.toJSON()});

            return init.execute(opts.args);
        }
    }

    static loadAll() {

        let dir = `${ailtire?.config?.baseDir}/.workflows` || `./.workflows`;
        fs.mkdirSync(dir, {recursive: true});
        let wdirs =  fs.readdirSync(dir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name !== '.' && dirent.name !== '..')
            .map(dirent => path.join(dir, dirent.name));
        for (let i in wdirs) {
            AWorkflowInstance.load(wdirs[i]);
        }
    }

    static load(dir) {
        const AActivityInstance = require('../../src/Server/AActivityInstance');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        if(fs.existsSync(`${dir}/index.js`)) {
            let attrs = require(path.resolve(`${dir}/index.js`));
            attrs.load = true;
            let workflowInstance = new AWorkflowInstance(attrs);
            let wdirs = fs.readdirSync(dir, {withFileTypes: true})
                .filter(dirent => dirent.isDirectory() && dirent.name !== '.' && dirent.name !== '..')
                .map(dirent => path.join(dir, dirent.name));
            for (let i in wdirs) {
                let activityInstance = AActivityInstance.load(wdirs[i], workflowInstance);
            }
            return workflowInstance;
        }
        return null;
    }

    toJSON() {
        let retval = {};
        for (let aname in this) {
            let item = this[aname];
            if (typeof item !== "object") {
                retval[aname] = item;
            } else if (aname === 'inputs') {
                retval[aname] = this.inputs;
            } else if (aname === 'outputs') {
                retval[aname] = this.outputs;
            } else if (aname === 'parent') {
                retval.parent = this.parent.id;
            } else if (aname === 'workflow') {
                retval[aname] = this.workflow.name;
            } else if (aname === 'lookaheadGraph') {
                // Do Nothing. skip it.
            } else {
                retval[aname] = this[aname];
            }
        }
        return retval;

    }

    canExecute(activity) {
        // Execute flag will determine what to do.
        if (!activity.execute || activity.execute === 'wait') {
            // If exectue is set to wait this is the default behavior as well.
            // Make sure all of the previous activities are complete. Or any combination of them this needs to support dynamic adding of activities.
            let finished = true;
            for (let pname in this.lookaheadGraph[activity.name].previous) {
                // Check that all activities instances are completed
                let pActList = this.lookaheadGraph[activity.name].previous[pname];
                for (let i in pActList) {
                    if (!pActList[i].isFinished()) {
                        return false;
                    }
                }
                // Check that all potential instances have run
                if (pActList.length === 0) {
                    return false;
                }
            }
            return true;
        } else if (activity.execute === 'immediate') {
            // If execute is set to immediate then only one of the previous activities is finished.
            // infact each time a previous activity completes it should run.
            return true;

        } else if (activity.execute === 'once') {
            // If execute is set to once then one previous activity needs to complete and it is only run once.
            if (this.activities[activity.name].length > 0) {
                return false;
            }
            return true;
        }
    }

    static launch(workflow, args, callingActivity) {
        const retval = new AWorkflowInstance({workflow: workflow, args: args, callingActivity: callingActivity});
        return retval;
    }

    static instances() {
        return _workflowInstances;
    }

    static getInstance(workflow) {
        return _workflowInstances[workflow.name];
    }

    static handleActivityEvent(event, workflow, acti) {
        const AEvent = require('../../src/Server/AEvent');
        // There isn't a next step for the activity.
        if (!acti.activity.next || Object.keys(acti.activity.next).length === 0) {
            // Iterate over the workflow.activities and check the state. This should help determine if the workflow
            // is in a finished state and if the finished state is completed or and error.
            let calculatedState = "";
            // Need to iterate over all of the activties because of parallelism.
            if (event === "activity.completed" || event === "activity.error" || event === "activity.skipped") {
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
                        obj: workflow.toJSON(),
                        message: `Workflow Finished with ${acti.name} in ${workflow.state} state`
                    });
                    workflow.finishedTime = new Date();
                    workflow.save();
                    if (workflow.parent) {
                        workflow.parent.state = "error";
                        workflow.parent.finishedTime = new Date();
                        workflow.parent.save();
                        console.error("Activity Error:", nact);
                        AEvent.emit("activity.error", {
                            obj: workflow.parent.toJSON(),
                            message: "Activity Finished from workflow with an error"
                        });
                    }
                } else if (calculatedState === "completed") {
                    workflow.state = "completed";
                    workflow.finishedTime = new Date();
                    workflow.outputs = acti.outputs;
                    AEvent.emit("workflow.completed", {
                        obj: workflow.toJSON(),
                        message: `Workflow Finished with ${acti.name} in ${workflow.state} state`
                    });
                    workflow.save();
                    if (workflow.parent) {
                        workflow.parent.state = "completed";
                        workflow.parent.finishedTime = new Date();
                        let outputs = {};
                        for (let oname in workflow.parent.activity.outputs) {
                            outputs[oname] = workflow.parent.activity.outputs[oname].fn(workflow);
                        }
                        workflow.parent.outputs = outputs;
                        workflow.parent.finishedTime = new Date();
                        workflow.parent.save();
                        AEvent.emit("activity.completed", {
                            obj: workflow.parent.toJSON(),
                            message: "Activity Finished from workflow",
                        });
                    }
                } else if (calculatedState === "error") {
                    workflow.state = "error";
                    workflow.finishedTime = new Date();
                    workflow.outputs = acti.outputs;
                    workflow.save();
                    AEvent.emit("workflow.error", {
                        obj: workflow.toJSON(),
                        message: `Workflow Finished with ${acti.name} in ${workflow.state} state`
                    });
                    if (workflow.parent) {
                        workflow.parent.state = "error";
                        workflow.parent.finishedTime = new Date();
                        let outputs = {};
                        for (let oname in workflow.parent.activity.outputs) {
                            outputs[oname] = workflow.parent.activity.outputs[oname].fn(workflow);
                        }
                        workflow.parent.outputs = outputs;
                        workflow.save();
                        AEvent.emit("activity.error", {
                            obj: workflow.parent.toJSON(),
                            message: "Activity Finished from workflow",
                        });
                    }
                }
            }
        }
    }

    registerActivity(activity) {
        if (!this.activities.hasOwnProperty(activity.name)) {
            this.activities[activity.name] = [];
        }
        this.activities[activity.name].push(activity);
    }

    save() {
        let dir = `${ailtire.config.baseDir}/.workflows/workflow-${this.id}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        let wfile = `${dir}/index.js`;
        this.baseDir = dir;
        let json = this.toJSON();
        let outputString = `module.exports = ${JSON.stringify(json)};\n`;
        fs.writeFileSync(wfile, outputString);

        for (let i in this.activities) {
            let aInstances = this.activities[i];
            for (let j in aInstances) {
                aInstances[j].save();
            }
        }
        return;
    }

    #createLookAheadGraph() {
        this.lookaheadGraph = {};
        this.activities = {};
        for (let aname in this.workflow.activities) {
            this.activities[aname] = [];
            let activity = this.workflow.activities[aname];
            if (!this.lookaheadGraph.hasOwnProperty(aname)) {
                let lookahead = {next: {}, previous: {}};
                for (let nname in activity.next) {
                    lookahead.next[nname] = true;
                }
                this.lookaheadGraph[aname] = lookahead;
            }
        }
        for (let aname in this.lookaheadGraph) {
            let act = this.lookaheadGraph[aname];
            for (let nname in act.next) {
                if(this.lookaheadGraph.hasOwnProperty(nname)) {
                    this.lookaheadGraph[nname].previous[aname] = this.activities[aname];
                } else {
                    console.error("-->Activity not find ", nname);
                }
            }
        }
        return this;
    }
}

module.exports = AWorkflowInstance;
