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
        return buildEngine(pkg, opts);
    },
    serviceStartFile: (pkg, opts) => {
        return buildStartFile(pkg, opts);
    },
    serviceFiles: (pkg, opts) => {
        return buildServiceFiles(pkg, opts);
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
    try {
        if (isFile(bpath)) {
            let tbuild = require(bpath);
            if (tbuild.tag !== undefined) {
                for (let name in tbuild) {
                    let service = tbuild[name];
                    service.name = name;
                    service.rootdir = ndir;
                    buildImage(service);
                }
            }
        }
    } catch (e) {
        console.error("No build.js found search directories");
    }
    // Look in sub-directories
    let dirs = getDirectories(ndir);
    for (let i in dirs) {
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
                    if (service.name !== undefined) {
                        buildImage(service);
                    }
                }
            }
        } catch (e) {
        }
    }
}

function buildServiceFiles(pkg, opts) {
    if (!pkg.deploy.envs.hasOwnProperty(opts.env)) {
        console.error(`Building ${pkg.name}: Error: environment design ${opts.env} not found! Look in the deploy.js file for the package!`);
        return;
    }
    let stack = pkg.deploy.envs[opts.env].stack;
    let repo = '';
    if (opts.repo) {
        repo = opts.repo + '/';
    }
    let files = {
        context: {
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
    if (pkg.deploy.envs[opts.env].file) {
        composeFile = pkg.deploy.envs[opts.env].file;
    }

    console.error("Building Stack Container:", pkg.deploy.name);
    return {dockerFile: '.tmp-dockerfile', composeFile: composeFile};
}

function buildStartFile(pkg, opts) {
    let stack = pkg.deploy.envs[opts.env].stack;
    let repo = '';
    if (opts.repo) {
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
    if (pkg.deploy.envs[opts.env].file) {
        composeFile = pkg.deploy.envs[opts.env].file;
    }

    console.error("Building Stack Container:", pkg.deploy.name);

    return {composeFile: composeFile};
}

function buildEngine(pkg, opts) {
    // Build process will buildEngine an docker image that will start the stack if there is one.
    // let apath = path.resolve(pkg.deploy.dir + '/deploy.js');
    // if(fs.existsSync(apath)) {
    // let deploy = require(apath);
    let files = buildServiceFiles(pkg, opts);
    // Create the Dockerfile from the template with contexts set from the deploy
    if (!pkg.deploy.envs.hasOwnProperty(opts.env)) {
        // console.error("Could not find the environment:", opts.env);
        // console.error("Environments:", pkg.deploy.envs);
        return;
    }
    let proc = spawn('docker', ['build', '-t', pkg.deploy.name.toLowerCase(), '-f', files.dockerFile, '.'], {
        cwd: pkg.deploy.dir,
        stdio: [process.stdin, process.stdout, process.stderr],
        env: process.env
    });
    if (proc.status != 0) {
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
    if (pkg.deploy) {
        // Create a tmp directory to build the microservice
        let destDir = path.resolve(`${pkg.deploy.dir}/.buildDir`);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }

        for (let name in pkg.deploy.build) {
            let bc = pkg.deploy.build[name];
            let build = {};
            if (!bc.contexts.hasOwnProperty(opts.env)) {
                console.warn(`Building ${pkg.name} Warning:${opts.env} environment not found! Using default environment`);
                build = bc.contexts.default;
            } else {
                build = bc.contexts[opts.env];
            }
            // Create the build directory for the build with the environment.
            // If it exists it should be removed and another one created.
            let buildDir = path.resolve(`${destDir}/${name}/${opts.env}`);
            // If there is a dir option then copy everything from the dir directory into the destpath
            if (fs.existsSync(buildDir)) {
                try {
                    fs.rmSync(buildDir, {recursive: true});
                } catch (e) {
                    console.error("Could not remove build directory:", buildDir, e);
                }
            }
            try {
                fs.mkdirSync(buildDir, {recursive: true});
            } catch (e) {
                console.error("Could not create build directory:", buildDir, e);
            }
            // Now copy everything from the dir option into the directory.
            let fromPath = path.resolve(`${pkg.deploy.dir}/${build.dir}`);
            try {
                _copyDirectory(fromPath, buildDir);
            } catch (e) {
                console.error("Could not copy the dir:", fromPath, " to ", buildDir, e);
            }
            let buildFile = path.resolve(`${fromPath}/${build.file}`);
            // Copy all of the contents from the deploy build directory into the top directory.
            let destBuildFile = path.join(buildDir, "Dockerfile");
            try {
                fs.cpSync(buildFile, destBuildFile);
            } catch (e) {
                console.error("Could not copy the build file:", buildFile, destBuildFile, e);
            }
            // Now copy the deployment to the top directory.
            _copyDirectory(path.resolve(pkg.deploy.dir), path.join(buildDir, "deploy"));
            // Create the interface directory if it does not exist.
            if (!fs.existsSync(`${buildDir}/interface`)) {
                fs.mkdirSync(`${buildDir}/interface`, {recursive: true});
            }

            // copy the interface for the pkg to api/interface
            _copyDirectory(path.resolve(pkg.interfaceDir), `${buildDir}/api/interface`);
            
            // Now copy the packages included in the definition
            for (let i in build.packages) {
                let depPkg = build.packages[i];
                _copyPackage(depPkg, buildDir);
            }

            for (ename in build.env) {
                process.env[ename] = build.env[ename];
            }
            let buildTag = build.tag;
            if (opts.repo) {
                buildTag = opts.repo + '/' + build.tag;
            }
            console.error("==== ContainerName ====", buildTag);
            let proc = spawn('docker', ['build', '-t', buildTag, '-f', 'Dockerfile', '.'], {
                cwd: buildDir,
                stdio: [process.stdin, process.stdout, process.stderr],
                env: process.env
            });
            if (proc.status != 0) {
                console.error("Error Building Service Container");
                if (proc.stderr) {
                    console.error(proc.stderr.toString('utf-8'));
                }
            }
        }
        buildEngine(pkg, opts);
    }

    // Iterate over the subsystems and buildEngine the docker images
    if (opts.recursive) {
        for (let i in pkg.subpackages) {
            buildPackage(pkg.subpackages[i], opts);
        }
    }
}

function buildImage(build) {

    let env = process.env;
    for (let name in build.env) {
        env[name] = build.env[name];
    }

    let dirname = path.resolve(`${build.rootdir}/${build.dir}`);

    console.log(`Building ${build.name} from directory ${dirname}`);
    if (build.tag !== undefined && build.file !== undefined) {
        let proc = spawn('docker', ['build', '-t', build.tag, '-f', build.file, '.'], {
            cwd: dirname,
            stdio: [process.stdin, process.stdout, process.stderr],
            env: process.env
        });
        if (proc.status != 0) {
            console.error("Error Building Service Container", build.name);
            console.error(proc.error);
            if (proc.stdout) {
                console.error(proc.stdout.toString('utf-8'));
                console.error(proc.stderr.toString('utf-8'));
            }
        }
    }
}

// This will exclud all subdirectories starting with "."
function _copyDirectory(src, dest) {

    // Create the dest directory if it does not exist.
    if (!fs.existsSync(dest)) {
        try {
            fs.mkdirSync(dest, {recursive: true});
        } catch (e) {
            console.error("Could not create directory:", destFile, e);
        }
    }
    if (fs.existsSync(src)) {
        let files = fs.readdirSync(src)
        for (let i in files) {
            let file = files[i];
            let srcFile = path.join(src, file);
            let destFile = path.join(dest, file);
            if(file[0] !== '.' && file !== 'node_modules') {
                    if (fs.lstatSync(srcFile).isDirectory()) {
                        _copyDirectory(srcFile, destFile);
                    } else {
                        try {
                            fs.cpSync(srcFile, destFile);
                        } catch (e) {
                            console.error("Could not copy file:", srcFile, destFile, e);
                        }
                    }
                }
            }
        }
    }
}

function _copyPackage(srcPkg, destDir) {
    // Top Package has the base directory.
    let topDirectory = path.resolve(global.topPackage.dir);
    // Find the packge first
    console.log("Adding Package:", srcPkg);

    // Put the application index.js definition file in the api directory.
    let topPackageFile = path.resolve(`${global.topPackage.definition.dir}/index.js`);
    if (!fs.existsSync(`${destDir}/api/index.js`)) {
        if (fs.existsSync(topPackageFile)) {
            fs.cpSync(topPackageFile, `${destDir}/api/index.js`);
        }
    }
    if (!fs.existsSync(`${destDir}/api/interface`)) {
        fs.mkdirSync(`${destDir}/api/interface`, {recursive: true});
    }

    if (global.packages.hasOwnProperty(srcPkg)) {
        let spkg = global.packages[srcPkg];
        let spkgDir = path.resolve(spkg.dir);
        //let dpkgDir = spkgDir.replace(topDirectory, '');
        dpkgDir = path.resolve(`${destDir}/api/${srcPkg}`);
        _copyDirectory(spkgDir, dpkgDir);
        // Now process the includes classes into the dpkgDir models file
        for (let iname in spkg.includes) {
            let inc = spkg.includes[iname];
            let destDir = path.resolve(`${dpkgDir}/models/${iname}`);
            _copyDirectory(inc.definition.dir, destDir)
        }
    }
}
