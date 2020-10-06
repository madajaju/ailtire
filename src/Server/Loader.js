const fs = require('fs');
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
        global.appBaseDir = dir;
        global.topPackage = processDirectory(dir);
        for (let i in global.packages) {
            checkPackage(global.packages[i]);
        }
        return global.topPackage;
    }
};

const analyzeApp = app => {

    // analyzeClasses
    analyzeClasses(global.classes);
    // analyzePackages
    // analyzePackages(global.packages);
    // analyzeEvents
    // analyzeEvents(global.events);
    // analyzeActions
    // analyzeActions(global.actions);
    // analyzeHandlers
    // analyzeHandlers(global.handlers);
}
const analyzeClasses = classes => {
    // go through each association and set the dependant map on the type of the association.
    for(let i in classes) {
        let cls = classes[i];
        let assocs = cls.definition.associations
        for(let j in assocs) {
            let assoc = assocs[j];
            let aType = assoc.type;
            if(global.classes.hasOwnProperty(aType)) {
                let gcls = global.classes[aType];
                if(!gcls.definition.hasOwnProperty('dependant')) {
                    gcls.definition.dependant = [];
                }
                let d = {model: cls.definition, assoc:assoc}
                d.assoc.name = j;
                gcls.definition.dependant.push(d);
            } else {
                console.error("Type does not map to a class:", aType);
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
        pkg.classes = {};
        let models = getDirectories(dir);
        for (let i in models) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let modelDir = models[i];
            // let model = path.basename(modelDir);

            let myClass = require(modelDir + '/index.js');

            myClass.package = pkg;
            if (global.classes.hasOwnProperty(myClass.definition.name)) {
                console.error('Class Already defined', myClass.definition.name, "in this model:", modelDir);
                throw new Error('Class Already defined' + myClass.definition.name + "in this model:" + modelDir);
            } else {
                let myProxy = new Proxy(myClass, classProxy);
                pkg.classes[myClass.definition.name] = myProxy;
                global.classes[myClass.definition.name] = myProxy;
                global[myClass.definition.name] = myProxy;
            }
            loadDocs(myClass, modelDir + '/doc');
            loadClassMethods(myClass, modelDir);
        }
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
            pkg.usecases[myUC.name.replace(/\s/g, '')] = myUC;
            loadDocs(myUC, ucDir + '/doc');
            loadUCScenarios(myUC, ucDir);
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
    if (isFile(apath)) {
        let build = require(dir + '/' + 'build.js');
        pkg.deploy.build = build;
    }

    // Now get the docker-compose file
    apath = path.resolve(dir + '/deploy.js');
    if (isFile(apath)) {
        let deploy = require(dir + '/' + 'deploy.js');
        let contexts = deploy;
        if(deploy.hasOwnProperty('contexts')) { contexts = deploy.contexts; }

        for (let env in contexts) {
            // Now get the file from the deploy and read it in.
            let compose = YAML.load(dir + '/' + contexts[env].file);
            pkg.deploy.envs[env] = {
                tag: contexts[env].tag,
                definition: compose
            };
        }
    }
    return pkg;
};

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
            let action = null;
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

    for (let i in dirs) {
        let file = path.basename(dirs[i]);
        if (file[0] != '.' && file != 'node_modules') {
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
                    cls.definition.methods = {};
                }
                if (!cls.definition.hasOwnProperty('associations')) {
                    cls.definition.methods = {};
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
                console.error(`Parent Class ${cls.definition.extends} is not defined!`);
            }
        }
    }

    // UseCase checker
    for (let i in pkg.usecases) {
        let usecase = pkg.usecases[i];
        checkUseCase(pkg, usecase);
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
            if (!cls.definition.package.definition.hasOwnProperty('messages')) {
                cls.definition.package.definition.messages = {};
            }
            cls.definition.package.definition.messages[ename] = global.events[ename];
        }
        global.events[ename].handlers[pkg.prefix] = handler;
    }
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
    } else {
        if (!global.actions.hasOwnProperty(actionName)) {
            console.warn("Action does not exist creating:", actionName, usecase.method);
            let aname = actionName.split(/\//).pop();
            let pathName = actionName.replace(pkg.prefix.toLowerCase(), '');
            apiGenerator.action({name: aname, path: pathName}, pkg.interfaceDir);
        }
    }
    for(let i in usecase.scenarios) {
        let scenario = usecase.scenarios[i];
        checkScenario(pkg, scenario);
    }
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
        let actor = require(actorDir + '/index.js');
        global.actors[actor.name.replace(/\s/g, '')] = actor;
        loadDocs(actor, actorDir + '/doc');
    }
};
