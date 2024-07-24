const AActivity = require('../../src/Server/AActivity');
const AService = require('../../src/Server/AService');
const AIHelper = require('../../src/Server/AIHelper');
const AEvent = require('../../src/Server/AEvent');
const fs = require('fs');
const path = require('path');
const APackage = require("ailtire/src/Server/APackage");

let _workflowInstances = { _total: 0 };
const workflowFormat = `
{
    name: 'Workflow Name',
    description: 'Description of the Workflow',
    activities: {
        // Each activity should map to a use case, scenario, or another workflow.
        // This is the initial activity in the workflow. Everything starts here with the Init activitiy
        Init: {
            description: "Initial state for the workflow",
            actor: 'Actor', // This could be an actor or package.
            package: "My Package", // Either actor or package is defined here. They are mutually exclusive.
            inputs: {
                param1: {
                    description: 'This is a description of the parameter', // Description of the parameter
                    type: 'string', // Type of parameter string, number, ref, json,
                    default: 'This is a default', // This is a default value for the parameter
                    required: true // true or false
                }   
            },
            variables: {
                myVariable: {
                    description: "Variable for the activity",
                    fn: (activity) => { // This is how the variable is calculated. activity represents the current activity in the workflow at runtime.
                        return activity.id;
                    }
                }
            },
            next: {
                "Next Activity": {
                    inputs: {
                        input1: "Hard coded String", // This is a string hard coded for the Next Activity when it is called.
                        input2: (activity) => { return activity.inputs.param1; } // This calculates the input2 for the Next Activity
                    }
                },
                "Next Activity Bad Case": {
                    condition: {
                        test: "Is this good?" // this is the condition to test, Used for documentation.
                        value: "No", // This is the value expected. Used for documentation.
                        fn: (activity) => { return activity.inputs.param1;// returns true or false }
                    }
                },
                "Next Activity Good Case": {
                    condition: {
                        test: "Is this good?",
                        value: "Yes",
                    }
                }
            },
            outputs: {
                output1: {
                    description: "Output 1 from the activity.",
                    fn: (activity) => { return activity.variables}
                },
                output2: {
                    description: "Output 1 from the activity.",
                    fn: (activity) => { return "Made It"; }
                },
            }
        },
        "Next Activity": {
            inputs: {
                name: {
                    description: "Name of the team",
                    type: "string",
                },
            } 
            next: { ... }
        },
        "Next Activity Good Case": {
            description: "This is the good flow!",
            package: "My Package",
            next: { ... }
        },
        "Next Activity Good Case": {
            description: "This is the good flow!",
            next: { ... }
        },
        ...
    }
}`;

