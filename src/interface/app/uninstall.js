const path = require('path');
const exec = require('child_process').spawnSync;
const api = require('../../Documentation/api');
const sLoader = require('../../Server/Loader');
const fs = require('fs');

module.exports = {
    friendlyName: 'create',
    description: 'Create an app',
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
        uninstallPackage(topPackage, {name: name});
        return `Uninstall Application`;
    }
};

function uninstallPackage(package, opts) {

    if (package.deploy) {
        let stackName = opts.name + '_' + package.deploy.prefix.toLowerCase().replace(/\//,'').replace(/\//g, '_');
        console.log("Stack Name:", stackName);
        // let proc = exec('pwd', [], {cwd: package.deploy.dir, stdio: 'inherit'});
        let proc = exec('docker', ['stack', 'rm', stackName], {cwd: package.deploy.dir, stdio: 'inherit'});
    }
}
