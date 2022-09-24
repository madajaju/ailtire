const fs = require('fs');
const funcHandler = require('../Proxy/MethodProxy');
const path = require('path');
const classProxy = require('../Proxy/ClassProxy');
const packageProxy = require('../Proxy/PackageProxy');
const apiGenerator = require('../Documentation/api');
const YAML = require('yamljs');
const AClass = require('./AClass');

module.exports = {
    analyze: (pkg) => {
        analyzeApp(pkg);
    },
    processPackage: (dir) => {
        global.actors = {};
        global.actions = {};
        global.events = {};
        global.handlers = {};
        global.classes = {};
        global.packages = {};
        global.topPackage = {};
        global.usecases = {};
        global.appBaseDir = dir;
        global.topPackage = processDirectory(dir);
        return global.topPackage;
    },
    checkPackages: () => {
    }

};

const analyzeApp = app => {
    for (let i in global.packages) {
        checkPackage(global.packages[i]);
        checkDeployment(global.deploy, global.ailtire.implementation.images);
    }
    analyzeClasses(global.classes);
    checkWorkflows(global.workflows);
}
const analyzeClasses = classes => {
    // go through each association and set the dependant map on the type of the association.
    for (let i in classes) {
        let cls = classes[i];
        let assocs = cls.definition.associations
        for (let j in assocs) {
            let assoc = assocs[j];
            let aType = assoc.type;
            if (global.classes.hasOwnProperty(aType)) {
                let gcls = global.classes[aType];

                if (!gcls.definition.hasOwnProperty('dependant')) {
                    gcls.definition.dependant = {};
                }
                let d = {model: cls.definition, assoc: assoc}
                d.assoc.name = j;
                gcls.definition.dependant[j + cls.definition.name] = d;
                // Push the association owner into the definition for the persistent layer.
                if (assoc.owner || assoc.composite) {
                    if (!gcls.definition.hasOwnProperty('owners')) {
                        gcls.definition.owners = new Array();
                    }
                    gcls.definition.owners.push(d);
                }
            } else {
                assoc.name = j;
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({
                    type: 'model.associations',
                    object: {type: "Model", id: cls.definition.name, name: cls.definition.name},
                    message: "Class association type does not map to a model",
                    data: assoc,
                    lookup: 'model/list'
                });
                console.error("Association type does not map to a model:", aType, " for Class: ", cls.definition.name);
            }
        }
    }
}
const processDirectory = dir => {
    // Check the actors first
    let actorDir = dir + '/actors';
    if (isDirectory(actorDir)) {
        loadActors(actorDir, '');
    }
    let pkg = null;
    let apiDir = dir + '/api';
    if (isDirectory(apiDir)) {
        pkg = loadDirectory(apiDir, '');
    } else {
        pkg = loadDirectory(dir, '');
    }
    let deployDir = dir + '/deploy';
    if (isDirectory(deployDir)) {
        loadDeploy(pkg, pkg.prefix, deployDir);
    }
    return pkg;
};
// First look load the index file as the name of the top subsystem.


const isDirectory = source => fs.existsSync(source) && fs.lstatSync(source).isDirectory();
const isFile = source => fs.existsSync(source) && !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