module.exports = {
    launch: (workflow, args, callingActivity) => {
        AEvent.emit("workflow.started", {obj: workflow});
        console.log("start Workflow", workflow.name, args);
        // First activity is Init.
        if (!workflow.activities.hasOwnProperty("Init")) {
            AEvent.emit("workflow.failed", {obj: workflow, error: "Init Activity does not exist!"});
            return;
        }
        if (!_workflowInstances.hasOwnProperty(workflow.name)) {
            _workflowInstances[workflow.name] = [];
        }
        // Has to be the total number of woflow instances running not how many of a specific type.
        // so _workflowInstances hos a total attribute that needs to be incremented.
        let id = _workflowInstances._total++;
        if (callingActivity) {
            id = callingActivity.id + '.' + _workflowInstances._total;
        }
        let myInstance = {
            name: workflow.name,
            id: id,
            workflow: workflow,
            currentActivity: 'Init',
            args: args,
            inputs: args,
            activities: {},
            parent: callingActivity,
        };
        _workflowInstances[workflow.name].push(myInstance);
        // Setup the workflow to handle events.
        // Create the Activities and attach them to the workflo
        let init = AActivity.register(myInstance, "Init", workflow.activities.Init);
        AEvent.emit("workflow.inprogress", {obj: _toJSON(myInstance)});

        // If the owner is an actor then create a activity for the user to interact with the system.

        return AActivity.execute(init, args);
    },
    instances: () => {
        return _workflowInstances;
    },
    show: (workflow) => {
        return _workflowInstances[workflow.name];
    },
    handleActivityEvent: (event, workflow, acti) => {
        const AEvent = require('../../src/Server/AEvent');
        // There isn't a next step for the activity.
        if (!acti.activity.next || Object.keys(acti.activity.next).length === 0) {
            // Iterate over the workflow.activities and check the state. This should help determine if the workflow
            // is in a finished state and if the finished state is completed or and error.
            let calculatedState = "";
            // Need to iterate over all of the activties because of parallelism.
            if (event === "activity.completed" || event === "activity.error") {
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
                        console.error("Activity Error:", nact);
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
    },
    save: (workflow, dir) => {
        _save(workflow, dir);
    },
    get: (wname) => {
        return _get(wname);
    },
    generateDescription: async (wname) => {
        const APackage = require('../../src/Server/APackage');
        let messages = [];
        let workflow = _get(wname);
        let package = APackage.getPackage(workflow.pkg);

        // Get the current usecases, class definitions, and workflows
        // Put them into a string and put them as system information.
        // Get the current documentation. Add it as system information.
        let docString = APackage.getDocumentation(package);
        messages.push({role: 'system', content: "Use the following as the package documentation: " + docString});

        let content = JSON.stringify(workflow);
        messages.push({
            role: 'system',
            content: `Use the following as the workflow definition for the user promot: ${content}`
        })

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user', content: "Generate a description, precondition, and postcondition of the workflow based the" +
                " workflow and its activities. The format returned should be json in the following format" +
                " {description:'discriptionText', precondition: 'precondition text', postcondition: 'postcondition" +
                " text' }"
        });
        let response = await AIHelper.askForCode(messages);
        workflow.description = response[0].description;
        workflow.precondition = response[0].precondition;
        workflow.postcondition = response[0].postcondition;
        _save(workflow, package);
        return workflow;
    },
    generateActivities: async (wname) => {
        const APackage = require('../../src/Server/APackage');
        let messages = [];
        let workflow = _get(wname);
        let package = APackage.getPackage(workflow.pkg);
        // Get the current usecases, class definitions, and workflows
        // Put them into a string and put them as system information.
        let items = ["usecases", "workflows"];
        for (i in items) {
            let content = `Use the following supporting ${items[i]} for analysis of the user prompt:`;
            for (let name in global[items[i]]) {
                let obj = global[items[i]][name];
                content += `{${name}: ${obj.description}},`;
                // content += `{ name:${obj.name}, description:${obj.description} }\n`;
            }
            messages.push({role: 'system', content: content});
        }
        // Get the current documentation. Add it as system information.
        let docString = APackage.getDocumentation(package);
        messages.push({role: 'system', content: "Use the following as the package documentation: " + docString});

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'system',
            content: "Assume the role of a system architect. The goal is to identify and generate potential and new" +
                " activities for the workflow using the following as a javascript output template:" +
                ` ${workflowFormat}.` +
                " The activities in the workflow should map to supporting usecases or workflows where possible." +
                " The first activity in the workflow should be named Init. The results should foolw the output" +
                " template. These results will be passed to javascript eval function. Any non-code should be" +
                " commented using javascript comments."
        });
        
        let wdoc = JSON.stringify(workflow);
        messages.push({role: 'user', content: "Analyze and create new activites based on the the following workflow" +
                " make sure all of the steps mentioned in the description, precondition and postcondition are" +
                " represented: " + wdoc});

        let results = await AIHelper.askForCode(messages);
        try {
            // Iterate over the list of use cases and save them.
            for(let i in results[0].activities) {
                workflow.activities[i] = results[0].activities[i];
            }
            return workflow;
        } catch (e) {
            console.error("Error parsing JSON:", e);

        }
    },
}

function _save(workflow,package) {
    let dir = package.definition.dir + '/workflows';
    let wname = workflow.name.replace(/\s/g,'');
    let cfile = path.resolve(`${dir}/${wname}.js`);
    let activities = [];
    for(let aname in workflow.activities) {
        let activity = workflow.activities[aname];
        activity.name = aname;
        activities.push(`"${aname}": ${AActivity.save(activity)}`);
    }
    let output = `
module.exports = {
    name: "${workflow.name}",
    description: \`${workflow.description}\`,
    precondition: "${workflow.precondition}",
    postcondition: "${workflow.postcondition}",
    activities: {
        ${activities.join(",\n")} 
    }
};`;

    if(!fs.existsSync(dir)) {
       fs.mkdirSync(dir, {recursive: true});
    }
    fs.writeFileSync(cfile, output);
    if(!package.definition.workflows) {
        package.definition.workflows = {};
    }
    package.definition.workflows[wname] = workflow;
    return true;
}

function _get(name) {
    return global.workflows[name];
    
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
        } else {
            retval[aname] = aname[obj];
        }
    }
    return retval;
}
