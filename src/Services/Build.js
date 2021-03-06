const path = require('path');
const spawn = require('child_process').spawnSync;
const Generator = require('../Documentation/Generator');
const fs = require('fs');



module.exports = {
    pkg: (pkg, opts) => {
        buildPackage(pkg,opts);
    },
    services: (pkg) => {
        buildBaseImages(pkg);
    }
}

function buildBaseImages(pkg) {

}
function buildService(pkg, opts) {
    // Build process will build an docker image that will start the stack if there is one.
    let apath = path.resolve(pkg.deploy.dir + '/deploy.js');
    if(fs.existsSync(apath)) {
        let deploy = require(apath);
        // Create the Dockerfile from the template with contexts set from the deploy
        if(!pkg.deploy.envs.hasOwnProperty(opts.environ)) {
            console.error("Could not find the environment:", opts.environ);
            return;
        }
        let stack = pkg.deploy.envs[opts.environ].design;
        stack.name = pkg.deploy.name;
        let files = {
            context: {
                contexts: deploy.contexts,
                stack: stack,
            },
            targets: {
                '.tmp-Dockerfile': {template: '/templates/Package/deploy/Dockerfile-Service'},
                '.tmp-stack-compose.yml': {template: '/templates/Package/deploy/stack-compose.yml'},
            }
        };
        Generator.process(files, pkg.deploy.dir);
        console.error("Building Service Container:", deploy.name);
        let proc = spawn('docker', ['build', '-t', deploy.name, '-f', '.tmp-Dockerfile', '.'], {
            cwd: pkg.deploy.dir,
            stdio: 'pipe',
            env: process.env
        });
        if(proc.status != 0) {
            console.error("Error Building Service Container", deploy.name);
            console.error(proc.stderr.toString('utf-8'));
        }
    }
}

function buildPackage(pkg, opts) {
    if(pkg.deploy) {
        let apath = path.resolve(pkg.deploy.dir + '/build.js');
        if(fs.existsSync(apath)) {
            let buildconfig = require(apath);
            for(let name in buildconfig) {
                let bc = buildconfig[name];
                for(ename in bc.env) {
                    process.env[ename] = bc.env[ename];
                }
                console.error("Working Directory:", pkg.deploy.dir);
                console.error("==== ContainerName ====", bc.tag);
                let proc = spawn('docker', ['build', '-t', bc.tag, '-f', bc.file, bc.dir], {
                    cwd: pkg.deploy.dir,
                    stdio: 'pipe',
                    env: process.env
                });
                if(proc.status != 0) {
                    console.error("Error Building Service Container");
                    console.error(proc.stderr.toString('utf-8'));
                }
            }
            buildService(pkg, opts);
        }
        else {
            console.error("Could not find build.js for", pkg.name);
        }
    }

    // Iterate over the subsystems and build the docker images
    if(opts.recursive) {
        for (let i in pkg.subpackages) {
            buildPackage(pkg.subpackages[i], opts);
        }
    }
}

