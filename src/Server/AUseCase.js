const AEvent = require("ailtire/src/Server/AEvent");
const APackage = require("ailtire/src/Server/APackage");
const AScenario = require("ailtire/src/Server/AScenario");
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

module.exports = {
    getUseCase: (name) => {
        return _getUseCase(name);
    },
    save: (usecase) => {
        return _save(usecase);
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
        let response = await _askAI(messages);
        console.log(response);
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
        let response = await _askAI(messages);
        console.log(response);
        cls.definition.description = response;
        _save(cls);
        return response;
    },
    generateScenarios: async (className) => {
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
        let response = await _askAI(messages);
        if(response.includes('```json')) {
            let strip = response.match(/```json([\s\S]*?)```/i);
            response = strip[1];
        }
        try {
            let attributes = JSON.parse(response);
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

async function _askAI(messages) {
    const completion = await global.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages
    });
    return completion.choices[0].message.content;
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
            if(response[0] !== '[') {
                response += '[' + response + ']';
            }
            retval = eval('(' + response + ')');
            if(typeof retval === 'string') {
                retval = eval( '(' + retval + ')');
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
function _save(usecase) {
    let dir = path.resolve(`${usecase.dir}`);
    let cfile = path.resolve(`${dir}/index.js`);
    let output = `
module.exports = {
    name: '${usecase.name}',
    description: '${usecase.description}',
    method: '${usecase.method}',
    actors: ${JSON.stringify(usecase.actors)},
    extends: ${JSON.stringify(usecase.extends)},
    includes: ${JSON.stringify(usecase.includes)}
};
`
    if(!fs.existsSync(dir))    {
       fs.mkdirSync(dir, {recursive:true}) ;
    }
    fs.writeFileSync(cfile, output);
    console.log("Saving Class to file ", cfile);
    return true;
}
