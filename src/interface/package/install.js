const path = require('path');
const exec = require('child_process').spawnSync;
const sLoader = require('../../Server/Loader');
const APackage = require('../../Server/APackage');

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
            description: 'Name of the Build',
            type: 'string',
            required: false
        },
        package: {
            description: 'Name of the Package',
            type: 'string',
            required:  true
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
        let pkg = APackage.getPackage(inputs.package);
        installPackage(pkg, {name: name});
        return `Install Package`;
    }
};

function installPackage(package, opts) {

    if (package.deploy) {
        let stackName = opts.name + '_' + package.deploy.prefix.toLowerCase().replace(/\//,'').replace(/\//g, '_');
        console.log("Stack Name:", stackName);
        process.env.STACKNAME = stackName;
        process.env.APPNAME = opts.name;
        // let proc = exec('pwd', [], {cwd: package.deploy.dir, stdio: 'inherit'});
        let proc = exec('docker', ['stack', 'deploy', '-c', 'docker-compose.yml', stackName], {cwd: package.deploy.dir, stdio: 'inherit', env:process.env});
    }
    // Iterate over the subsystems and build the docker images
    for (let i in package.subpackages) {
        installPackage(package.subpackages[i], opts);
    }
}
