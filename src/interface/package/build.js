const path = require('path');
const sLoader = require('../../Server/Loader');
const APackage = require('../../Server/APackage');
const Build = require('../../Services/BuildEngine');

module.exports = {
    friendlyName: 'build',
    description: 'Build an package',
    static: true,
    inputs: {
        env: {
            description: 'Environment to Build',
            type: 'string',
            required: true
        },
        name: {
            description: 'Name Package to build',
            type: 'string',
            required: true
        },
        recursive: {
            description: 'Rescurse to all sub packages',
            type: 'boolean',
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
        // goto the deploy directory at the top level.
        // Call docker stack deploy -c docker-compose.yml
        // Iterate down to the Packages the same thing.
        // continue down the tree.
        // Make sure to call docker stack deploy first then go down.
        let name = inputs.name;
        let apath = path.resolve('.');
        console.log("Start Build:", apath);
        let topPackage = sLoader.processPackage(apath);
        // Find the package
        let pkg = APackage.getPackage(name);
        console.log("Build Package:", pkg);
        if(!inputs.recursive) {
            inputs.recursive = true
        }
        Build.pkg(pkg, {name: name,recursive:inputs.recursive, env: inputs.env});
        return `Building Application`;
    }
};

