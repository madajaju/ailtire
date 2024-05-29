const AEvent = require("ailtire/src/Server/AEvent");
const APackage = require("ailtire/src/Server/APackage");
const AMethod = require("ailtire/src/Server/AMethod");
const AIHelper = require("ailtire/src/Server/AIHelper");
const path = require("path");
const fs = require("fs");

const associationFormat = `
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
`;

const statenetFormat = `
statenet: {
    Init: {
        description: "Initial State"
        events: {
            create: {
                StateName: { }
            }
        }
    },
    StateName: {
        description: "My Description of the state",
        color: "#aaaaaa",
        events: { // Events that can be handled while in this state.
            eventName: {
                StateName: {
                    // Condition checked after the eventName method is called.
                    condition: {
                        description: "...",
                        action: 'methodname',
                    },
                    action: {
                        description: "...",
                        action: 'methodname',
                    }
                }
            },
            eventName2 ...
        }
        actions: { // Actions to be performed on the entry and exit of this state.
            entry: { // These actions happen when the state is entered and before any action inside the state.
                     // Including the event action if there is any.
                entry1: {
                    description: "...",
                    action: 'methodname'
                 },
            exit: { // These actions happen when the state is being left. After all other actions.
                exit1:
                    description: "..."
                    action: 'methodname'
                }
                ...
            }
        }
    }
    
    StateName2: {...},
    StateName3: {...},
    ...
`;
module.exports = {
    getClass: (className) => {
        return _getClass(className);
    },
    getInstances: (className) => {
        let cls = _getClass(className);
        return _getInstances(cls);
    },
    save: (cls) => {
        return _save(cls);
    },
    generateAssociations: async (className) => {
        let cls = _getClass(className);
        let json = JSON.stringify(cls);
        let messages = [];
        messages.push({role: 'system', content: `Use the following class for analysis of the user prompt: ${json}`});
        messages.push({
            role: 'system',
            content: `Use the following association definition for the generation of any associations: ${associationFormat}`
        });
        messages.push({
            role: 'user', content: "Generate a associations for the class. Create JSON structure for the" +
                " statenet following the Association Format. Only return the json."
        });
        let associations = await AIHelper.askForCode(messages);
        cls.definition.associations = associations;
        _save(cls);
        return cls;
    },
    generateStateNet: async (className) => {
        let cls = _getClass(className);
        let json = JSON.stringify(cls);
        let messages = [];
        messages.push({role: 'system', content: `Use the following class for analysis of the user prompt: ${json}`});
        messages.push({
            role: 'system',
            content: `Use the following state net definition for the generation of any statenets: ${statenetFormat}`
        });
        messages.push({
            role: 'user', content: "Generate a state net for the class. Create JSON structure for the" +
                " statenet following the StateNet Format. Include condidtional statements and potential actions to" +
                " be performed. All of the events should map to methods of the class. If there are missing methods" +
                " denote them. All conditions should be limited to 20 characters. Include a description field for" +
                " each State.Only return the json."
        });
        let statenet = await AIHelper.askForCode(messages);
        if(statenet[0].statenet) {
            statenet = statenet[0].statenet;
        }
        cls.definition.statenet = statenet;
        _save(cls);
        return cls;
    },
    generateDocumentation: async (className) => {
        let cls = _getClass(className);
        let json = JSON.stringify(cls);
        let classDoc = _getDocumentation(cls);
        let package = cls.definition.package;
        let pkgDoc = APackage.getDocumentation(package);
        let messages = [];
        messages.push({role: 'system', content: `Use the following class for analysis of the user prompt: ${json}`});
        messages.push({ role: 'system', content: `Use the following as classs documentation for analysis of the user prompt: ${classDoc}`});
        messages.push({ role: 'system', content: `Use the following as package documentation for analysis of the user prompt: ${pkgDoc}`});
        messages.push({
            role: 'user', content: "Generate summary documentation of the class based on the class and" +
                " package definitions and documentation. It does not need to include the details of the attributes," +
                " associations, methods or statenet. But it should give and overview of the class, its purpose, its" +
                " interactions with other classes or subsystems in the architect. Output in the md fomat."
        });
        let response = await AIHelper.ask(messages);
        let cfile = `${cls.doc.basedir}/doc.emd`;
        fs.writeFileSync(cfile, response);
        return response;
    },
    generateDescription: async (className) => {
        let cls = _getClass(className);
        let json = JSON.stringify(cls);
        let package = cls.package;
        let pjson = JSON.stringify(cls.package);
        let messages = [];
        messages.push({role: 'system', content: `Use the following class for analysis of the user prompt: ${json}`});
        messages.push({role: 'system', content: `Use the following package for analysis of the user prompt: ${pjson}`});
        messages.push({
            role: 'user', content: "Generate a concise description of the class based on the class and" +
                " package definitions and documentation. It should not be more than one sentence long."
        });
        let response = await AIHelper.ask(messages);
        console.log(response);
        cls.definition.description = response;
        _save(cls);
        return response;
    },
    generateAttributes: async (className) => {
        let cls = _getClass(className);
        let json = JSON.stringify(cls);
        let package = cls.package;
        let pjson = JSON.stringify(cls.package);
        let messages = [];
        messages.push({role: 'system', content: `Use the following class for analysis of the user prompt: ${json}`});
        messages.push({role: 'system', content: `Use the following package for analysis of the user prompt: ${pjson}`});
        messages.push({
            role: 'user', content: "Based on the information generate any new attributes for the model. For" +
                " each current attribute elaborate on the description but limit them to 80 characters. The" +
                " results should" +
                " include the name, type," +
                " and description of the attribute in the following json format { name: { type: 'string'," +
                " description: 'description'}, name2 ... }; If there are no new attributes or" +
                " changes to current attributes " +
                " return an empty map. Otherwise return a map with the attributes."
        });
        let attributes = await AIHelper.askForCode(messages);
        try {
            for(let aname in attributes) {
                let attribute = attributes[aname] ;
                cls.definition.attributes[aname] =attribute;
            }
        }
        catch(e) {
            // Need to get everything between the ```json and ``` and try again
            console.error("Error Parsing response:", response);
        }
        _save(cls);
        return cls;
    },
    generateMethods: async (className) => {
        let cls = _getClass(className);
        if (cls) {
            let json = JSON.stringify(cls);
            let messages = [];
            messages.push({
                role: 'system',
                content: `Use the following class for analysis of the user prompt: ${json}`
            });
            messages.push({
                role: 'user', content: "Identify any missing methods for the class by looking at the state" +
                    " net, documentation, assoications and attributes. Do not include accessor or update methods for" +
                    " attributes and associations. Elaborate on possible other methods missing from this definition. Give the me" +
                    " the list of methods with possible parameters. The output should be in an array json format" +
                    " which each element in the array following the following format: " +
                    " {name:'methodname'," +
                    " description: 'description', parameters:" +
                    " { parameter1Name: { type: 'parameter1Type', description: 'Parameter1Description'}," +
                    " parameter2Name: ...}. Only provide the json code. Nothing else."
            });
            let newMethods = await AIHelper.askForCode(messages);
            // Check if there is more than the json.
            for(let i in newMethods) {
                let newMethod = newMethods[i];
                newMethod.inputs = newMethod.parameters;
                newMethod.static = false;
                newMethod.friendlyName = newMethod.name;
                newMethod.exits = {
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
                newMethod.fn =  function (obj, inputs, env) { return; }
                AMethod.save(newMethod, cls);
                cls.definition.methods[newMethod.name] = newMethod;
            }
            return cls;
        } else {
            throw new Error("Could not find the Class: " + className);
        }
    }
}

function _getClass(className) {
    if (global.classes.hasOwnProperty(className)) {
        return global.classes[className];
    } else {
        for (let name in global.classes) {
            if (name.toLowerCase() === className.toLowerCase()) {
                return global.classes[name];
            }
        }
    }
    return 0;
}

function _getInstances(cls) {
    let retval = [];
    if (!global._instances) {
        return [];
    }
    if (cls) {
        if (global._instances.hasOwnProperty(cls.definition.name)) {
            retval = global._instances[cls.definition.name];
        }
        for (let i in cls.definition.subClasses) {
            let instances = _getInstances(_getClass(cls.definition.subClasses[i]));
            for (let j in instances) {
                retval[instances[j].id] = instances[j];
            }
        }
        return retval;
    } else {
        return [];
    }
}

function _getDocumentation(cls) {
    let retval = "";
    let bdir = cls.doc.basedir;
    for (let i in cls.doc.files) {
        let dfile = path.resolve(`${bdir}/${cls.doc.files[i]}`);
        let extName = path.extname(dfile);
        if (extName === '.puml' || extName === '.emd' || extName === '.md') {
            retval += fs.readFileSync(dfile, 'utf-8');
        }
    }
    return retval;
}
function _save(cls) {
    let cfile = path.resolve(`${cls.definition.dir}/index.js`);
    let unique = cls.definition.unique;
    let output = `
class ${cls.definition.name} {
    static definition = {
        name: '${cls.definition.name.replace(/'/g,'"')}',
        description: '${cls.definition.description.replace(/'/g,'"')}',
        unique: ${unique || false},
`;
    if(cls.definition.extends) {
        output += `
        extends: '${cls.definition.extends}',
`;
    }
    output += `
        
        attributes: ${JSON.stringify(cls.definition.attributes,null,4)},
        
        associations: ${JSON.stringify(cls.definition.associations,null,4)},
        
        statenet: ${JSON.stringify(cls.definition.statenet,null,4)},
       
` 
    if(cls.definition.view) {
        output += `
        view: {
            color: "${cls.definition.view?.color}",
            object2d: ${cls.definition.view?.object2d},
            object3d: ${cls.definition.view?.object3d},
        }
        `;
    }
    output += `
    }
}
module.exports = ${cls.definition.name};
`
    fs.writeFileSync(cfile, output);
    console.log("Saving Class to file ", cfile);
    return true;
}


