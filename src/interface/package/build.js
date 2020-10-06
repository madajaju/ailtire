const path = require('path');
const spawn = require('child_process').spawnSync;
const api = require('../../Documentation/api');
const sLoader = require('../../Server/Loader');
const APackage = require('../../Server/APackage');
const Generator = require('../../Documentation/Generator');
const fs = require('fs');

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
        console.log("Packages:", global.packages);
        let pkg = APackage.getPackage(name);
        console.log("Build Package:", pkg);
        buildPackage(pkg, {name: name,recursive:inputs.recursive});
        buildService(pkg, {name: name});
        return `Building Application`;
    }
};

function buildService(package, opts) {
    // Build process will build an docker image that will start the stack if there is one.
    let apath = path.resolve(package.deploy.dir + '/deploy.js');
    if(fs.existsSync(apath)) {
        let deploy = require(apath);
        // Create the Dockerfile from the template with contexts set from the deploy
        let files = {
            context: {
                contexts: deploy.contexts,
            },
            targets: {
                'run': {template: '/templates/Package/deploy/run'},
                'Dockerfile': {template: '/templates/Package/deploy/Dockerfile-Service'},
            }
        };
        Generator.process(files, package.deploy.dir);
        // using the CNAB construct.
        proc = spawn('docker', ['build', '-t', deploy.name, '-f', 'Dockerfile', '.'], {
            cwd: package.deploy.dir,
            stdio: 'inherit',
            env: process.env
        });
    }
}

function buildPackage(package, opts) {
    if(package.deploy) {
        let apath = path.resolve(package.deploy.dir + '/build.js');
        if(fs.existsSync(apath)) {
            let buildconfig = require(apath);
            for(let name in buildconfig) {
                let bc = buildconfig[name];
                for(ename in bc.env) {
                    process.env[ename] = bc.env[ename];
                }
                console.log("Working Directory:", package.deploy.dir);
                console.log("==== ContainerName ====", bc.tag);
                proc = spawn('docker', ['build', '-t', bc.tag, '-f', bc.file, bc.dir], {
                    cwd: package.deploy.dir,
                    stdio: 'inherit',
                    env: process.env
                });
            }
        }
        else {
            console.error("Could not find build.js for", package.name);
        }
    }

    // Iterate over the subsystems and build the docker images
    if(opts.recursive) {
        for (let i in package.subpackages) {
            buildPackage(package.subpackages[i], opts);
        }
    }
}

