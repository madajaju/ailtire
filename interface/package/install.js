const path = require('path');
const exec = require('child_process').spawnSync;
const sLoader = require('../../src/Server/Loader');
const APackage = require('../../src/Server/APackage');
const Build = require("../../src/Services/BuildEngine");
const {spawnSync: spawn} = require("child_process");

module.exports = {
    friendlyName: 'install',
    description: 'Install an package',
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
        console.log("MADEIT");
        let name = inputs.name || "default";
        let environ = inputs.env || 'local';
        let repo = inputs.repo || '';
        let apath = path.resolve('.');
        let topPackage = sLoader.processPackage(apath);
        let pkg = APackage.getPackage(inputs.package);
        installPackage(pkg, {name: name, env: environ,repo: repo});
        return `Install Package`;
    }
};

/*function installPackage(package, opts) {

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
}*/
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
        console.log("FILES:", files.composeFile);
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
