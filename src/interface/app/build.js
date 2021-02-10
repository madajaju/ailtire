const path = require('path');
const sLoader = require('../../Server/Loader');
const Build = require('../../Services/Build');

module.exports = {
    friendlyName: 'build',
    description: 'Build an app',
    static: true,
    inputs: {
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
        let topPackage = sLoader.processPackage(apath);
        Build.services(topPackage, {name: name, environ: inputs.env});
        Build.pkg(topPackage, {name: name,recursive:true, environ: inputs.env});
        return `Building Application`;
    }
};

