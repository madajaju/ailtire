const AActivity = require('../../src/Server/AActivity');
const AActvityInstance = require('../../src/Server/AActivityInstance');
const AService = require('../../src/Server/AService');
const AIHelper = require('../../src/Server/AIHelper');
const fs = require('fs');
const path = require('path');

let _workflowInstances = { _total: 0 };
const workflowFormat = `
{
    name: 'Workflow Name',
    description: 'Description of the Workflow',
    precondition: 'precondition of the workflow',
    postcondition: 'postcondition of the workflow',
    category: 'level1/level2/...', // This shows the category of the workflow groupings by levels with / separating the groupings.
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
                },
                param2: { ...
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
                    inputs: {
                        input1: (activity) => { return activity.inputs.param1; }
                    },
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
                },
                "Loop Activity": {
                    inputs: {
                        input1: (activity, item) => { return item.length; } // activity is the calling activity, item is the results of the loop function
                    }
                    loop: {
                        description: "Iterate over the languages of the model",
                        fn: (activity) => { return activity.variables.languages; } // This should pass back a list to be iterated over. All inputs of the activity are given the item from the list.
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
            },
        },
        "Loop Activity": {
            inputs: { ... }, 
            variables: { ... },
            next: { ... }, 
            outputs: { ... }
        },
        "Next Activity": {
            execute: wait // This will wait to run until all of the dependent activities have finish. Other option is immediate. Which means when any of the previous activites finishes it will run.
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
    instances: () => {
        return _workflowInstances;
    },
    show: (workflow) => {
        return _workflowInstances[workflow.name];
    },
    create: (workflow) => {
        const AEvent = require("./AEvent");
        const APackage = require("./APackage");
        let wfObj = _get(workflow.name);
        if(!wfObj) {
            _save(workflow, global.topPackage);
            AEvent.emit("workflow.created", workflow);
        } else {
            for(let aname in workflow) {
                let attr = workflow[aname];
                wfObj[aname] = workflow[aname];
            }
            let pkg = APackage.get(wfObj.pkg);
            _save(wfObj, pkg);
            AEvent.emit("workflow.updated", wfObj);
        }
        return workflow;
    },
    save: (workflow, package) => {
        _save(workflow, package);
    },
    get: (wname) => {
        return _get(wname);
    },
    generateItems: async(text) => {
        const APackage = require('../../src/Server/APackage');
        let package = global.topPackage;
        let messages = []; 
        let docString = APackage.getDocumentation(package);
        messages.push({role: 'system', content: "Use the following as the package documentation: " + docString});
        // now put the list of workflows into the list so I don't create something that already exits.
        let workflowString = Object.keys(global.workflows).map(name => { return `"${name}": "${global.workflows[name].description.substring(0,120)}"`; }).join(',');
        messages.push({
            role: 'system',
            content: `Use the following as the current workflows in the system the user promot: ${workflowString}`
        });
        let wfcats = Object.keys(global.workflows).map(name => { return global.workflows[name].prefix; } ).join(', ');
        
        messages.push({
            role:'system',
            content: `When creating workflows make sure they fit in the current categories of the system which are defined by the following: ${wfcats}`
        });
        messages.push({
            role:'system',
            content: `Take the user prompt and identify business processes(workflows) in the systems and create the wokflows based on the following format: ${workflowFormat}`
        });
        
        messages.push({
            role: 'user',
            content: text,
        });
        
        let workflows = await AIHelper.askForCode(messages);
        for(let i in workflows) {
            let workflow = workflows[i];
            _save(workflow, package);
        }
        return workflows;
        
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
            _save(workflow, package);
            return workflow;
        } catch (e) {
            console.error("Error parsing JSON:", e);

        }
    },
}

function _save(workflow,package) {
    const ACategory = require('../../src/Server/ACategory');
    let dir = package.definition.dir + '/workflows';
    dir += `/${workflow.category.replace(/\s/g,'')}`;
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive:true});
    }
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
    global.workflows[wname] = workflow;
    
    let category = ACategory.get(workflow.category);
    if(category) {
        category.workflows.push(workflow);
    }
    return true;
}

function _get(name) {
    return global.workflows[name] || global.workflows[name.replace(/\s/g,'')];
}

function _saveInstance(obj) {
    let dir = `${ailtire.config.baseDir}/.workflows/workflow-${obj.id}`;
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true}); 
    }
    let wfile = `${dir}/index.js`;
    obj.baseDir = dir;
    let json = _toJSON(obj);
    let outputString = `module.exports = ${JSON.stringify(json)};\n`;
    fs.writeFileSync(wfile, outputString);
   
    for(let i in obj.activities) {
        let activity = obj.activities[i];
        AActivity.saveInstance(activity, obj);
    }
    return;
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