let reservedDirs = {
    actors: (pkg, prefix, dir) => {
        loadActors(dir, prefix);
    },
    node_modules: (pkg, prefix, dir) => {
        // Do Nothing.
        // Just skip
    },
    doc: (pkg, prefix, dir) => {
        loadDocs(pkg, dir);
    },
    deploy: (pkg, prefix, dir) => {
        pkg = loadDeploy(pkg, prefix, dir);
    },
    handlers: (pkg, prefix, dir) => {
        // The Interface directory can be multiple directories deep which map to routes A/B/C
        pkg.handlers = loadHandlers(pkg, prefix, dir);
    },
    interface: (pkg, prefix, dir) => {
        //The Interface directory can be multiple directories deep which map to routes A/B/C
        pkg.interfaceDir = dir;
        pkg.interface = loadActions(pkg, prefix, dir);
    },
    models: (pkg, prefix, dir) => {
        // This stores the pkg classes.
        // Process the Model Include Files
        processModelIncludefile(prefix, dir);
        pkg.classes = {};
        let models = getDirectories(dir);
        for (let i in models) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let modelDir = models[i];
            // let model = path.basename(modelDir);

            let myClass = require(modelDir + '/index.js');

            myClass.package = pkg;
            myClass.dir = modelDir;
            if (global.classes.hasOwnProperty(myClass.definition.name)) {
                // console.error('Class Already defined', myClass.definition.name, "in this model:", modelDir);
                // throw new Error('Class Already defined' + myClass.definition.name + "in this model:" + modelDir);
            } else {
                let myProxy = new Proxy(myClass, classProxy);
                // set the owners array for persistence.
                myClass.definition.owners = new Array();
                myClass.definition.dir = modelDir;
                pkg.classes[myClass.definition.name] = myProxy;
                global.classes[myClass.definition.name] = myProxy;
                global[myClass.definition.name] = myProxy;
            }
            loadDocs(myClass, modelDir + '/doc');
            loadClassMethods(myClass, modelDir);
        }
    },
    workflows: (pkg, prefix, dir) => {
        loadWorkflows(pkg, prefix, dir);
    },
    usecases: (pkg, prefix, dir) => {
        pkg.usecases = {};
        let usecases = getDirectories(dir);
        for (let i in usecases) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let ucDir = usecases[i];
            let myUC = require(ucDir + '/index.js');
            myUC.package = pkg.name;
            myUC.prefix = pkg.prefix;
            myUC.dir = ucDir;
            pkg.usecases[myUC.name.replace(/\s/g, '')] = myUC;
            global.usecases[myUC.name.replace(/\s/g, '')] = myUC;
            loadDocs(myUC, ucDir + '/doc');
            loadUCScenarios(myUC, ucDir);
        }
    }
};

const loadWorkflows = (pkg, prefix, dir) => {
    if (fs.existsSync(dir)) {
        if (!pkg.hasOwnProperty('workflows')) {
            pkg.workflows = {};
        }
        let files = getFiles(dir);
        for (let i in files) {
            let file = files[i];
            let workflow = require(file);
            pkg.workflows[workflow.name] = workflow;
            workflow.pkg = pkg.shortname;
            if (!global.hasOwnProperty('workflows')) {
                global.workflows = {};
            }
            if (!global.workflows.hasOwnProperty(workflow.name)) {
                global.workflows[workflow.name] = workflow;
            } else {
                console.error("Workflow already defined:", workflow.name);
            }
        }
    }
};
const loadDocs = (pkg, dir) => {
    if (fs.existsSync(dir)) {
        let files = getFiles(dir);
        let nfiles = [];
        let ndir = dir;
        ndir = ndir.replace(/[\/\\]/g, '/');
        for (let i in files) {
            let file = files[i];
            let nfile = file.replace(/[\/\\]/g, '/');
            nfiles.push(nfile.replace(ndir, ''));
        }
        pkg.doc = {basedir: dir, files: nfiles};
    } else {
        fs.mkdirSync(dir);
        pkg.doc = {basedir: dir, files: []};
    }
}

