const path = require('path');
const {execSync} = require('child_process');
module.exports = {
    friendlyName: 'thirdparty',
    description: 'Get thridparty components',
    static: true,
    inputs: {
        name: {
            description: 'The name of the component',
            type: 'string',
            required: false
        }
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {
        if(!global.ailtire.implementation) {
            global.ailtire.implementation = {}
        }
        if(!global.ailtire.implementation.libraries) {
            let results = execSync("npm list --all --json").toString();
            let retval = JSON.parse(results);
            global.ailtire.implementation.libraries = retval;
            global.ailtire.implementation.components = { };
            global.ailtire.implementation.components[retval.name] = retval;
            _iterateLibraries(retval.dependencies);
        }
        if(inputs.name) {
            if(global.ailtire.implementation.components.hasOwnProperty(inputs.name)) {
                env.res.json(global.ailtire.implementation.components[inputs.name]);
            }
        } else {
            env.res.json(global.ailtire.implementation.libraries);
        }
    }
};

function _iterateLibraries(items) {
    for(let name in items) {
        global.ailtire.implementation.components[name] = items[name];
        global.ailtire.implementation.components[name].name = name;
        if(items[name].dependencies) {
            _iterateLibraries(items[name].dependencies);
        }
    }
}

