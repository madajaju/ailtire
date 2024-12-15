const AClass = require("./AClass");

const path = require("path");
const fs = require("fs");
const AIHelper = require(`./AIHelper`);
const AEvent = require("./AEvent");
const AActor = require("./AActor");
const AUseCase = require("./AUseCase");
const ANote = require("./ANote");


module.exports = {
    saveConfig: () => {
        global.ailtire.config;
        let configFile = path.resolve('./.ailtire.js');
        fs.writeFileSync(configFile, `module.exports = ${JSON.stringify(global.ailtire.config)};`);
    },
    generateItems: async (notes, filters, id, env) => {
        let newNote = null;
        if(id) {
           newNote = ANote.get(id);
        }
        if(!newNote) {
            newNote = new ANote({text: notes});
            newNote.save();
        }
        if (env && env.res) {
            env.res.json(newNote);
        }
        await _generateSummary(newNote);
        // The order matters because primary findings will be used in higher order elements.
        // First start with the action items.
        // Action Items
        if(filters.actionItems) {
            await _generateActionItems(newNote);
        }
        // Actors
        if(filters.actors) {
            await _generateActors(newNote);
        }
        // Use Cases
        if(filters.useCases) {
            await _generateUseCases(newNote);
        }
        //Scenarios
        if(filters.scenarios) {
           await _generateScenarios(newNote);
        }
        // Workflows
        if(filters.workflows) {
            await _generateWorkflows(newNote);
        }
        // Packages
        if(filters.workflows) {
            await _generatePackages(newNote);
        }
        // Models
        if(filters.classes) {
            await _generateModels(newNote);
        }
        // Interfaces Do not add this at this time. Let the use cases, workflows and scenarios dictate the interface.
        if(filters.interfaces) {
            await _generateInterfaces(newNote);
        }
        return;
    },
};

async function _generateSummary(notes) {
    let notesArray = notes.text.split('\n');
    let chunks = [""];
    let chunkIndex = 0;
    for(let i in notesArray) {
        if(chunks[chunkIndex].length > 20000) {
            chunkIndex++;
            chunks[chunkIndex] = "";
        }
        chunks[chunkIndex] += notesArray[i] + '\n';
    }
    AEvent.emit("note.summary.started", { message: "Generating Summary from Notes"});
    let summaries = [];
    for(let i in chunks) {
        AEvent.emit("note.summary.inprogress", { message: `Finding Action Items from Notes: ${(i/chunks.length)*100}%`});
        let messages = [];
        messages.push({
            role: "system",
            content: `For the user prompt generate a summary of the notes and topics discussed. If this is a transcript or meeting notes list the attendees as well.`
        });
        messages.push({role: 'user', content: chunks[i]});
        summaries.push(await AIHelper.ask(messages));
    }
    let summary = "";
    if(summaries.length > 1) {
        // Combine the summaries.
        let messages = [];
        messages.push({
            role: "system",
            content: `For the user prompt combine the summaries into one cohesive summary`
        });
        messages.push({role: 'user', content: summaries.join('\n-----------\n')});
        summary = await AIHelper.ask(messages);
    } else {
        summary = summaries[0];
    }
    notes.summary = summary;
    AEvent.emit("note.summary.completed", {obj: { id: notes.id, summary: summary}});
    notes.save();
}

