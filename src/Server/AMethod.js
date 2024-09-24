const AEvent = require("./AEvent");
const path = require("path");
const fs = require("fs");


module.exports = {
    save: (action, dir) => {
        _save(action, dir);
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
                    " attributes" +
                    " and associations. Elaborate on possible other methods missing from this definition. Give the me" +
                    " the list of methods with possible" +
                    " parameters. The output should be in a json format as follows: {name:'methodname'," +
                    " description: 'description', parameters:" +
                    " {parameter1Name: parameter1Type, parameter2Name: parameter2Type ...}. Only provide the json "
            });
            let response = await _askAI(messages);
            console.log(response);
            return response;
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

async function _askAI(messages) {
    const completion = await global.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages
    });
    return completion.choices[0].message.content;
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
function _save(method, cls) {
    let cfile = path.resolve(`${cls.definition.dir}/${method.friendlyName}.js`);
    let dir = path.dirname(cfile);
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
    let exits = "{";
    let inputs = "{"
    for (ename in method.exits) {
       exits += `${ename}: ${method.exits[ename]},\n`;
    }
    exits += '},\n'
    for(iname in method.inputs) {
        inputs += `${iname}: ${JSON.stringify(method.inputs[iname],null,4)},\n`;
    }
    inputs += '},\n'
    let output = `
    module.exports = {
    friendlyName: '${method.friendlyName}',
    description: '${method.description}',
    static: ${method.static},
    inputs: ${inputs}

    exits: ${exits} 

    fn: ${method.fn}
};
`
    fs.writeFileSync(cfile, output);
    console.log("Saving Method to file ", cfile);
    return true;
}


