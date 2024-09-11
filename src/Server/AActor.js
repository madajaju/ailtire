const AEvent = require("ailtire/src/Server/AEvent");
const APackage = require("ailtire/src/Server/APackage");
const AMethod = require("ailtire/src/Server/AMethod");
const path = require("path");
const fs = require("fs");
const api = require('../Documentation/api.js');

const isDirectory = source => fs.existsSync(source) && fs.lstatSync(source).isDirectory();
const isFile = source => fs.existsSync(source) && !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    save: (cls) => {
        return _save(cls);
    },
    create: (actor) => {
        // Check to see if actor already exists.
        let actorObject = _getActor(actor.name);
        // If the actor exists then update it with the input.
        if (actorObject) {
            for (let cname in actor) {
                actorObject[cname] = actor[cname]
            }
            _save(actorObject);
            AEvent.emit('actor.updated', actor);
        } else {
            if (!actor.dir) {
                actor.dir = `./actors/${actor.name.replace(/\s/g, '')}`;
            }
            _save(actor);
            AEvent.emit('actor.created', actor);
        }
        // Now load this in the global memory space.
        _load(actor.dir);
        return actor;
    },
    load: (actor) => {
        _load(actor);
    },
    loadAll: (dir) => {
        let actors = getDirectories(dir);
        // Initialize the global actors.
        if (!global.hasOwnProperty('actors')) {
            global.actors = {};
        }
        for (let i in actors) {
            let actorDir = actors[i];
            if (!actorDir.includes('\\doc') && !actorDir.includes('\/doc')) {
                _load(actorDir);
            }
        }
    },
    get: (name) => {
        return _getActor(name);
    },
    generateDocumentation: async (name) => {
        let actor = _getActor(name);
        let json = `{name: ${actor.name}, shortname: ${actor.shortname}, description: ${actor.description}`;
        let doc = _getDocumentation(actor);

        let messages = [];
        messages.push({
            role: 'system',
            content: `Act as a use case system analyst. Use the following actor for analysis of the user prompt: ${json}`
        });
        messages.push({
            role: 'system',
            content: `Use the following as actor documentation for analysis of the user prompt: ${doc}`
        });
        // messages.push({ role: 'system', content: `Use the following as system documentation for analysis of the
        // user prompt: ${systemDoc}`});
        let items = ["usecases", "scenarios"];
        for (i in items) {
            let content = `Use the following ${items[i]} for analysis of the user prompt:`;
            for (let name in actor[items[i]]) {
                let obj = actor[items[i]][name];
                content += `{name: ${obj.name}, description: "${obj.description}"},`;
                // content += `{ name:${obj.name}, description:${obj.description} }\n`;
            }
            messages.push({role: 'system', content: content});
        }
        messages.push({
            role: 'user', content: "Generate summary documentation of the actor based on the actor and" +
                " usecase definitions and documentation. It should give and overview of the actor, its purpose, its" +
                " interactions with workflows and use cases in the architecture. Output in the md" +
                " fomat. Do not include file information or location. Elaborate the description and responsibilities" +
                " of the actor."
        });
        let response = await _askAI(messages);
        let cfile = `${actor.doc.basedir}/doc.emd`;
        fs.writeFileSync(cfile, response);
        return response;
    },
    generateDescription: async (name) => {
        let actor = _getActor(name);
        let json = `{name: ${actor.name}, shortname: ${actor.shortname}, description: ${actor.description}`;
        let doc = _getDocumentation(actor);

        let messages = [];
        messages.push({role: 'system', content: `Use the following actor for analysis of the user prompt: ${json}`});
        messages.push({
            role: 'system',
            content: `Use the following as actor documentation for analysis of the user prompt: ${doc}`
        });
        // messages.push({ role: 'system', content: `Use the following as system documentation for analysis of the
        // user prompt: ${systemDoc}`});
        let items = ["usecases", "scenarios"];
        for (i in items) {
            let content = `Use the following ${items[i]} for analysis of the user prompt:`;
            for (let name in actor[items[i]]) {
                let obj = actor[items[i]][name];
                content += `{name: ${obj.name}, description: "${obj.description}"},`;
                // content += `{ name:${obj.name}, description:${obj.description} }\n`;
            }
            messages.push({role: 'system', content: content});
        }
        messages.push({
            role: 'user', content: "Generate a concise description of the actor based on the actor and" +
                " usecase and scenario definitions and documentation. It should not be more than one sentence long." +
                " Do not include the file location or information."
        });
        let response = await _askAI(messages);
        console.log(response);
        actor.description = response;
        _save(actor);
        return response;
    },
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
            }
            workflows = eval('(' + response + ')');
            valid = true;
        } catch (e) {
            console.warn("Fixing the response:", response);
            let nMessages = [{
                role: 'system', content: "Make sure the code can be evaluated as javascript that can be" +
                    " evalutated with the eval function and will evaluate to an array of javascript objects."
            }, {
                role: 'user',
                content: `Given this string ${response} return a string  to be evaluated with javascript eval function.`
            }]
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

function _save(actor) {
    api.actor(actor, './actors');
    return true;
}

function _getActor(name) {
    let retval = null;
    retval = global.actors[name];
    if (retval) {
        return retval;
    }
    for (let i in global.actors) {
        let actor = global.actors[i];
        if (actor.name === name || actor.shortname === name) {
            return actor;
        }
    }
    return null;
}

function _load(dir) {
    let fname = path.resolve(dir + '/index.js');
    let actor = require(fname);
    global.actors[actor.name.replace(/\s/g, '')] = actor;
    actor.dir = dir;
    _loadDocs(actor, dir + '/doc');
}

const _loadDocs = (item, dir) => {
    if (fs.existsSync(dir)) {
        let files = getFiles(dir);
        let nfiles = [];
        let ndir = dir;
        ndir = ndir.replace(/[\/\\]/g, '/');
        for (let i in files) {
            let file = files[i];
            let nfile = file.replace(/[\/\\]/g, '/');
            nfiles.push(nfile.replace(ndir, ''));
        }
        item.doc = {basedir: dir, files: nfiles};
    } else {
        fs.mkdirSync(dir);
        item.doc = {basedir: dir, files: []};
    }
}