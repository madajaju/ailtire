let ejs = require('ejs');
let fs = require('fs');
let path = require('path');
let Generator = require('./Generator.js');

module.exports = {
    // action = { name: string, path: string };
    app: (app, output) => {
        appGenerator(app, output);
    },
    action: (action, output) => {
        actionGenerator(action, output);
    },
    // actor = { name: string };
    actor: (actor, output) => {
        actorGenerator(actor, output);
    },
    // package = { name: string, short: string };
    package: (pkg, output) => {
        packageGenerator(pkg, output + '/api');
    },
    usecase: (pkg, usecase, output) => {
        usecaseGenerator(pkg, usecase, output + '/api');
    },
    scenario: (pkg, usecase, name, output) => {
        scenarioGenerator(pkg, usecase, name, output + '/api');
    },
    model: (pkg, name, output) => {
        modelGenerator(pkg, name, output + '/api');
    },
    method: (pkg, model, name, output) => {
        methodGenerator(pkg, model, name, output);
    },
};
/* Locking for action to have the following
action = {
    name: 'name' // friendly name
    path: 'app/create' // path to create
*/
const appGenerator = (app, output) => {
    let files = {
        context: {
            name: app,
            nameNoSpace: app.replace(/ /g, ''),
            path: output
        },
        targets: {
            'index.js': {template: '/templates/App/index.ejs'},
            'package.json': {template: '/templates/App/package.json'},
            'api/index.js': {template: '/templates/App/apiIndex.js'},
            'api/interface': {folder: true},
            'api/handlers': {folder: true},
            'test': {folder: true},
            'views': {folder: true},
            'actors': {folder: true},
            'bin': {folder: true},
            'views/layouts/default.ejs': {copy: '/templates/App/default.ejs'},
            'bin/:nameNoSpace:': {copy: '/templates/App/bin'},
            'bin/init': {copy: '/templates/App/init'},
            'assets/js/d3.js': {copy: '/templates/App/js/d3.js'},
            'assets/js/Graph.js': {copy: '/templates/App/js/Graph.js'},
            'assets/js/less.js': {copy: '/templates/App/js/less.js'},
            'assets/js/socket.io.js': {copy: '/templates/App/js/socket.io.js'},
            'assets/styles/color.less': {copy: '/templates/App/styles/color.less'},
            'assets/styles/graph.less': {copy: '/templates/App/styles/graph.less'},
            'assets/styles/importer.less': {copy: '/templates/App/styles/importer.less'},
            'assets/styles/top.less': {copy: '/templates/App/styles/top.less'},
            'bin/lib/subcommander.js': {copy: '/templates/App/subcommander.js'},
            'deploy/docker-compose.yml': {template: '/templates/App/deploy/docker-compose.yml'},
            'deploy/build.js': {template: '/templates/App/deploy/build.js'},
            'deploy/deploy.js': {template: '/templates/App/deploy/deploy.js'},
            'deploy/web/Dockerfile': {template: '/templates/App/deploy/Dockerfile_web'},
            'deploy/doc/Dockerfile': {template: '/templates/App/deploy/Dockerfile_doc'},
            'deploy/doc/package.json': {template: '/templates/App/deploy/package.doc.json'},
            '/deploy/web/server.js': {template: '/templates/App/deploy/server.js'},
            '/deploy/doc/doc.js': {template: '/templates/App/deploy/doc.js'},
            'docs/plantuml.jar': {copy: '/templates/App/plantuml.jar'}
        }
    };
    Generator.process(files, output);
};
const actionGenerator = (action, output) => {
    let project = require(process.cwd() + '/package.json');
    let files = {
        context: {
            name: action.name,
            project: project,
            path: action.path
        },
        targets: {
            '.:path:.js': {template: '/templates/Action/action.js'},
        }
    };
    Generator.process(files, output);
};

const actorGenerator = (actor, output) => {
    let project = require(process.cwd() + '/package.json');
    let files = {
        context: {
            name: actor.name,
            project: project,
            nameNoSpace: actor.name.replace(/ /g, '')
        },
        targets: {
            ':nameNoSpace:/index.js': {template: '/templates/Actor/actor.js'},
        }
    };
    Generator.process(files, output);
};

