const path = require('path');
const spawn = require('child_process').spawnSync;
const Generator = require('../Documentation/Generator');
const fs = require('fs');



module.exports = {
    pkg: (pkg, opts) => {
        console.log("Build pkg:", opts);
        buildPackage(pkg, opts);
    },
    services: (pkg, opts) => {
        buildBaseImages(pkg, opts);
    }
}

function buildBaseImages(pkg, opts) {

}
function buildService(pkg, opts) {
    // Build process will build an docker image that will start the stack if there is one.
    let apath = path.resolve(pkg.deploy.dir + '/deploy.js');
    if(fs.existsSync(apath)) {
        let deploy = require(apath);
        // Create the Dockerfile from the template with contexts set from the deploy
        if(!pkg.deploy.envs.hasOwnProperty(opts.env)) {
            // console.error("Could not find the environment:", opts.env);
            // console.error("Environments:", pkg.deploy.envs);
            return;
        }
        let stack = pkg.deploy.envs[opts.env].design;
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
    else {
        console.log("BuildService not found!:", apath);
    }
}

function buildPackage(pkg, opts) {
    if(pkg.deploy) {
        for(let name in pkg.deploy.build) {
            let bc = pkg.deploy.build[name];
            let build = {};
            if(!bc.contexts.hasOwnProperty(opts.env)) {
                console.log(`${opts.env} environment not found! Using default`);
                build = bc.contexts.default; 
            } else {
                build = bc.contexts[opts.env];
            }
            for(ename in build.env) {
                process.env[ename] = build.env[ename];
            }
            console.error("Working Directory:", pkg.deploy.dir);
            let buildTag = build.tag;
            if(opts.repo) {
                buildTag = opts.repo + '/' + build.tag;
            }
            console.error("==== ContainerName ====", buildTag);

            let proc = spawn('docker', ['build', '-t', buildTag, '-f', build.file, build.dir], {
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

    // Iterate over the subsystems and build the docker images
    if(opts.recursive) {
        for (let i in pkg.subpackages) {
            buildPackage(pkg.subpackages[i], opts);
        }
    }
}

