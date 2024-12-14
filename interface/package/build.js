const path = require('path');
const sLoader = require('../../src/Server/Loader');
const Build = require('../../src/Services/BuildEngine');
const APackage = require('../../src/Server/APackage');

module.exports = {
    friendlyName: 'build',
    description: 'Build an app',
    static: true,
    inputs: {
        package: {
            description: 'Package to Build',
            type: 'string',
            required: true
        },
        env: {
            description: 'Environment to Build',
            type: 'string',
            required: true
        },
        name: {
            description: 'Name of the Build',
            type: 'string',
            required: false
        },
        repo: {
            descritpion: 'Repository location',
            type: 'string',
            required: false,
        },
        recursive: {
            descritpion: 'Recurse all of the subpackages',
            type: 'boolean',
            required: false,
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

        console.log("Analyzing the Project");
        let topPackage = sLoader.processPackage(apath);
        let pkg = APackage.get(inputs.package);
        console.log("Starting the build for ", pkg.name);
        // Build the top level deploy
        // Build.services(apath + '/deploy');
        // Build all of the images.
        // if(inputs.recursive) {
        //     Build.services(topPackage.dir);
        // }
        Build.pkg(pkg, {name: name,recursive:inputs.recursive, env: inputs.env, repo: inputs.repo});
        return `Building Application`;
    }
};