const loadDeploy = (pkg, prefix, dir) => {
    pkg.deploy = {
        dir: dir,
        prefix: prefix,
        envs: {},
        build: {}
    };
    // Get the build file
    let apath = path.resolve(dir + '/build.js');
    if (!global.ailtire.implementation) {
        global.ailtire.implementation = {};
    }
    if (!global.ailtire.implementation.images) {
        global.ailtire.implementation.images = {};
    }
    if (isFile(apath)) {
        let normalizedBuild = {};
        let build = require(dir + '/' + 'build.js');
        // Check for contexts. If not there then create the default
        for (let iname in build) {
            let image = build[iname];
            if (!image.hasOwnProperty('contexts')) {
                let newimage = {
                    contexts: {
                        default: image
                    }
                };
                normalizedBuild[iname] = newimage;
            } else {
                normalizedBuild[iname] = image;
            }
            global.ailtire.implementation.images[image.tag] = {
                image: image,
                context: iname,
                pkg: pkg.shortname,
                basedir: dir,
                name: image.tag
            };
        }
        pkg.deploy.build = normalizedBuild;
    }

    // Now get the docker-compose file
    apath = path.resolve(dir + '/deploy.js');
    if (isFile(apath)) {
        let deploy = require(dir + '/' + 'deploy.js');
        if (deploy.hasOwnProperty('name')) {
            pkg.deploy.name = deploy.name;
        } else {
            pkg.deploy.name = pkg.shortname;
        }

        let contexts = deploy;
        if (deploy.hasOwnProperty('contexts')) {
            contexts = deploy.contexts;
        }

        for (let env in contexts) {
            // Now get the file from the deploy and read it in.
            let compose = {};
            if (!isFile(dir + '/' + contexts[env].file)) {
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({

                    type: 'environment.contexts',
                    object: {type: "Environment", id: env, name: env},
                    message: "Cloud not find envrionemt association type does not map to a model",

                    data: dir,
                    lookup: 'model/list'
                });
                // console.error(`Could not find ${env} file ${dir}/${contexts[env].file}`);
            } else {
                compose = YAML.load(dir + '/' + contexts[env].file);
            }
            let design = {};
            if (isFile(dir + '/' + contexts[env].design)) {
                let fext = contexts[env].design.split('.').pop();
                switch (fext) {
                    case 'yaml':
                        design = YAML.load(dir + '/' + contexts[env].design);
                        break;
                    case 'js':
                        design = require(dir + '/' + contexts[env].design);
                        break;
                    default:
                        console.error("Could not read the design of the service:", apath);
                        break;
                }
                normalizeStack(design);
            }
            pkg.deploy.envs[env] = {
                tag: `${pkg.deploy.name}:${env}`,
                definition: compose,
                file: contexts[env].file,
                design: design,
                pkg: pkg.name.replace(/\s/g, ''),
            };
            if (!global.hasOwnProperty('deploy')) {
                global.deploy = {envs: {}};
            }
            if (!global.deploy.envs.hasOwnProperty(env)) {
                global.deploy.envs[env] = {};
            }
            global.deploy.envs[env][pkg.deploy.name] = pkg.deploy.envs[env];
        }
    }
    return pkg;
};
const normalizeStack = (stack) => {
    // Add the default networks if needed
    if (!stack.networks.hasOwnProperty('parent')) {
        stack.networks.parent = {external: true, name: "Parent"};
    }
    if (!stack.networks.hasOwnProperty('children')) {
        stack.networks.children = {driver: "overlay", attachable: true, name: "Children"};
    }
    if (!stack.networks.hasOwnProperty('siblings')) {
        stack.networks.siblings = {driver: "overlay", name: "Siblings"};
    }
    // Go through the services and make sure networks are set coorectly.
    for (let sname in stack.services) {
        let service = stack.services[sname];
        if (service.type === 'stack') {
            if (service.networks) {
                if (service.networks.hasOwnProperty('children')) {
                    service.networks.children = {};
                }
            } else {
                service.networks = {children: {}};
            }
        }
        if (service.networks) {
            if (service.networks.hasOwnProperty('siblings')) {
                service.networks.siblings = {};
            }
        } else {
            service.networks = {siblings: {}};
        }
    }
}

const loadHandlers = (pkg, prefix, mDir) => {
    let handlers = {};
    if (!pkg.prefix) {
        pkg.prefix = prefix.toLowerCase();
    }
    let files = getFiles(mDir);
    for (let i in files) {
        let file = files[i].replace(/\\/g, '/');
        let aname = path.basename(file).replace('.js', '');
        let apath = prefix + '/' + aname;
        apath = apath.toLowerCase();
        if (!global.handlers.hasOwnProperty(aname)) {
            global.handlers[aname] = {name: aname, handlers: []};
        }
        let tempItem = require(file);
        for (let j in tempItem.handlers) {
            let handler = tempItem.handlers[j];
            global.handlers[aname].handlers.push(handler);
        }
        handlers[aname] = global.handlers[aname];
    }
    return handlers;
};

// These actions are from the models not the interface.
const loadActions = (pkg, prefix, mDir) => {
    let actions = {};
    if (!pkg.prefix) {
        pkg.prefix = prefix.toLowerCase();
    }
    let files = getFiles(mDir);
    for (let i in files) {
        let file = files[i].replace(/\\/g, '/');
        let aname = path.basename(file).replace('.js', '');
        let apath = prefix + '/' + aname;
        apath = apath.toLowerCase();
        global.actions[apath] = require(file);
        global.actions[apath].pkg = pkg;
        global.actions[apath].obj = pkg.name;
        actions[apath] = global.actions[apath];
    }
    let dirs = getDirectories(mDir);
    for (let i in dirs) {
        let dirname = path.basename(dirs[i]);
        if (!reservedDirs.hasOwnProperty(dirname) && dirname[0] != '.') {
            let apath = prefix + '/' + dirname;
            apath = apath.toLowerCase();
            sactions = loadActions(pkg, apath, dirs[i]);
            for (let aname in sactions) {
                actions[aname] = sactions[aname];
            }
        }
    }
    return actions;
};