const packageGenerator = (pkg, output) => {

    // Build out the packages based in the delimiter '/'
    // Check that the package has already been created first.
    // if it has then check the next level.
    if(pkg.name) {
        let packageArray = pkg.name.split(/\//);
        let ancestors = [];
        for (let i in packageArray) {
            let packageItem = packageArray[i];
            let packageItemName = packageItem.replace(/ /g, '');
            let shortname = '';
            let nameArray = packageItem.split(/\s/);
            for (let j in nameArray) {
                shortname += nameArray[j][0];
            }
            shortname = shortname.toUpperCase();
            if (!existsDir(output + '/' + packageItemName)) {
                let files = {
                    context: {
                        name: packageItem,
                        nameNoSpace: packageItemName,
                        shortname: shortname.toLowerCase(),
                        ancestors: ancestors.join('_').toLowerCase()
                    },
                    targets: {
                        ':nameNoSpace:/index.js': {template: '/templates/Package/index.js'},
                        ':nameNoSpace:/handlers': {folder: true},
                        ':nameNoSpace:/interface': {folder: true},
                        ':nameNoSpace:/models': {folder: true},
                        ':nameNoSpace:/deploy': {folder: true},
                        ':nameNoSpace:/deploy/docker-compose.yml': {template: '/templates/Package/deploy/docker-compose.yml'},
                        ':nameNoSpace:/deploy/build.js': {template: '/templates/Package/deploy/build.js'},
                        ':nameNoSpace:/deploy/deploy.js': {template: '/templates/Package/deploy/deploy.js'},
                        ':nameNoSpace:/deploy/web/Dockerfile': {template: '/templates/Package/deploy/Dockerfile'},
                        ':nameNoSpace:/deploy/web/package.json': {template: '/templates/Package/deploy/package.json'},
                        ':nameNoSpace:/deploy/web/server.js': {template: '/templates/Package/deploy/server.js'},
                        ':nameNoSpace:/deploy/gateway/Dockerfile': {template: '/templates/Package/deploy/Dockerfile'},
                        ':nameNoSpace:/usecases': {folder: true},

                    }
                };
                Generator.process(files, output);
            }
            ancestors.push(shortname);
            output += '/' + packageItemName;
        }
    }
    else { // Return the application directory
       output = output;
       pkg.name = '';
    }
    return {dir: output, name: pkg.name};
};
const usecaseGenerator = (pkg, name, output) => {
    let pkgObj = packageGenerator({name: pkg}, output);
    let nameNoSpace = name.replace(/ /g, '');
    let ucDir = pkgObj.dir + `/usecases/${nameNoSpace}`;
    if(!existsDir(ucDir)) {
        let files = {
            context: {
                name: name,
                pkgName: pkgObj.name.split(/\s/g, ''),
                useCaseDirectory: ucDir,
                nameNoSpace: nameNoSpace,
            },
            targets: {
                'usecases/:nameNoSpace:/index.js': {template: '/templates/UseCase/index.js'},
            }
        };
        Generator.process(files, pkgObj.dir);
        files = {
            context: {
                name: name,
                appName: global.ailtire.config.prefix,
                pkgName: pkgObj.name.replace(/\s/g, ''),
                useCaseDirectory: ucDir,
                nameNoSpace: nameNoSpace,
            },
            targets: {
                '/test/bin/:pkgName:/:nameNoSpace:.test.js': {template: '/templates/UseCase/usecase.test.js'},
            }
        };
        Generator.process(files, '.');
    }
    return {name: name, dir: ucDir};
};
const scenarioGenerator = (pkg, usecase, name, output) => {
    let targetDir = output;
    let workingDir = process.cwd();
    let usecaseFile = path.resolve(process.cwd() + '/index.js');
    if (pkg && usecase) {
        let usecaseObj = usecaseGenerator(pkg, usecase,output);
        output = usecaseObj.dir;
    } else if (existsFile(usecaseFile)) {
        let ucInfo = require(usecaseFile);
        output = workingDir;
        console.log("Adding Scenairo to", ucInfo.name);

    } else {
        console.error("Could not create scenario. Go to Use Case directory or project root");
        return;
    }
    let nameNoSpace = name.replace(/ /g, '');
    let files = {
        context: {
            name: name,
            nameNoSpace: nameNoSpace,
        },
        targets: {
            ':nameNoSpace:.js': {template: '/templates/Scenario/scenario.js'},
        }
    };
    Generator.process(files, output);
};
const modelGenerator = (pkg, name, output) => {
    let nameNoSpace = name.replace(/ /g, '');
    let modelDir;
    if(pkg) {
        let pkgObj = packageGenerator({name: pkg}, output);
        modelDir = pkgObj.dir + `/models/${nameNoSpace}`;
        output = pkgObj.dir;
    }
    else {
        output = process.cwd();
        modelDir = output + `/models/${nameNoSpace}`;
    }
    if(!existsDir(modelDir)) {
        let files = {
            context: {
                name: name,
                nameNoSpace: nameNoSpace,
            },
            targets: {
                'models/:nameNoSpace:/index.js': {template: '/templates/Model/index.js'},
            }
        };
        Generator.process(files, output);
    }
    return {name: name, dir: modelDir};
};
const methodGenerator = (pkg, model, name, output) => {
    let targetDir = output;
    let workingDir = process.cwd();
    let modelFile = path.resolve(process.cwd() + '/index.js');
    if (pkg && model) {
        let modelObj = modelGenerator(pkg, model,output);
        output = modelObj.dir;
    } else if (existsFile(modelFile)) {
        let modelInfo = require(modelFile);
        output = workingDir;
        console.log("Adding method to", modelInfo.name);

    } else {
        console.error("Could not create scenario. Go to Use Case directory or project root");
        return;
    }
    let nameNoSpace = name.replace(/ /g, '');
    let files = {
        context: {
            name: name,
            nameNoSpace: nameNoSpace,
        },
        targets: {
            ':nameNoSpace:.js': {template: '/templates/Method/method.js'},
        }
    };
    Generator.process(files, output);
};

function existsDir(dir) {
    try {
        if (fs.statSync(dir).isDirectory()) {
            return true;
        }
    } catch (e) {
        if (e) {
            return false;
        }
    }
}

function existsFile(file) {
    try {
        if (fs.statSync(file).isFile()) {
            return true;
        }
    } catch (e) {
        return false;
    }
}
