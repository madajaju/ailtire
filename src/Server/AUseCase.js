const AEvent = require("ailtire/src/Server/AEvent");
const AIHelper = require("ailtire/src/Server/AIHelper");
const AScenario = require("ailtire/src/Server/AScenario");
const path = require("path");
const fs = require("fs");

module.exports = {
    getUseCase: (name) => {
        return _getUseCase(name);
    },
    save: (usecase) => {
        return _save(usecase);
    },
    generateDocumentation: async (uname) => {
        let usecase = _getUseCase(uname);
        let json = JSON.stringify(usecase);
        let classDoc = _getDocumentation(usecase);
        let package = usecase.package;
        let pkgDoc = JSON.stringify(package);
        let messages = [];
        messages.push({role: 'system', content: `Use the following usecase for analysis of the user prompt: ${json}`});
        messages.push({ role: 'system', content: `Use the following as usecase documentation for analysis of the user prompt: ${classDoc}`});
        messages.push({ role: 'system', content: `Use the following as package documentation for analysis of the user prompt: ${pkgDoc}`});
        messages.push({
            role: 'user', content: "Generate summary documentation of the usecase based on the usecase and" +
                " package definitions and documentation. It does not need to include the details of the scenarios." +
                " But it should give and overview of the usecase, its purpose, its" +
                " interactions with actors in the architecture. Output in the md fomat."
        });
        let response = await AIHelper.ask(messages);
        let cfile = `${usecase.doc.basedir}/doc.emd`;
        fs.writeFileSync(cfile, response);
        return response;
    },
    generateDescription: async (uname) => {
        let usecase = _getUseCase(uname);
        let json = JSON.stringify(usecase);
        let package = usecase.package;
        let pjson = JSON.stringify(package);
        let messages = [];
        messages.push({role: 'system', content: `Use the following usecase for analysis of the user prompt: ${json}`});
        messages.push({role: 'system', content: `Use the following package for analysis of the user prompt: ${pjson}`});
        messages.push({
            role: 'user', content: "Generate a concise description of the usecase based on the usecase and" +
                " package definitions and documentation. It should not be more than one sentence long."
        });
        let response = await AIHelper.ask(messages);
        console.log(response);
        usecase.description = response;
        _save(usecase);
        return response;
    },
    generateScenarios: async (uname) => {
        let usecase = _getUseCase(uname);
        let json = JSON.stringify(usecase);
        let package = usecase.package;
        let pjson = JSON.stringify(package);
        let messages = [];
        messages.push({role: 'system', content: `Use the following usecase for analysis of the user prompt: ${json}`});
        messages.push({role: 'system', content: `Use the following package for analysis of the user prompt: ${pjson}`});
        messages.push({
            role: 'user', content: "Based on the information generate any new scenarios for the usecase. For" +
                " each current scenario elaborate on the description, given, when and then statements." +
                " Limit each given,when and then statement to less than 80 characters. The results should be in" +
                " json format: { name: 'scenarioName', description: 'decritpion Text', given: 'given text'," +
                " when: 'when text', then: 'then text', actors: {'actorName': 'actorAction'}}." +
                " The results should be an array of these objects."
        });
        let scenarios = await AIHelper.askForCode(messages);
        for(let i in scenarios) {
            let sname = scenarios[i].name.replace(/\s/g,'');
            let scenario = scenarios[i];
            if(usecase.scenarios[sname]) {
                let oscenario = usecase.scenarios[sname];
                oscenario.description = scenario.description;
                oscenario.given = scenario.given;
                oscenario.when = scenario.when;
                oscenario.then = scenario.then;
                oscenario.actors = scenario.actors;
                AScenario.save(usecase,oscenario);
            } else {
                AScenario.save(usecase,scenario);
            }
        }
        return usecase;
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
