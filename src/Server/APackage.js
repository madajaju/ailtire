const fs = require('fs');
const path = require('path');
const AUseCase = require('./AUseCase');
const AClass = require('./AClass');
const AWorkflow = require('./AWorkflow');
const AMethod = require("ailtire/src/Server/AMethod");
const AHandler = require("ailtire/src/Server/AHandler");

const workflowFormat = `
{
    name: 'Workflow Name',
    description: 'Description of the Workflow',
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

const interfaceFormat = `
{
    name: 'interface name',
    description: 'interface description'
    inputs: {
        'input1Name': {
            type: "input1Type",
            description: "input1 description"
        },
       'input2Name': {
            type: "input2Type",
            description: "input2 description"
        },
        ...
    },
};
`;
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
const modelFormat = `
    {
        name: 'class name',
        description: 'class description',
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
module.exports = {
    getPackage: (pkgName) => {
        return _getPackage(pkgName);
    },
    getDocumentation: (pkg) => {
        if (typeof pkg === 'string') {
            pkg = _getPackage(pkg);
        }
        return _getDocumentation(pkg);
    },
    generateDocumentation: async (pkgName) => {
        let messages = [];
        let package = _getPackage(pkgName);
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

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user', content: 'Elaborate the package documentation based on the usecases, classes and' +
                ' workflows.'
        });
        let response = await _askAI(messages);
        let cfile = path.resolve(`${package.doc.basedir}/doc.emd`);
        fs.writeFileSync(cfile, response);
        return response;
    },
    generateModels: async (pkgName) => {
        let messages = [];
        let package = _getPackage(pkgName);
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

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user', content: `Generate the classes of the package using the following as a` +
                ` template: ${modelFormat}. Do not include classes already in the package. Output should be in an array of json objects. Only return the json.`
        });
        let models = await _askAIForCode(messages);
        try {
            models = JSON.parse(response);
            // Iterate over the list of use cases and save them.
            for (let i in models) {
                let model = models[i];
                model.package = package.name;
                model.prefix = package.prefix;
                model.dir = path.resolve(`${package.dir}/models/${model.name.replace(/\s/g, '')}`);
                AClass.save({definition: model});
            }
            return models;
        } catch (e) {
            console.error("Error parsing JSON:", response, e);
        }
    },
    generateHandlers: async (pkgName) => {
        let messages = [];
        let package = _getPackage(pkgName);
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
            role: 'system', content: "For context. an event handler handles events that are produced by" +
                " the system. The goal of the event handlers is to provide a way that a package can easily handle" +
                " events and cause corrective action or additional actions required by the system."
        });

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user',
            content: `Using and Event driven architecture paradigm. Generate a list of events and event handlers that should be handled by this package. In the description give potential actions that could be taken for each event.`
        });
        let response = await _askAI(messages);


        // Load the list of events
        let messages2 = [];
        let content = "";
        for (let i in global.events) {
            let event = global.events[i];
            content += `${event.name}: ${event.description},`
        }
        messages2.push({
            role: 'system', content: "Use the following Events are the system events for analysis of the" +
                " user prompt:" + content
        });

        messages2.push({
            role: 'user', content: "For each event in the following find the corresponding systme event" +
                " and use it to create a simple json map { 'event': 'Event Name', systemEvent: 'System" +
                " Event Name', description:' Description' }" +
                " Create an array of json objects.:" + response
        });
        let events = await _askAIForCode(messages2);
        try {
            // Iterate over the list of use cases and save them.
            for (let i in events) {
                let idir = path.resolve(package.definition.dir + '/handlers/');
                let handler = events[i];
                // No handlers yet.
                if (!package.definition.handlers) {
                    package.definition.handlers = {};
                }
                // Check if there is already a handler
                let newHandler = null;
                if (!package.definition.handlers[handler.systemEvent]) {
                    newHandler = {
                        name: handler.systemEvent,
                        handlers: []
                    };
                } else {
                    newHandler = package.definition.handlers[handler.systemEvent];
                }
                newHandler.handlers.push({
                    description: handler.description, fn: (data) => {
                        return data;
                    }
                });
                AHandler.save(newHandler, package);
            }
            return package;
        } catch (e) {
            console.error("Error parsing Creating Interfaces:", e);
        }
    },
    generateInterfaces: async (pkgName) => {
        let messages = [];
        let package = _getPackage(pkgName);
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

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user', content: `Generate the interfaces of the package using the following as a` +
                ` template: ${interfaceFormat}. Interfaces are methods that are exposed as RESTful` +
                `interfaces to the package. The name should start with a lowercase and follow Camel case. compound names, like createApplication,  should have follow the object/methodName format, like application/create. They should be action words. Output should be in an` +
                `array of json objects. Only return the json.`
        });
        let interfaces = await _askAIForCode(messages);
        try {
            // Iterate over the list of use cases and save them.
            for (let i in interfaces) {
                let newMethod = interfaces[i];
                newMethod.inputs = newMethod.parameters;
                newMethod.friendlyName = newMethod.name;
                _addInterface(package, newMethod);
            }
            return package;
        } catch (e) {
            console.error("Error parsing Creating Interfaces:", e);
        }
    },
    addInterface: (package, method) => {
        return _addInterface(package,method);
        
    },
    generateWorkflows: async (pkgName) => {
        let messages = [];
        let package = _getPackage(pkgName);
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
            role: 'user',
            content: `Assume the role of a system architect. Identify and Generate potenital workflows of the package using the following as a` +
                ` javascript output template: ${workflowFormat}. Workflows are processes that are used to automate the processes of the system.` +
                ` The steps in the workflow should map to scenarios, usecases or other workflows where possible.` +
                ` The results should be in an json array of json objects following the output template that will be passed to javascript eval function.` +
                ` Any non-code should be commented using javascript comments.`
        });
        let workflows = await _askAIForCode(messages);
        try {
            // Iterate over the list of use cases and save them.
            if (Array.isArray(workflows)) {
                for (let i in workflows) {
                    let workflow = workflows[i];
                    AWorkflow.save(workflow, `${package.dir}/workflows`);
                }
            } else {
                AWorkflow.save(workflows, `${package.dir}/workflows`);
            }
            return package;
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    },
    generateUseCases:
        async (pkgName) => {
            let messages = [];
            let package = _getPackage(pkgName);
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

            // Now ask to show the changes to the documentation based on all of the information.
            messages.push({
                role: 'user', content: `Generate the usecases of the package using the following as a` +
                    ` template: ${usecaseFormat}. Output should be in an array of json objects. Only return the json.`
            });
            let usecases = await _askAIForCode(messages);
            for (let i in usecases) {
                let usecase = usecases[i];
                usecase.package = package.name;
                usecase.prefix = package.prefix;
                usecase.dir = path.resolve(`${package.dir}/usecases/${usecase.name.replace(/\s/g, '')}`);
                AUseCase.save(usecase);
            }
            return package;
        },
    generateDescription: async (pkgName) => {
            let messages = [];
            let package = _getPackage(pkgName);
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

            // Now ask to show the changes to the documentation based on all of the information.
            messages.push({
                role: 'user', content: "Generate a concise description of the package based on the classes and" +
                    " package definitions and documentation. It should not be more than one sentence long."
            });
            let response = await _askAI(messages);
            package.definition.description = response;
            _save(package);
            return response;
        },
};