async function _generateActionItems(notes) {
    let notesArray = notes.text.split('\n');
    let chunks = [""];
    let chunkIndex = 0;
    for(let i in notesArray) {
        if(chunks[chunkIndex].length > 20000) {
           chunkIndex++;
           chunks[chunkIndex] = "";
        }
        chunks[chunkIndex] += notesArray[i] + '\n';
    }
    // Create action items from the note coming in.
    // First look at the action items in the current UserActivities
    const actionItemFormat = `
    {
        name: "Action Item Name",
        summary: "Summary of the Action Item",
        description: "Details of the Action Item",
        assignee: "The person who the action item is assigned.",
        reporter: "Who identified the action item.",
        dueDate: "When should the action item be completed.",
    }
    `
    AEvent.emit("generate.actionItems.started", { message: "Generating Action Items from Notes"});
    let actionItemList = [];
    for(let i in chunks) {
        AEvent.emit("generate.actionItems.inprogress", { message: `Finding Action Items from Notes: ${(i/chunks.length)*100}%`});
        let messages = [];
        messages.push({
            role: "system",
            content: `For the user prompt identify all of the action items, the due date and who is responsible. Use the following json format: ${actionItemFormat}`
        });
        messages.push({
            role: "system",
            content: `For the dueDate identify a real date or two weeks from ${new Date()}.`
        });
        messages.push({role: 'user', content: chunks[i]});
        let actionItems = await AIHelper.askForCode(messages);
        for (let i in actionItems) {
            notes.addItem('AActionItem', actionItems[i]);
        }
    }
    /*
    let messages = [];
    messages.push({ role:'system',content: 'Find duplicates and merge their descriptions from the list of action items in the user prompt.'});
    messages.push({ role:'system',content: `Use the following json format: ${actionItemFormat}`});
    messages.push({ role:'user',content: `Here is the list of actionItems: ${JSON.stringify(actionItemList)}`});

    AEvent.emit("generate.actionItems.inprogress", { message: `Finding Action Items from Notes: 90%`});
    
    let actionItems = await AIHelper.askForCode(messages);
    for(let i in actionItems) {
        notes.addItem('AActionItem', actionItems[i]);
    }
     */
    AEvent.emit("generate.actionItems.completed", {message: `Generating ${notes.items.length} ActionItems from Notes`});
    notes.save();
}

function _getPackage(pkgName) {
    pkgName = pkgName.replace(/\s/g, '');
    if (global.packages.hasOwnProperty(pkgName)) {
        return global.packages[pkgName];
    } else {
        for (let name in global.packages) {
            if (name.toLowerCase() === pkgName.toLowerCase()) {
                return global.packages[name];
            }
        }
    }
    // Now check the short name
    for (let name in global.packages) {
        let pkg = global.packages[name];
        if (pkg.shortname === pkgName) {
            return pkg;
        }
    }
    throw new Error("Package Not Found:" + pkgName);
};

async function _generateScenarios(notes) {
    let package = global.topPackage;
    AEvent.emit("generate.scenarios.started", {message: `Generating Scenarios from Notes`});
    let pjson = JSON.stringify(package);
    let ajson = JSON.stringify(AActor.toPrompt(global.actors));
    let ujson = JSON.stringify(AUseCase.toPrompt(global.usecases));
    let messages = [];
    messages.push({role: 'system', content: `Use the following usecases for analysis of the user prompt: ${ujson}`});
    messages.push({role: 'system', content: `Use the following actors for analysis of the user prompt: ${ajson}`});
    messages.push({role: 'system', content: `Use the following package for analysis of the user prompt: ${pjson}`});
    messages.push({
        role: 'user',
        content: "Based on the information generate any new scenarios for the usecases. Each scenario should belong to a usecase. For" +
            " each current scenario elaborate on the description, given, when and then statements." +
            " Limit each given,when and then statement to less than 80 characters. The results should be in" +
            " json format: { name: 'scenarioName', usecase: 'usecaseName', description: 'decritpion Text', given: 'given text'," +
            " when: 'when text', then: 'then text', actors: {'actorName': 'actorAction'}}." +
            " The results should be an array of these objects."
    });

    let scenarios = await AIHelper.askForCode(messages);
    // Now see if the new scenarios fit into the use cases.
    /* messages = [];
    messages.push({role: 'system', content: `Use the following usecases for the analysis of the user prompt: ${ujson}`});
    messages.push({role: 'system', content: "For each scenario in the user prompt find a usecase for each it scenario " +
            "and return a json map that has { usecaseName: scenarioName}. If a usecase does not exist give a name for a new one."});
   let sjson = scenarios.join('\n');
   messages.push({role: 'user', content: `Map these scenarios to usecases: ${sjson}`});
    let mapping = await AIHelper.askForCode(messages);
     */
    for (let i in scenarios) {
        let sname = scenarios[i].name.replace(/\s/g, '');
        let scenario = scenarios[i];
        notes.addItem('AScenario', scenario);
    }
    AEvent.emit("generate.scenarios.completed", {message: `Generating ${scenarios.length} Scenarios from Notes`});
    notes.save();
}

