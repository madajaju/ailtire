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
            'index.js': {template: '/templates/App/index.js'},
            'package.json': {template: '/templates/App/package.json'},
            'api/index.js': {template: '/templates/App/apiIndex.js'},
            'interface': {folder: true},
            'test': {folder: true},
            'views': {folder: true},
            'actors': {folder: true},
            'bin': {folder: true},
            'bin/:nameNoSpace:': {copy: '/templates/App/bin'},
            'bin/lib/subcommander.js': {copy: '/templates/App/subcommander.js'},
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
            ':nameNoSpace:.js': {template: '/templates/Actor/actor.js'},
        }
    };
    Generator.process(files, output);
};

const packageGenerator = (pkg, output) => {

    // Build out the packages based in the delimiter '/'
    // Check that the package has already been created first.
    // if it has then check the next level.

    let packageArray = pkg.name.split(/\//);
    for (let i in packageArray) {
        let packageItem = packageArray[i];
        let packageItemName = packageItem.replace(/ /g, '');
        let shortName = '';
        let nameArray = packageItem.split(/\s/);
        for (let j in nameArray) {
            shortName += nameArray[j][0];
        }
        shortName = shortName.toUpperCase();
        if (!existsDir(output + '/' + packageItemName)) {
            console.log("Create PackageL", packageItemName);
            let files = {
                context: {
                    name: packageItem,
                    nameNoSpace: packageItemName,
                    shortName: shortName
                },
                targets: {
                    ':nameNoSpace:/index.js': {template: '/templates/Package/index.js'},
                    ':nameNoSpace:/interface': {folder: true},
                    ':nameNoSpace:/models': {folder: true},
                    ':nameNoSpace:/usecases': {folder: true},

                }
            };
            Generator.process(files, output);
        }
        output += '/' + packageItemName;
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
                nameNoSpace: nameNoSpace,
            },
            targets: {
                'usecases/:nameNoSpace:/index.js': {template: '/templates/UseCase/index.js'},
            }
        };
        Generator.process(files, pkgObj.dir);
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
