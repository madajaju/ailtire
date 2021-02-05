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
    },
    deployServices: (repository) => {
        deployBaseImages(repository);
    }
}

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

function buildBaseImages() {
    let apath = path.resolve(__dirname );
    let dirs = getDirectories(apath);
    for(let i in dirs) {
        let mydir = dirs[i];
        let buildfile = `${mydir}/build.js`;
        if(isFile(buildfile)) {
            let build = require(buildfile);
            console.error("Building Service Container:", build.name);
            let proc = spawn('docker', ['build', '-t', build.tag, '-f', build.dockerfile, '.'], {
                cwd: mydir,
                stdio: 'pipe',
                env: process.env
            });
            console.error("Completed building Service Container:", build.name);
            if(proc.status != 0) {
                console.error("Error Building Service Container", deploy.name);
                console.error(proc.stderr.toString('utf-8'));
            }
            else {
                console.log(proc.stdout.toString('utf-8'));
            }
        }
    }
}
function buildService(pkg, opts) {
    // Build process will build an docker image that will start the stack if there is one.
    let apath = path.resolve(pkg.deploy.dir + '/deploy.js');
    if(fs.existsSync(apath)) {
        let deploy = require(apath);
        // Create the Dockerfile from the template with contexts set from the deploy
        let files = {
            context: {
                contexts: deploy.contexts,
            },
            targets: {
                '.tmp-Dockerfile': {template: '/templates/Package/deploy/Dockerfile-Service'},
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
                    console.error("Error Building Service Container", deploy.name);
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