async function _generateActors(notes) {
    let package = global.topPackage;
    let pjson = JSON.stringify(package.toJSON());
    let ajson = JSON.stringify(AActor.toPrompt(global.actors));
    let messages = [];
    AEvent.emit("generate.started", {message: "Generating Actors from Notes"});
    messages.push({role: 'system', content: `Use the following actors for analysis of the user prompt: ${ajson}`});
    messages.push({role: 'system', content: `Use the following package for analysis of the user prompt: ${pjson}`});
    messages.push({
        role: 'user', content: "Based on the following information generate any new actors for the system. " +
            " The results should be in" +
            " json format: { name: 'actorName', shortname: 'actorShortName', description: 'decritpion Text'}." +
            " The results should be an array of these objects. actorShortName should be a name that has nospaces " +
            `and all lowercase and a wellknown abbrevation for the actorName. Here is the following information: ${notes.text}`
    });

    let actors = await AIHelper.askForCode(messages);
    for (let i in actors) {
        let actor = actors[i];
        notes.addItem('AActor', actor);
        /*
        let oldActor = AActor.get(actor.name);
        if(!oldActor) {
            AActor.save(actor);
        }
         */
    }
    notes.save();
    AEvent.emit("generate.completed", {message: `Generated ${actors.length} Actors from Notes`});
    return actors;
}

async function _generateWorkflows(notes) {
    const AWorkflow = require("./AWorkflow");
    AEvent.emit("generate.started", {message: "Generating Workflows from Notes"});
    const workflowFormat = `
{
    name: 'Workflow Name',
    description: 'Description of the Workflow',
    precondition: 'precondition of the workflow',
    postcondition: 'postcondition of the workflow',
    category: 'level1/level2/...', // This shows the category of the workflow groupings by levels with / separating the groupings.
    activities: {
        // Each activity should map to a use case, scenario, or another workflow.
        // This is the initial activity in the workflow. Everything starts here
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
        },
        "Next Activity Good Case": {
            description: "This is the good flow!",
            package: "My Package",
        },
        "Next Activity Good Case": {
            description: "This is the good flow!",
            package: "My Other Package"
        },
    }
}`;
    let messages = [];
    let package = global.topPackage;
    // Get the current usecases, class definitions, and workflows
    // Put them into a string and put them as system information.
    let items = ["usecases", "workflows"];
    for (i in items) {
        let content = `Use the following ${items[i]} for analysis of the user prompt:`;
        for (let name in package[items[i]]) {
            let obj = package[items[i]][name];
            content += JSON.stringify(obj);
            // content += `{ name:${obj.name}, description:${obj.description} }\n`;
        }
        messages.push({role: 'system', content: content});
    }
    // Get the current documentation. Add it as system information.
    let docString = _getDocumentation(package);
    messages.push({role: 'system', content: "Use the following as the package documentation: " + docString});

    // Now ask to show the changes to the documentation based on all of the information.
    messages.push({
        role: 'system',
        content: `Assume the role of a system architect. Identify and generate potenital workflows of the application using the following as a` +
            ` javascript output template: ${workflowFormat}. Workflows are processes that are used to automate the processes of the system.` +
            ` The steps in the workflow should map to scenarios, usecases or other workflows where possible.` +
            ` The results should be in an json array of json objects following the output template that will be passed to javascript eval function.` +
            ` Any non-code should be commented using javascript comments. Take the user prompt as input to generate workflows`
    });
    messages.push({
        role: 'user',
        content: notes.text
    });
    let workflows = await AIHelper.askForCode(messages);
    try {
        // Iterate over the list of use cases and save them.
        if (Array.isArray(workflows)) {
            for (let i in workflows) {
                let workflow = workflows[i];
                notes.addItem('AWorkflow', workflow);
            }
        } else {
            notes.addItem('AWorkflow', workflow);
        }
        notes.save();
        AEvent.emit("generate.completed", {message: `Generating ${workflows.length} Workflows from Notes`});
        return package;
    } catch (e) {
        console.error("Error parsing JSON:", e);
    }
}

