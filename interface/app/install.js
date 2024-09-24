const path = require('path');
const spawn = require('child_process').spawnSync;
const api = require('../../src/Documentation/api');
const sLoader = require('../../src/Server/Loader');
const fs = require('fs');
const Build = require('../../src/Services/BuildEngine');

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
        repo: {
            description: "Name of the Repository for the docker images",
            type: 'string',
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
        let name = inputs.name || "default";
        let environ = inputs.env || 'local';
        let repo = inputs.repo || '';
        let apath = path.resolve('.');
        let topPackage = sLoader.processPackage(apath);
        installPackage(topPackage, {name: name, env: environ, repo: repo});
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
        stackName = stackName.replace(/:/g, '-');
        stackName = stackName.toLowerCase().replace(/\//,'').replace(/\//g, '_');
        let dockerfile = package.deploy.envs[opts.env].file;
        Build.buildService(package, opts);
        let files = Build.serviceStartFile(package, opts);
        console.log("Stack Name:", stackName);
        console.log("Environment:", opts.env)
        process.env.AILTIRE_STACKNAME = stackName;
        process.env.AILTIRE_ENV = opts.env;
        process.env.AILTIRE_APPNAME = opts.name;
        process.env.APPNAME = opts.name;
        console.log("Running command!");
        //let proc = spawn('pwd', [], {
        let proc = spawn('docker', ['stack', 'deploy', '-c', files.composeFile, stackName], {
            cwd: package.deploy.dir,
            stdio: 'pipe',
            env: process.env
        });
        console.error(proc.stdout.toString('utf-8'));
        if(proc.status != 0) {
            console.error("Error Deploying Service Container: ", package.deploy.name);
            console.error(proc.stderr.toString('utf-8'));
        }
        console.log("Done running command!");
        // let proc = exec('docker', ['stack', 'deploy', '-c', '/c/Users/dwpulsip/work/edgemere/deploy/' + files.composeFile, stackName], {cwd: package.deploy.dir, stdio: 'inherit', env:process.env});
        // let proc = exec('dir', {cwd: package.deploy.dir, stdio: 'inherit', env:process.env});
    }
    // Iterate over the subsystems and build the docker images
    /*
    for (let i in package.subpackages) {
        installPackage(package.subpackages[i], opts);
    }

     */
}
