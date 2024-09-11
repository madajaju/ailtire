const AEvent = require('../../src/Server/AEvent');
const Action = require('../../src/Server/Action');
const AService = require('../../src/Server/AService');
const path = require('path');
const fs = require('fs');

let _scenarioInstances = {};
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
}`;

module.exports = {
    create: (usecase, scenario) => {
        const AUseCase = require('../../src/Server/AUseCase');
        const AEvent = require('../../src/Server/AEvent');
        // Check to see if the scenario alread exists.
        let ucObject = AUseCase.get(usecase);
        let snamenospace = scenario.name.replaceAll(/\s/g, '');
        if (ucObject.scenarios.hasOwnProperty(snamenospace)) {
            let scenarioObject = ucObject.scenarios[sname];
            for (aname in scenario) {
                scenarioObject[aname] = scenario[aname];
            }
            _save(ucObject, scenarioObject);
            AEvent.emit('scenario.updated', scenarioObject);
            return ucObject;
        } else {
            let retval = _save(ucObject, scenario);
            AEvent.emit('scenario.created', scenario);
            return retval;
        }
    },
    save: (usecase, scenario) => {
        return _save(usecase, scenario);
    },
    instances: () => {
        return _scenarioInstances;
    },
    toJSON: (scenario) => {
        return _toJSON(scenario);
    },
    generateGivenWhenThen: async (usecase, scenario) => {
        let json = JSON.stringify(scenario);
        // Generate Given, When, Then
        let response = await _askAI(json);
        let resObj = JSON.parse(response);
        if (typeof resObj === 'Array') {
            resObj = resObj[0];
        }
        scenario.given = resObj.given;
        scenario.when = resObj.when;
        scenario.then = resObj.then;
        // Update the scenario
        _save(usecase, scenario);
    },
    generateGWT: async (scenario) => {
        let messages = [];
        let usecase = null;
        if (typeof scenario === 'string') {
            [usecase, scenario] = _find(scenario);
        }

        messages.push({
            role: 'system',
            content: 'Using the Given,When,Then scenario paradigm createa given, when, then statement for the' +
                ' following scenario description. Limit each given,when and then statement to less than 80' +
                ' characters. There should be one response. The results should be in json format, with the' +
                ' given, when and then at the top level of the json. json keys should be in all lowercase.'
        });
        let json = JSON.stringify(scenario);
        // Generate Given, When, Then
        messages.push({role: 'user', content: json});
        let resObj = await _askAIForCode(messages);
        scenario.given = resObj[0].given;
        scenario.when = resObj[0].when;
        scenario.then = resObj[0].then;
        // Update the scenario
        _save(usecase, scenario);
        return scenario;
    },
    generateSteps: async (name) => {
        const APackage = require('../../src/Server/APackage');

        let messages = [];
        let [usecase, scenario] = _find(name);
        let package = APackage.getPackage(usecase.package);
        let content = `Use the following interface for analysis of the user prompt:`;
        for (let name in package.interface) {
            let obj = package.interface[name];
            content += `{name: "${name}", inputs: ${JSON.stringify(obj.inputs)}, description: "${obj.description}" }`;
            // content += `{ name:${obj.name}, description:${obj.description} }\n`;
        }
        messages.push({role: 'system', content: content});
        content = `Use the following are the class methods for analysis of the user prompt:`;
        for (let cname in package.classes) {
            let cls = package.classes[cname];
            for (let mname in cls.definition.methods) {
                let obj = cls.definition.methods[mname];
                content += `{name: "${name}", inputs: ${JSON.stringify(obj.inputs)}, description: "${obj.description}" }`;
            }
        }
        messages.push({role: 'system', content: content});
        // Put them into a string and put them as system information.
        content = `Use the following scenario for analysis of the user prompt:`;
        content += JSON.stringify(scenario);
        messages.push({role: 'system', content: content});
        // Get the current documentation. Add it as system information.
        messages.push({
            role: 'user', content: "Generate a set of steps using the interface and or class methods to articulate" +
                " the scenario definition. If an interface does not exists create a new one following the same" +
                " naming convention as the other ones. Each step should follow the following json format:" +
                " {action:'actionName'," +
                " parameters:{arg1:value1, arg2:value2, ...}, descrition:'descrition'}. The output should ne an" +
                " array of steps in json."
        });
        let response = await _askAIForCode(messages);
        scenario.steps = response;
        _save(usecase, scenario);
        // Now iterate over the steps and check that the actions are real.
        // If they are not. Then create an interface in the package for them.
        const Action = require('../../src/Server/Action');
        for (let i in scenario.steps) {
            let step = scenario.steps[i];
            let action = Action.find(step.action);
            if (!action && !step.action.includes('.')) {
                // Now generate a new interface with documentation.
                let newMessages = [{
                    role: 'system',
                    content: `Given the current description of this step '${JSON.stringify(step)}' and the context of the scenario '${JSON.stringify(scenario)}' answer the user prompt with json code following the template: ${interfaceFormat}`
                },
                    {role: 'user', content: 'Generate an interface.'}
                ]
                let newMethod = await _askAIForCode(newMessages);
                // AskAIForCode always returns an array;
                newMethod = newMethod[0];

                newMethod.friendlyName = step.action.replace(`${package.prefix}/`, '');
                newMethod.name = step.action;
                APackage.addInterface(package, newMethod);
            }
        }
        return _toJSON(scenario);
    },
    generateDescription: async (name) => {
        let messages = [];
        let [usecase, scenario] = _find(name);
        // Get the current usecases, class definitions, and workflows
        // Put them into a string and put them as system information.
        let content = `Use the following usecase for analysis of the user prompt:`;
        content += JSON.stringify(scenario);
        messages.push({role: 'system', content: content});
        // Get the current documentation. Add it as system information.
        messages.push({
            role: 'user', content: "Generate a concise description of the scenario based on the usecase and" +
                " scenario definitions and documentation. It should not be more than one sentence long."
        });
        let response = await _askAI(messages);
        scenario.description = response;
        _save(usecase, scenario);
        return response;
    },
    find: (scenario) => {
        return _find(scenario);
    },
    get: (scenario) => {
        return _find(scenario);
    }
}


function _find(scenario) {
    // THis should be an id. usecasename.scenarioname
    let [uname, sname] = scenario.split('.');
    let retval = global.usecases[uname].scenarios[sname];
    return [global.usecases[uname], retval];
}

function _toJSON(scenario) {
    let retscenario = {
        name: scenario.name,
        description: scenario.description,
        actors: scenario.actors,
        given: scenario.given,
        when: scenario.when,
        then: scenario.then
    };
    retscenario.inputs = scenario.inputs;
    retscenario.id = scenario.uid;
    let steps = [];
    const Action = require('../../src/Server/Action');
    for (let i in scenario.steps) {
        let step = scenario.steps[i];
        let rstep = {parameters: step.parameters};
        if (step.action) {
            let retaction = {name: step.action};
            let action = Action.find(step.action);
            if (action) {
                retaction = {
                    name: step.action,
                    cls: action.cls,
                    pkg: {shortname: action.pkg.shortname, name: action.pkg.name, color: action.pkg.color},
                    obj: {obj: action.pkg.obj}
                };
            }
            rstep.action = retaction;
            rstep.description = step.description;
        }
        steps.push(rstep);
    }
    retscenario.steps = steps;
    let instances = _scenarioInstances[scenario.id];
    retscenario._instances = instances;
    return retscenario;
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
                        "  should return an array of javascript objects. Do not put the respons in a string. Just" +
                        " the raw javascript code."
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

function _save(usecase, scenario) {
    let jsonScenario = _toJSON(scenario);
    let outputString = `module.exports = ${JSON.stringify(scenario)};`;
    let filename = path.resolve(`${usecase.dir}/${scenario.name.replace(/\s/g, '')}.js`);
    try {
        fs.writeFileSync(filename, outputString);
    } catch (e) {
        console.error("Error writing Scenario File:", filename);
    }
    usecase.scenarios[scenario.name.replace(/\s/g, '')] = scenario;
    return scenario;
};