async function _generatePackages(notes) {
}

async function _generateModels(notes) {
    const modelFormat = `
    {
        name: 'class name',
        description: 'class description',
        package: 'package name',
        attributes: {
            "attributeName1": {
                name: "attributeName1",
                description: "attributeName1 description",
                type: "Attribute1Type",
            },
            "attributeName2: { ... },
            ...
        }
        associations: {
             assocName1: {
                name: "assocName1",
                description: "description 1",
                type: "ModelName" // Name of the class in the association.
                cardinality: 1 // This is 1 or 'n'
                composition: true | false // True if the model controls the object in this relationship.
                owner: true | false // True if propigation of create and destroy happens
                via: 'name of association' // Only set if the owner is true and will create a association on the child  object.
            },
            assocName2 : { ... }
            ...
        },
    };
    `;
    let messages = [];
    let package = global.topPackage;
    // Get the current usecases, class definitions, and workflows
    // Put them into a string and put them as system information.
    let items = ["classes", "packages"];
    for (i in items) {
        let content = `Use the following ${items[i]} for analysis of the user prompt:`;
        for (let name in global[items[i]]) {
            let obj = global[items[i]][name];
            content += JSON.stringify(obj);
            // content += `{ name:${obj.name}, description:${obj.description} }\n`;
        }
        messages.push({role: 'system', content: content});
    }
    // Get the current documentation. Add it as system information.
    messages.push({role: 'system',
        content: `From the user prompt identify and generate classes using the following as a` +
            ` template: ${modelFormat}. Output should be in an array of json objects. Only return the json.`});
        
    messages.push({ role: 'user', content: notes.text });
    let models = await AIHelper.askForCode(messages);
    try {
        // Iterate over the list of use cases and save them.
        for (let i in models) {
            let model = models[i];
            notes.addItem('AClass', model);
        }
        return models;
    } catch (e) {
        console.error("Error parsing JSON:", response, e);
    }
}

async function _generateInterfaces(notes) {
    const interfaceFormat = `{
    package: 'Package Name',
    friendlyName: 'name of the interface',
    description: 'Description of the Interface'
    static: true,
    inputs: {
        "inputName1": {
            description: "Description of the input",
            type: "string", // string|boolean|number|date|ref
        },
        "inputName2: ...
    },
    exits: {
        json: (obj) => {
            return obj;
        },
        success: (obj) => {
            return obj;
        },
        notFound: (obj) => {
            console.error("Object not Found:", obj);
            return null;
        },
    },


    fn: async function (inputs, env) {
        return; 
    }
};`;
    let messages = [];
    let package = global.topPackage;
    // Get the current usecases, class definitions, and workflows
    // Put them into a string and put them as system information.
    /*
    let items = ["packages", "usecases", "workflows"];
    for (i in items) {
        let content = `Use the following ${items[i]} for analysis of the user prompt:`;
        for (let name in package[items[i]]) {
            let obj = package[items[i]][name];
            content += `{ name:${obj.name}, description:${obj.description} }\n`;
        }
        messages.push({role: 'system', content: content});
    }
     */
    
    // Get the current documentation. Add it as system information.
    messages.push({
        role: 'system',
        content: `Take the user prompt and generate interfaces to the packages for the project. ` +
            'An interface is an interface to a package and represents a traditional interface to the package. ' +
            'This is how external entities interact with the package. ' +
            `A good interface name should follow object/methodName formation. ' +
            'A methodName should be an active verb and follow Camelcase format starting with a lowercase letter. ` +
            `The output should use the following template: ${interfaceFormat}. Output should be an array of ` +
            `json objects. Only return the json.`
    });

    // Now ask to show the changes to the documentation based on all of the information.
    messages.push({role: 'user', content: notes.text});
    let interfaces = await AIHelper.askForCode(messages);
    for (let i in interfaces) {
        let interface = interfaces[i];
        // usecase.package = package.name;
        // usecase.prefix = package.prefix;
        // usecase.dir = path.resolve(`${package.dir}/usecases/${usecase.name.replace(/\s/g, '')}`);
        notes.addItem('AAction', interface);
        // AUseCase.save(usecase);
    }
    notes.save();
    AEvent.emit("generate.completed", {message: `Generating ${usecases.length} UseCases from Notes`});
    return package;
}