const loadUCScenarios = (mUC, mDir) => {
    let files = getFiles(mDir);
    mUC.scenarios = {};
    for (let i in files) {
        let file = files[i].replace(/\\/g, '/');
        let scenarioName = path.basename(file).replace('.js', '');
        if (scenarioName !== 'index') {
            mUC.scenarios[scenarioName] = require(file);
            mUC.scenarios[scenarioName].uid = mUC.name.replace(/\s/g, '') + '.' + mUC.scenarios[scenarioName].name.replace(/\s/g, '');
        }
    }
};

const loadClassMethods = (mClass, mDir) => {
    let files = getFiles(mDir);
    mClass.definition.methods = {};
    for (let i in files) {
        let file = files[i].replace(/\\/g, '/');
        let methodname = path.basename(file).replace('.js', '');
        if (methodname !== 'index') {
            mClass.definition.methods[methodname] = require(file);
            mClass.prototype[methodname] = function (inputs) {
                return funcHandler.run(mClass.definition.methods[methodname], this, inputs);
            }
        }
    }
};
// Now read the directory and then traverse down each subdirectory that is not in the list above.
const loadDirectory = (dir, prefix) => {
    let dirs = getDirectories(dir);
    // Get the package definition from the index.js file.
    let pkg = require(dir + '/index.js');
    if (pkg.shortname) {
        prefix += '/' + pkg.shortname;
    }
    pkg.prefix = prefix.toLowerCase();
    pkg.dir = dir;
    for (let i in dirs) {
        let file = path.basename(dirs[i]);
        if (file[0] !== '.' && file !== 'node_modules') {
            if (reservedDirs.hasOwnProperty(file)) {
                reservedDirs[file](pkg, prefix, path.join(dir, file));
            } else {
                let subpackage = loadDirectory(path.join(dir, file), prefix);
                if (!pkg.hasOwnProperty('subpackages')) {
                    pkg.subpackages = {};
                }
                pkg.subpackages[subpackage.shortname] = subpackage;
            }
        }
    }
    let packageNameNoSpace = pkg.name.replace(/\s/g, '');
    global.packages[packageNameNoSpace] = new Proxy(pkg, packageProxy);
    return global.packages[packageNameNoSpace];
};

