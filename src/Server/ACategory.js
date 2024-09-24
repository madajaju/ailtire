const AEvent = require('../../src/Server/AEvent');
const AActivity = require('../../src/Server/AActivity');
const AService = require('../../src/Server/AService');
const AIHelper = require('../../src/Server/AIHelper');
const fs = require('fs');
const path = require('path');
const AWorkflow = require("./AWorkflow");

const workflowFormat = `
{
    name: 'Workflow Name',
    description: 'Description of the Workflow',
    precondition: 'precondition of the workflow',
    postcondition: 'postcondition of the workflow',
    category: 'level1/level2/...', // This shows the category of the workflow groupings by levels with / separating the groupings.
    activities: { }, // Activities will be described at a later time.
}`;

module.exports = {
    workflows: () => {
        return _workflowInstances;
    },
    show: (workflow) => {
        return _workflowInstances[workflow.name];
    },
    save: (workflow, category, package) => {
        _save(workflow, category, package);
    },
    get: (cname) => {
        return _get(cname);
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
            _save(workflow, category, package);
        }
        return workflows;

    },
    generateDescription: async (wname) => {
        const APackage = require('../../src/Server/APackage');
        let messages = [];
        let category = _get(wname);
        let package = category.package || global.topPackage;
        
        // Get the current usecases, class definitions, and workflows
        // Put them into a string and put them as system information.
        // Get the current documentation. Add it as system information.
        let docString = _getDocumentation(package);
        messages.push({role: 'system', content: "Use the following as the package documentation: " + docString});

        let docString2 = _getDocumentation(category);
        messages.push({role: 'system', content: "Use the following as the category documentation: " + docString2});
        
        let content = JSON.stringify(category);
        messages.push({
            role: 'system',
            content: `Use the following as the category definition for the user promot: ${content}`
        })

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user', content: "Generate a one sentence summary description of the category of workflows based the" +
                " category, subcategories and workflows.  format returned should be json in the following format" +
                " {description:'discriptionText' }"
        });
        let response = await AIHelper.askForCode(messages);
        category.description = response[0].description;
        _save(category, package);
        return category;
    },
    generateWorkFlows: async (wname) => {
        const APackage = require('../../src/Server/APackage');
        const AWorkflow = require('../../src/Server/AWorkflow');
        let messages = [];
        let category = _get(wname);
        let package = category.package || global.topPackage;
        // Get the current usecases, class definitions, and workflows
        // Put them into a string and put them as system information.
        let items = ["subcategories", "workflows"];
        for (i in items) {
            let content = `Use the following ${items[i]} for analysis of the user prompt:`;
            for (let name in category[items[i]]) {
                let obj = category[items[i]][name];
                content += JSON.stringify(obj);
                // content += `{ name:${obj.name}, description:${obj.description} }\n`;
            }
            messages.push({role: 'system', content: content});
        }
        // Get the current documentation. Add it as system information.
        messages.push({role: 'system', content: "Use the following as the package description: " + package.description});

        let docString = _getDocumentation(category);
        messages.push({role: 'system', content: "Use the following as the workflow category documentation: " + docString});
        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user',
            content: `Assume the role of a system architect. Identify and Generate potenital workflows of the category using the following as a` +
                ` javascript output template: ${workflowFormat}. Workflows are processes that are used to automate the processes of the system.` +
                ` The steps in the workflow should map to scenarios, usecases or other workflows where possible.` +
                ` The results should be in an json array of json objects following the output template that will be passed to javascript eval function.` +
                ` Any non-code should be commented using javascript comments.`
        });
        let workflows = await AIHelper.askForCode(messages);
        try {
            // Iterate over the list of use cases and save them.
            if (Array.isArray(workflows)) {
                for (let i in workflows) {
                    let workflow = workflows[i];
                    workflow.category = workflow.category || category.prefix;
                    AWorkflow.save(workflow, package);
                    AEvent.emit('workflow.created', {obj:workflow});
                }
            } else {
                workflow.category = workflow.category || category.prefix;
                AWorkflow.save(workflows, package);
                AEvent.emit('workflow.created', {obj:workflow});
            }
            return {category: category, changes: workflows};
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    },
    generateDocumentation: async (cname) => {
        let messages = [];
        let category = _get(cname);
        let content = JSON.stringify(category);
        messages.push({
            role: 'system',
            content: `Use the following as the category definition for the user promot: ${content}`
        });
        let items = ["subcategories", "workflows"];
        for (i in items) {
            let content = `Use the following ${items[i]} for analysis of the user prompt:`;
            for (let name in category[items[i]]) {
                let obj = category[items[i]][name];
                // content += JSON.stringify(obj);
                content += `{ name:${obj.name}, description:${obj.description} }\n`;
            }
            messages.push({role: 'system', content: content});
        }
        // Get the current documentation. Add it as system information.
        let docString = _getDocumentation(category);
        messages.push({role: 'system', content: "Use the following as the category documentation: " + docString});

        // Now ask to show the changes to the documentation based on all of the information.
        messages.push({
            role: 'user', content: 'Elaborate the category documentation based on the workflows and' +
                ' subcategories from the system.'
        });
        let response = await AIHelper.ask(messages);
        let cfile = path.resolve(`${category.baseDir}/doc/doc.emd`);
        fs.writeFileSync(cfile, response);
        return response;
    },
}

function _save(category,package) {
    let dir = package.definition.dir + '/workflows';
    dir += `/${category.prefix}`;
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive:true});
    }
    let wname = category.name.replace(/\s/g,'');
    let cfile = path.resolve(`${dir}/index.js`);
    let tempObj = {};
    for(let key in category) {
        if(key === 'workflows') {
        } else if(key === 'subcategories') {
        } else {
            tempObj[key] = category[key];
        }
    }
    let output = `module.exports = ${JSON.stringify(tempObj)};`;

    if(!fs.existsSync(dir)) {
       fs.mkdirSync(dir, {recursive: true});
    }
    fs.writeFileSync(cfile, output);
    if(!package.definition.workflows) {
        package.definition.workflows = {};
    }
    global.categories[wname] = category;
    return true;
}

function _get(name) {
    name = name.split('/').pop();
    if(global.categories[name]) {
        return global.categories[name];
    }
    let nname = name.replace(/\s/g,'');
    if(global.categories[nname]) {
        return global.categories[nname];
    }
    for(let tname in global.categories) {
        if(name === global.categories[tname].name) {
            return global.categories[tname];
        }
        if(nname === global.categories[tname].name) {
            return global.categories[tname];
        }
    }
    
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

function _getDocumentation(pkg) {
    let retval = "";
    if (pkg) {
        let bdir = pkg.baseDir || pkg.dir;
        bdir += '/doc';
        bdir = bdir.replace(/\s/g, '');
        let files = fs.readdirSync(bdir);
        for (let i in files) {
            let dfile = path.resolve(`${bdir}/${files[i]}`);
            let extName = path.extname(dfile);
            if (extName === '.puml' || extName === '.emd' || extName === '.md') {
                retval += fs.readFileSync(dfile, 'utf-8');
            }
        }
    }
    return retval;
}