async function _generateUseCases(notes) {
    const AUseCase = require("./AUseCase");
    AEvent.emit("generate.started", {message: `Generating UseCases from Notes`});
    const usecaseFormat = `
    {
        name: 'usecase name',
        description: 'usecase description'
        actors: {
            'actor': 'uses'
        },
        // shows dependency
        includes: ["usecase name"],
        // show aggreation from a super use case
        extends: ["usecase name"],
        pre: "preconditions of the use case",
        post: "postconditions of the use case",
        scenarios: { "scenarioname1": {name: "scenarioname1", description: "scenario description 1"}, "scenarioname2", ... }
    };
    `;
    let messages = [];
    let package = global.topPackage;
    // Get the current usecases, class definitions, and workflows
    // Put them into a string and put them as system information.
    let items = ["usecases", "classes", "workflows"];
    for (i in items) {
        let content = `Use the following ${items[i]} for analysis of the user prompt:`;
        for (let name in package[items[i]]) {
            let obj = package[items[i]][name];
            content += JSON.stringify(obj);
            // content += `{ name:${obj.name}, description:${obj.description} }\n`;
        }
        messages.push({role: 'system', content: content});
    }
    // Get the current documentation. Add it as system information.
    let docString = _getDocumentation(package);
    messages.push({role: 'system', content: "Use the following as the package documentation: " + docString});
    messages.push({
        role: 'system',
        content: `Take the user prompt and generate use cases or update existing use cases for the project. ` +
            `A good use case name should be an action phrase beginning with active verbs, be user focused, and concise. ` +
            `The output should use the following template: ${usecaseFormat}. Output should be an array of ` +
            `json objects. Only return the json.`
    });

    // Now ask to show the changes to the documentation based on all of the information.
    messages.push({role: 'user', content: notes.text});
    let usecases = await AIHelper.askForCode(messages);
    for (let i in usecases) {
        let usecase = usecases[i];
        usecase.package = package.name;
        usecase.prefix = package.prefix;
        usecase.dir = path.resolve(`${package.dir}/usecases/${usecase.name.replace(/\s/g, '')}`);
        notes.addItem('AUseCase', usecase);
        // AUseCase.save(usecase);
    }
    notes.save();
    AEvent.emit("generate.completed", {message: `Generating ${usecases.length} UseCases from Notes`});
    return package;
};

function _getDocumentation(cls) {
    let retval = "";
    if (cls.doc && cls.doc.basedir) {
        let bdir = cls.doc.basedir;
        for (let i in cls.doc.files) {
            let dfile = path.resolve(`${bdir}/${cls.doc.files[i]}`);
            let extName = path.extname(dfile);
            if (extName === '.puml' || extName === '.emd' || extName === '.md') {
                retval += fs.readFileSync(dfile, 'utf-8');
            }
        }
    }
    return retval;
}

function _getUseCase(name) {
    name = name.replace(/\s/g, '');
    if (global.usecases.hasOwnProperty(name)) {
        return global.usecases[name];
    } else {
        for (let ucname in global.usecases) {
            if (ucname.toLowerCase() === name.toLowerCase()) {
                return global.usecases[ucname];
            }
        }
    }
    return 0;
}