const checkWorkflows = (workflows) => {
    for (wname in workflows) {
        let workflow = workflows[wname];
        for (let aname in workflow.activities) {
            let activity = workflow.activities[aname];
            // Check if the activity name is a usecase, scenario, or other workflow.
            let anospace = aname.replace(/\s/g, '');
            if (aname !== "Init") {
                if (global.workflows.hasOwnProperty(aname)) {
                    activity.obj = global.workflows[anospace];
                    activity.type = "workflow";
                } else if (global.usecases.hasOwnProperty(anospace)) {
                    activity.obj = global.usecases[aname];
                    activity.type = "usecase";
                } else {
                    let found = false;
                    for (let uname in global.usecases) {
                        let uc = global.usecases[uname];
                        if (uc.scenarios.hasOwnProperty(anospace)) {
                            activity.obj = uc.scenarios[anospace];
                            activity.type = "scenario";
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        console.error(`Activity "${aname}" not found for workflow "${wname}"`);
                    }
                }
            }
            for(nname in activity.next) {
                let next = activity.next[nname];
                if(!workflow.activities.hasOwnProperty(nname)) {
                    console.error("Activity not found in the workflow:", nname, " for next activity in ", aname);
                }
            }
        }
    }
}
const checkDeployment = (deployments, images) => {
    let imageRepo = global.ailtire.implementation.images;
    // Make sure that every services has a valid image that can be built.
    for (let i in deployments.envs) {
        let env = deployments.envs[i];
        for (let j in env) {
            let stack = env[j];
            if (stack.design) {
                for (let k in stack.design.services) {
                    let service = stack.design.services[k];
                    let image = service.image
                    if (imageRepo.hasOwnProperty(image)) {
                        if (!imageRepo[image].hasOwnProperty('services')) {
                            imageRepo[image].services = {};
                        }
                        imageRepo[image].services[`${i}.${j}.${k}`] = service;
                    } else if (service.type != "stack") {
                        global.ailtire.error.push({
                            type: 'deploy.image',
                            object: {type: "Service", id: service.id, name: k},
                            message: "Image for Service not found!",
                            data: image,
                            lookup: 'service/list'
                        });
                        console.error("Image (", image, ") not found for Service:", k);
                    }
                }
            }
        }
    }
    // Iterate through all of the images and add their base images.
    let keys = Object.keys(global.ailtire.implementation.images);
    for (let i in keys) {
        let image = global.ailtire.implementation.images[keys[i]];
        if (image.image && image.image.file) {
            let apath = path.resolve(`${image.basedir}/${image.image.dir}/${image.image.file}`);
            try {
                if (fs.statSync(apath).isFile()) {
                    let str = fs.readFileSync(apath, 'utf8');
                    let lines = str.split('\n');
                    for (let i in lines) {
                        let line = lines[i];
                        if (line.includes('FROM')) {
                            let [from, base] = line.split(/\s/);
                            if (base) {
                                if (!global.ailtire.implementation.images.hasOwnProperty(base)) {
                                    global.ailtire.implementation.images[base] = {
                                        pkg: 'undefined',
                                        context: 'external',
                                        name: base,
                                        children: {}
                                    }
                                }
                                global.ailtire.implementation.images[base].children[image.name] = image;
                                image.base = base;
                            }
                        }
                    }
                }
            } catch (e) {
                global.ailtire.error.push({
                    type: 'build.image',
                    object: {type: "Image", id: image.image.tag, name: image.image.tag},
                    message: "Dockerfile for image is not found! " + apath,
                    data: image,
                    lookup: `implementation/image?id=${image.image.tag}`
                });
                console.error("Image (", image.image.tag, ") Docker File not found:", apath);
            }
        }
    }
}
const checkPackage = (pkg) => {
    // check the package for consistencies
    // Check the Depends
    let depends = [];
    for (let i in pkg.depends) {
        let depend = pkg.depends[i].replace(/\s/g, '');
        let dpkg;
        if (global.packages.hasOwnProperty(depend)) {
            dpkg = global.packages[depend];
            depends.push(dpkg);
        } else {
            if (!global.ailtire.hasOwnProperty('error')) {
                global.ailtire.error = [];
            }
            global.ailtire.error.push({
                type: 'package.depend',
                object: {type: "Package", id: pkg.id, name: pkg.name},
                message: "Package in Dependes not found",
                data: depend,
                lookup: 'package/list'
            });
            console.error("Package in Depends not found:", depend, " in ", pkg.name);
        }
    }
    pkg.depends = depends;
    // associations,
    // attributes.
    // Inheritance relationship check.
    for (let i in pkg.classes) {
        let cls = pkg.classes[i];
        if (cls.definition.hasOwnProperty('extends')) {
            if (global.classes.hasOwnProperty(cls.definition.extends)) {
                let parentCls = AClass.getClass(cls.definition.extends);
                if (!parentCls.definition.hasOwnProperty('subClasses')) {
                    parentCls.definition.subClasses = [];
                }
                parentCls.definition.subClasses.push(cls.definition.name);
                if (!cls.definition.hasOwnProperty('methods')) {
                    cls.definition.methods = {};
                }
                if (!cls.definition.hasOwnProperty('attributes')) {
                    cls.definition.attributes = {};
                }
                if (!cls.definition.hasOwnProperty('associations')) {
                    cls.definition.associations = {};
                }
                while (parentCls) {
                    for (let fname in parentCls.definition.methods) {
                        if (!cls.definition.methods.hasOwnProperty(fname)) {
                            cls.definition.methods[fname] = parentCls.definition.methods[fname];
                        }
                    }
                    for (let fname in parentCls.definition.attributes) {
                        if (!cls.definition.attributes.hasOwnProperty(fname)) {
                            cls.definition.attributes[fname] = parentCls.definition.attributes[fname];
                        }
                    }
                    for (let fname in parentCls.definition.associations) {
                        if (!cls.definition.associations.hasOwnProperty(fname)) {
                            cls.definition.associations[fname] = parentCls.definition.associations[fname];
                        }
                    }
                    if (parentCls.definition.hasOwnProperty('extends')) {
                        parentCls = AClass.getClass(parentCls.definition.extends);
                    } else {
                        parentCls = null;
                    }
                }
            } else {
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({
                    type: 'model.extends',
                    object: {type: "Model", id: cls.id, name: cls.name},
                    message: "Class Extends points to an unknown class",
                    data: cls.definition.extends,
                    lookup: 'model/list',
                });
                console.error(`Parent Class ${cls.definition.extends} is not defined!`);
            }
        }
    }

    // UseCase checker
    for (let i in pkg.usecases) {
        let usecase = pkg.usecases[i];
        checkUseCase(pkg, usecase);
    }
    // Event Emitter Checker.
    // Add an event to the package and to each class for the following
    // Every state in the state net
    // And the following builtin event
    // model.create
    // model.destroy
    // model.updated

    for (let i in pkg.classes) {
        let cls = pkg.classes[i];
        let ename = cls.definition.name.toLowerCase();
        let events = {
            'create': {
                name: `${ename}.create`,
                description: `When an object of type ${cls.definition.name} is created.`,
                emitter: cls,
                handlers: {}
            },
            'destroy': {
                name: `${ename}.destroy`,
                description: `When an object of type ${cls.definition.name} is destroyed.`,
                emitter: cls,
                handlers: {}
            },
            'updated': {
                name: `${ename}.updated`,
                description: `When an object of type ${cls.definition.name} has an attribute or association updated.`,
                emitter: cls,
                handlers: {}
            },
        }
        for (let sname in cls.statenet) {

            let state = cls.statenet[sname];
            desc = state.description || `When a ${cls.definition.name} moves into the ${sname} state.`;
            events[sname] = {name: `${ename}.${sname.toLowerCase()}`, description: desc, emitter: cls};
        }

        for (let evname in events) {
            let exname = ename + '.' + evname;
            if (!global.events.hasOwnProperty(exname)) {
                global.events[exname] = events[evname];
            }
            if (!pkg.events) {

                pkg.events = {};
            }
            pkg.events[exname] = global.events[exname];

        }
    }
    // Handler Checker
    // Create a new member that has the events that are emited from the Package.
    // Create a global struture to store the events.
    for (let i in pkg.handlers) {
        let handler = pkg.handlers[i];
        let ename = handler.name;
        if (!global.events.hasOwnProperty(ename)) {
            global.events[ename] = {
                handlers: {},
            }
        }
        // Find the emitter.
        // Event syntax is ClassName.event
        let cls = AClass.getClass(ename.split(/\./)[0]);
        if (cls) {
            handler.emitter = cls;
            global.events[ename].emitter = cls;
            if (!cls.definition.hasOwnProperty('messages')) {
                cls.definition.messages = {};
            }
            cls.definition.messages[ename] = global.events[ename];
            if (!cls.definition.package.definition) {
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({
                    type: 'model.definition',
                    object: {type: 'Model', id: cls.id, name: cls.name},
                    message: "Class parent package definitition has a problem",
                    data: cls.definition.package,
                    lookup: 'package/list',
                });
                console.error("Class Definition package problem");
                console.error(cls.definition.package);
            }
            if (!cls.definition.package.definition.hasOwnProperty('messages')) {
                cls.definition.package.definition.messages = {};
            }
            cls.definition.package.definition.messages[ename] = global.events[ename];
        }
        global.events[ename].handlers[pkg.prefix] = handler;
    }
    //
};
const checkUseCase = (pkg, usecase) => {
    // Make sure that there is an actor for the actors in a use case.
    for (let aname in usecase.actors) {
        let nsAname = aname.replace(/\s/g, '');
        if (!global.actors.hasOwnProperty(nsAname)) {
            apiGenerator.actor({name: aname}, global.appBaseDir + '/actors');
        }
        if (global.actors.hasOwnProperty(nsAname)) {
            if (!global.actors[nsAname].hasOwnProperty('usecases')) {
                global.actors[nsAname].usecases = {};
            }
            global.actors[nsAname].usecases[usecase.name.replace(/\s/g, '')] = usecase;
        }
    }

    // Make sure each UseCase has a method that matches an interface that exists.
    let actionName = usecase.method;
    // Relative path does not start with /
    // Convert it to an absolute path first.
    if (actionName[0] !== '/') {
        actionName = pkg.prefix + '/' + actionName;
    } else {
        let pkgs = pkg.prefix.split('/');
        let actions = actionName.split('/');
        let nactionpath = [];
        let i = 1;
        let j = 1;
        while (j < pkgs.length) {
            if (pkgs[j] !== actions[i]) {
                nactionpath.push(pkgs[j])
                j++;
            } else {
                while (i < actions.length) {
                    nactionpath.push(actions[i]);
                    i++;
                }
                j = pkgs.length;
            }
        }
        actionName = '/' + nactionpath.join('/');
    }
    actionName = actionName.toLowerCase();
    if (!actionName.includes(pkg.shortname.toLowerCase())) {
        // console.warn("Method is not part of the intreface!", actionName);
        if (!global.ailtire.hasOwnProperty('error')) {
            global.ailtire.error = [];
        }
        global.ailtire.error.push({
            type: 'usecase.method',
            object: {type: 'UseCase', id: usecase.id, name: usecase.name},
            message: "Usecase method is not an package interface",
            data: usecase.method,
            lookup: 'action/list',
        });
    } else {
        /*if (!global.actions.hasOwnProperty(actionName)) {
            console.warn("Action does not exist creating:", actionName, usecase.method);
            let aname = actionName.split(/\//).pop();
            let pathName = actionName.replace(pkg.prefix.toLowerCase(), '');
            apiGenerator.action({name: aname, path: pathName}, pkg.interfaceDir);
        }

         */
    }
    for (let i in usecase.scenarios) {
        let scenario = usecase.scenarios[i];
        checkScenario(pkg, scenario);
    }
    // Extends is used primarily for aggregation. Sub use cases of a super use case.
    let newExtends = {};
    for (let i in usecase.extends) {
        let pusecaseName = usecase.extends[i].replace(/\s/g, '');
        if (global.usecases.hasOwnProperty(pusecaseName)) {
            let pusecase = global.usecases[pusecaseName];
            newExtends[pusecaseName] = pusecase;
            if (!pusecase.hasOwnProperty('extended')) {
                pusecase.extended = {};
            }
            pusecase.extended[usecase.name.replace(/\s/g, '')] = usecase;
        } else {
            if (!global.ailtire.hasOwnProperty('error')) {
                global.ailtire.error = [];
            }
            global.ailtire.error.push({
                type: 'usecase.extend',
                object: {type: 'UseCase', id: usecase.id, name: usecase.name},
                message: "Could not find the extend Usecase:",
                data: usecase.extends,
                lookup: 'usecase/list',
            });
            console.error("Could not find extend UseCase:", usecase.extends[i], " for ", usecase.name);
        }
    }
    // This is causing a circular dependency in the memory tree.
    // usecase.extends = newExtends;

    // Includes is used primarily for dependency between use cases.
    let newIncludes = {};
    for (let i in usecase.includes) {
        let pusecaseName = usecase.includes[i].replace(/\s/g, '');
        if (global.usecases.hasOwnProperty(pusecaseName)) {
            let pusecase = global.usecases[myUC.name.replace(/\s/g, '')];
            newIncludes[pusecaseName] = pusecase;
            if (!pusecase.hasOwnProperty('included')) {
                pusecase.included = {};
            }
            pusecase.included[usecase.name.replace(/\s/g, '')] = usecase;
        } else {
            if (!global.ailtire.hasOwnProperty('error')) {
                global.ailtire.error = [];
            }
            global.ailtire.error.push({
                type: 'usecase.includes',
                object: {type: "Package", id: pkg.id, name: pkg.name},
                message: "Usecase includes use case not found.",
                data: pusecaseName,
                lookup: 'usecase/list'
            });
            console.error("Could not find included UseCase:", usecase.extends[i], " for ", usecase.name);
        }
    }
    // This is causing a circular dependency in the memory tree.
    // usecase.includes = newIncludes;
};
const checkScenario = (pkg, scenario) => {
    // Make sure that there is an actor for the actors in a use case.
    for (let aname in scenario.actors) {
        let nsAname = aname.replace(/\s/g, '');
        if (!global.actors.hasOwnProperty(nsAname)) {
            apiGenerator.actor({name: aname}, global.appBaseDir + '/actors');
        }
        if (!global.actors[nsAname].hasOwnProperty('scenarios')) {
            global.actors[nsAname].scenarios = {};
        }
        global.actors[nsAname].scenarios[scenario.name.replace(/\s/g, '')] = scenario;
    }

    // Make sure each UseCase has a method that matches an interface that exists.
    let actionName = scenario.method;
    // Relative path does not start with /
    // Convert it to an absolute path first.
    if (actionName[0] !== '/') {
        actionName = pkg.prefix + '/' + actionName;
    } else {
        let pkgs = pkg.prefix.split('/');
        let actions = actionName.split('/');
        let nactionpath = [];
        let i = 1;
        let j = 1;
        while (j < pkgs.length) {
            if (pkgs[j] !== actions[i]) {
                nactionpath.push(pkgs[j])
                j++;
            } else {
                while (i < actions.length) {
                    nactionpath.push(actions[i]);
                    i++;
                }
                j = pkgs.length;
            }
        }
        actionName = '/' + nactionpath.join('/');
    }
    actionName = actionName.toLowerCase();
    if (!actionName.includes(pkg.shortname.toLowerCase())) {
        if (!global.ailtire.hasOwnProperty('error')) {
            global.ailtire.error = [];
        }
        global.ailtire.error.push({
            type: 'scenario.method',
            object: {type: "Scenario", id: scenario, name: scenario},
            message: "Scenario method is not found.",
            data: actionName,
            lookup: 'action/list'
        });
        // console.warn("Method is not part of the intreface!", actionName);
    } else {
        if (!global.actions.hasOwnProperty(actionName)) {
            console.warn("Action does not exist creating:", actionName, scenario.method);
            let aname = actionName.split(/\//).pop();
            let pathName = actionName.replace(pkg.prefix.toLowerCase(), '');
            apiGenerator.action({name: aname, path: pathName}, pkg.interfaceDir);
        }
    }
};
const loadActors = (dir, prefix) => {
    let actors = getDirectories(dir);
    if (!global.hasOwnProperty('actors')) {
        global.actors = {};
    }
    for (let i in actors) {
        let actorDir = actors[i];
        if (!actorDir.includes('\\doc') && !actorDir.includes('\/doc')) {
            let actor = require(actorDir + '/index.js');
            global.actors[actor.name.replace(/\s/g, '')] = actor;
            actor.dir = actorDir;
            loadDocs(actor, actorDir + '/doc');
        }
    }
};
////////////////////////
// Include file format
// module.export = {
//  models: [
//      '../../cpl/Agent',
//      '../../../diml/dm/BluePrint',
//  ]
// }
const processModelIncludefile = (prefix, dir) => {
    // First check if there is an includes.js file.
    // If there is then process the includes.js file to import the classes into the global namespace.
    if (fs.existsSync(dir + '/include.js')) {
        let include = require(dir + '/include.js');

        for (let i in include.models) {
            let file = include.models[i];

            let incModelFile = findIncludeFile(dir, file);

            let pkgFile = path.resolve(incModelFile + '../../../../index.js');
            if (fs.existsSync(incModelFile) && fs.existsSync(pkgFile)) {
                // Load the package first into the global namespace
                let pkg = require(pkgFile);
                let packageNameNoSpace = pkg.name.replace(/\s/g, '');
                if (!global.packages.hasOwnProperty(packageNameNoSpace)) {
                    pkg.classes = {};
                    if (!pkg.prefix) {
                        if (pkg.shortname) {
                            prefix = '/' + pkg.shortname;
                        }
                        pkg.prefix = prefix.toLowerCase();
                    }
                    global.packages[packageNameNoSpace] = new Proxy(pkg, packageProxy);
                }
                pkg = global.packages[packageNameNoSpace];

                let myClass = require(incModelFile);


                myClass.package = global.packages[packageNameNoSpace];
                if (global.classes.hasOwnProperty(myClass.definition.name)) {
                    let myProxy = global.classes[myClass.definition.name];
                    pkg.classes[myClass.definition.name] = myProxy;
                    global[myClass.definition.name] = myProxy;
                    console.error('Class Already defined', myClass.definition.name, "in this model:");
                } else {
                    let myProxy = new Proxy(myClass, classProxy);
                    pkg.classes[myClass.definition.name] = myProxy;
                    global.classes[myClass.definition.name] = myProxy;
                    global[myClass.definition.name] = myProxy;
                }
                loadDocs(myClass, path.resolve(incModelFile + '/../doc'));
                loadClassMethods(myClass, path.resolve(incModelFile + '/..'));
            } else {
                // let apath = path.resolve(file);
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({
                    type: 'package.includesFile',
                    object: {type: "Package", id: pkgFile, name: pkgFile},
                    message: "Model not found in package includes.js file",
                    data: incModelFile,
                    lookup: 'model/list'
                });
                console.error("Could not find Model:", file, "in include file for ", dir);
            }
        }
    }
}

const findIncludeFile = (dir, file) => {
    // Look in a relative path
    let filename = path.resolve(dir + file + '/index.js');
    if (fs.existsSync(filename)) {
        return filename;
    }
    // Look in an absolute path
    if (fs.existsSync(file + '/index.js')) {
        return file + '/index.js';
    }
    // Look for the top directory up to api directory
    let dirs = dir.split(/[\/\\]/);
    while (1) {
        let topdir = dirs.pop();
        if (topdir === 'api') {
            dirs.push('api');
            let dirname = dirs.join('/');
            let pNames = file.split(/[\/\\\.]/);
            let cName = pNames.pop();
            let filename = path.resolve(dirname + '/' + pNames.join('/') + '/models/' + cName + '/index.js');
            if (fs.existsSync(filename)) {
                return filename;
            }
            break;
        }
    }
    return null;
};