function _getDocumentation(pkg) {
    let retval = "";
    if (pkg.doc) {
        let bdir = pkg.doc.basedir;
        for (let i in pkg.doc.files) {
            let dfile = path.resolve(`${bdir}/${pkg.doc.files[i]}`);
            let extName = path.extname(dfile);
            if (extName === '.puml' || extName === '.emd' || extName === '.md') {
                retval += fs.readFileSync(dfile, 'utf-8');
            }
        }
    }
    return retval;
}

async function _askAIForCode(messages) {
    let response = await _askAI(messages);
    let valid = false;
    let retval = null;
    while (!valid) {
        try {
            if (response.includes('```')) {
                let strip = response.match(/```[a-zA-Z]*([\s\S]*?)```/i);
                response = strip[1];
                response = response.trimStart();
            }
            if (response[0] !== '[') {
                response = '[' + response + ']';
            }
            retval = eval('(' + response + ')');
            if (typeof retval === 'string') {
                retval = eval('(' + retval + ')');
            }
            valid = true;
        } catch (e) {
            console.warn("Fixing the response:", response);
            let nMessages = [
                {
                    role: 'system', content: "Make sure the response can be evaluated as javascript that can be" +
                        " evalutated with the eval( '(' + response + ')') function. The results of the eval call" +
                        "  should return an array of javascript objects."
                },
                {
                    role: 'user',
                    content: `${response}`
                }];
            response = await _askAI(nMessages);
        }
    }
    return retval;
}

async function _askAI(messages) {
    const completion = await global.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages
    });
    return completion.choices[0].message.content;
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

function _save(pkg) {

    let cfile = path.resolve(`${pkg.definition.dir}/index.js`);
    let depends = [];
    for (let i in pkg.depends) {
        depends.push(pkg.depends[i].name);
    }
    let description = pkg.description.replace(/'/g, '"');
    let output = `
module.exports = {
    "shortname": '${pkg.shortname}',
    "name": '${pkg.name}',
    'description': '${description}',
    'color': '${pkg.color}',
    `;
    if (depends.length > 0) {
        output += `
    'depends': [ "${depends.join('",\n        "')}" ],`;
    }
    output += `
};`;
    fs.writeFileSync(cfile, output);
    console.log("Saving Package to file ", cfile);
    return true;
}
function _addInterface(package,method) {
    method.static = true;
    if (!method.exits) {
        method.exits = {
            json: (obj) => {
                return obj;
            },
            success: (obj) => {
                return obj;
            },
            notFound: (obj) => {
                console.error("Object not Found:", obj);
                return null;
            }
        };
    }
    if (!method.fn) {
        method.fn = function (inputs, env) {
            return;
        }
    }
    let idir = path.resolve(package.definition.dir + '/interface/');
    AMethod.save(method, {definition: {dir: idir}});
    if (!package.definition.interface) {
        package.definition.interface = {};
    }
    let apath = `${package.prefix}/${method.name}`;
    package.definition.interface[apath] = method;
    global.actions[apath] = method;
    global.actions[apath].pkg = pkg;
    global.actions[apath].obj = pkg.name;
    return method;
}
