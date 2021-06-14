const path = require('path');
const exec = require('child_process').spawnSync;
const api = require('../../Documentation/api');
const sLoader = require('../../Server/Loader');
const fs = require('fs');

module.exports = {
    friendlyName: 'install',
    description: 'Install an app',
    static: true,
    inputs: {
        env: {
            description: 'Environment to Build',
            type: 'string',
            required: true
        },
        name: {
            description: 'Name of the Installation',
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
        let name = inputs.name || "default";
        let environ = inputs.env || 'local';
        let apath = path.resolve('.');
        let topPackage = sLoader.processPackage(apath);
        installPackage(topPackage, {name: name, env: environ});
        return `Building Application`;
    }
};

function installPackage(package, opts) {

    if (package.deploy) {
        if(!package.deploy.envs.hasOwnProperty(opts.env)) {
            console.log("Could not find the environment:", opts.env);
            return "";
        }
        let stackName = opts.name + '_' + package.deploy.envs[opts.env].tag;
        stackName = stackName.toLowerCase().replace(/\//,'').replace(/\//g, '_');
        let dockerfile = package.deploy.envs[opts.env].file;
        console.log("Stack Name:", stackName);
        console.log("Environment:", opts.env)
        process.env.AILTIRE_STACKNAME = stackName;
        process.env.AILTIRE_ENV = opts.env;
        process.env.AILTIRE_APPNAME = opts.name;
        // let proc = exec('pwd', [], {cwd: package.deploy.dir, stdio: 'inherit'});
        let proc = exec('docker', ['stack', 'deploy', '-c', dockerfile, stackName], {cwd: package.deploy.dir, stdio: 'inherit', env:process.env});
    }
    // Iterate over the subsystems and build the docker images
    /*
    for (let i in package.subpackages) {
        installPackage(package.subpackages[i], opts);
    }

     */
}
