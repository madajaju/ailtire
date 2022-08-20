const path = require('path');
const spawn = require('child_process').spawnSync;
const Generator = require('../Documentation/Generator');
const fs = require('fs');

module.exports = {
    pkg: (pkg, opts) => {
        buildPackage(pkg, opts);
    },
    services: (dir) => {
        buildBaseImages(dir);
    },
    buildService: (pkg, opts) => {
        return build(pkg, opts);
    },
    serviceStartFile: (pkg, opts) => {
        return buildStartFile(pkg,opts);
    },
    serviceFiles:(pkg, opts) => {
        return buildServiceFiles(pkg,opts);
    }
}
const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

function buildBaseImages(dir) {
    // read the directory and get the
    let ndir = path.resolve(dir);
    let bpath = path.resolve(ndir + '/build.js');
    if(isFile(bpath)) {
        let tbuild = require(bpath);
        for(let name in tbuild) {
            let service = tbuild[name];
            service.name = name;
            service.rootdir = ndir;
            buildImage(service);
        }
    }
    // Look for other directories.
    let dirs = getDirectories(ndir);
    for(let i in dirs) {
        let dirname = dirs[i];
        console.log(dirname);
        let npath = path.resolve(dirname + '/build.js');
        try {
            if (isFile(npath)) {
                let build = require(npath);
                for (let name in build) {
                    let service = build[name];
                    service.name = name;
                    service.rootdir = dirname;
                    buildImage(service);
                }
            }
        }
        catch(e) { }
    }
}
function buildServiceFiles(pkg,opts) {
    if(!pkg.deploy.envs.hasOwnProperty(opts.env)) {
        console.error(`Building ${pkg.name}: Error: environment design ${opts.env} not found! Look in the deploy.js file for the package!`);
        return;
    }
    let stack = pkg.deploy.envs[opts.env].design;
    stack.name = pkg.deploy.name;
    let repo ='';
    if(opts.repo) {
        repo = opts.repo + '/';
    }
    let files = {
        context: {
            contexts: pkg.deploy.contexts,
            stack: stack,
            repo: repo
        },
        targets: {
            './.tmp-dockerfile': {template: '/templates/Package/deploy/Dockerfile-Service'},
            './.tmp-stack-compose.yml': {template: '/templates/Package/deploy/stack-compose.yml'},
            './.router.js': {template: '/templates/Package/deploy/router.ejs'},
        }
    };
    Generator.process(files, pkg.deploy.dir);
    let composeFile = './.tmp-stack-compose.yml';
    if(pkg.deploy.envs[opts.env].file) {
        composeFile = pkg.deploy.envs[opts.env].file;
    }

    console.error("Building Stack Container:", pkg.deploy.name);
    return {dockerFile: '.tmp-dockerfile', composeFile: composeFile };
}
function buildStartFile(pkg,opts) {
    let stack = pkg.deploy.envs[opts.env].design;
    stack.name = pkg.deploy.name;
    let repo ='';
    if(opts.repo) {
        repo = opts.repo + '/';
    }
    let files = {
        context: {
            imageName: pkg.deploy.name.toLowerCase(),
            appName: pkg.deploy.name.toLowerCase(),
        },
        targets: {
            './.tmp-single-compose.yml': {template: '/templates/Package/deploy/single-compose.yml'},
        }
    };
    Generator.process(files, pkg.deploy.dir);
    let composeFile = './.tmp-single-compose.yml';
    if(pkg.deploy.envs[opts.env].file) {
        composeFile = pkg.deploy.envs[opts.env].file;
    }

    console.error("Building Stack Container:", pkg.deploy.name);

    return {composeFile: composeFile };
}
function build(pkg, opts) {
    // Build process will build an docker image that will start the stack if there is one.
    // let apath = path.resolve(pkg.deploy.dir + '/deploy.js');
    // if(fs.existsSync(apath)) {
    // let deploy = require(apath);
    let files = buildServiceFiles(pkg,opts);
    // Create the Dockerfile from the template with contexts set from the deploy
    if(!pkg.deploy.envs.hasOwnProperty(opts.env)) {
        // console.error("Could not find the environment:", opts.env);
        // console.error("Environments:", pkg.deploy.envs);
        return;
    }
    let proc = spawn('docker', ['build', '-t', pkg.deploy.name.toLowerCase(), '-f', files.dockerFile, '.'], {
        cwd: pkg.deploy.dir,
        stdio: [process.stdin, process.stdout, process.stderr],
        env: process.env
    });
    if(proc.status != 0) {
        console.error("Error Building Service Container", pkg.deploy.name);
        console.error(proc.stdout.toString('utf-8'));
        console.error(proc.stderr.toString('utf-8'));
    }
    // }
    // else {
    //     console.log("BuildService not found!:", apath);
    // }
}

function buildPackage(pkg, opts) {
    if(pkg.deploy) {
        for(let name in pkg.deploy.build) {
            let bc = pkg.deploy.build[name];
            let build = {};
            if(!bc.contexts.hasOwnProperty(opts.env)) {
                console.warn(`Building ${pkg.name} Warning:${opts.env} environment not found! Using default environment`);
                build = bc.contexts.default;
            } else {
                build = bc.contexts[opts.env];
            }
            for(ename in build.env) {
                process.env[ename] = build.env[ename];
            }
            let buildTag = build.tag;
            if(opts.repo) {
                buildTag = opts.repo + '/' + build.tag;
            }
            console.error("==== ContainerName ====", buildTag);
            let proc = spawn('docker', ['build', '-t', buildTag, '-f', build.file, build.dir], {
                cwd: pkg.deploy.dir,
                stdio: [process.stdin, process.stdout, process.stderr],
                env: process.env
            });
            if(proc.status != 0) {
                console.error("Error Building Service Container");
                if(proc.stderr) {
                    console.error(proc.stderr.toString('utf-8'));
                }
            }
        }
        build(pkg, opts);
    }

    // Iterate over the subsystems and build the docker images
    if(opts.recursive) {
        for (let i in pkg.subpackages) {
            buildPackage(pkg.subpackages[i], opts);
        }
    }
}

function buildImage(build) {

    let env = process.env;
    for(let name in build.env) {
        env[name] = build.env[name];
    }

    console.log("Building", build.name);
    let dirname = path.resolve(`${build.rootdir}/${build.dir}`);

    console.log("Building from directory", dirname);
    let proc = spawn('docker', ['build', '-t', build.tag, '-f', build.file, '.'], {
        cwd: dirname,
        stdio: [process.stdin, process.stdout, process.stderr],
        env: process.env
    });
    if(proc.status != 0) {
        console.error("Error Building Service Container", build.name);
        console.error(proc.error);
        if(proc.stdout) {
            console.error(proc.stdout.toString('utf-8'));
            console.error(proc.stderr.toString('utf-8'));
        }
    }
}


