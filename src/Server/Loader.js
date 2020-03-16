const fs = require('fs');
const path = require('path');
const classProxy = require('../Proxy/ClassProxy');
const packageProxy = require('../Proxy/PackageProxy');
const apiGenerator = require('../Documentation/api');

module.exports = {
    processPackage: (dir) => {
        global.actors = {};
        global.actions = {};
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

const processDirectory = dir => {
    // Check the actors first
    let actorDir = dir + '/actors';
    loadActors(actorDir, '');

    // Now check the system api directory
    let apiDir = dir + '/api';
    // const top = require(apiDir + '/index.js');
    return loadDirectory(apiDir, '');
};
// First look load the index file as the name of the top subsystem.


const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

let reservedDirs = {
    interface: function (pkg, prefix, dir) {
        // The Interface directory can be multiple directories deep which map to routes A/B/C
        pkg.interfaceDir = dir;
        pkg.interface = loadActions(pkg, prefix, dir);
    },
    models: function (pkg, prefix, dir) {
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
                throw new Error('Class Already defined'+ myClass.definition.name+ "in this model:"+ modelDir);
            } else {
                let myProxy = new Proxy(myClass, classProxy);
                pkg.classes[myClass.definition.name] = myProxy;
                global.classes[myClass.definition.name] = myProxy;
                global[myClass.definition.name] = myProxy;
            }
            loadClassMethods(myClass, modelDir);
        }
    },
    usecases: function (pkg, prefix, dir) {
        pkg.usecases = {};
        let usecases = getDirectories(dir);
        for (let i in usecases) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let ucDir = usecases[i];
            let model = path.basename(ucDir);

            let myUC = require(ucDir + '/index.js');
            myUC.package = pkg.name;
            pkg.usecases[myUC.name] = myUC;
            loadUCScenarios(myUC, ucDir);
        }
    }
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
        if (dirname !== 'interface' && dirname !== 'models' && dirname !== 'usecases') {
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

    for (let i in dirs) {
        let file = path.basename(dirs[i]);
        if (reservedDirs.hasOwnProperty(file)) {
            if(pkg.shortname) {
                prefix += '/' + pkg.shortname;
            }
            reservedDirs[file](pkg, prefix, path.join(dir, file));
        } else {
            let myPrefix = prefix;
            if(pkg.shortname) {
                myPrefix += '/' + pkg.shortname;
            }
            let subpackage = loadDirectory(path.join(dir, file), myPrefix);
            if (!pkg.hasOwnProperty('subpackages')) {
                pkg.subpackages = {};
            }
            pkg.subpackages[subpackage.shortname] = subpackage;
        }
    }
    let packageNameNoSpace = pkg.name.replace(/ /g, '');
    global.packages[packageNameNoSpace] = new Proxy(pkg, packageProxy);
    return global.packages[packageNameNoSpace];
};

const checkPackage = (pkg) => {
    // check the package for consistencies
    // associations,
    // attributes.
    // Inheritance relationship check.
    for(let i in pkg.classes) {
        let cls = pkg.classes[i];
        if(cls.definition.hasOwnProperty('extends')) {
            if(global.classes.hasOwnProperty(cls.definition.extends)) {
                let parentCls = global.classes[cls.definition.extends];
                if(!parentCls.definition.hasOwnProperty('subClasses')) {
                    parentCls.definition.subClasses =[];
                }
                parentCls.definition.subClasses.push(cls.definition.name);
            }
            else {
                console.error(`Parent Class ${cls.definition.extends} is not defined!`);
            }
        }
    }

    // UseCase checker
    for (let i in pkg.usecases) {
        let usecase = pkg.usecases[i];
        // Make sure that there is an actor for the actors in a use case.
        for (let aname in usecase.actors) {
            if (!global.actors.hasOwnProperty(aname)) {
                apiGenerator.actor({name: aname}, global.appBaseDir + '/actors');
            }
            if(!global.actors[aname].hasOwnProperty('usecases')) {
                global.actors[aname].usecases = {};
            }
            global.actors[aname].usecases[usecase.name] = usecase;
        }

        // Make sure each UseCase has a method that matches an interface that exists.
        let actionName = usecase.method;
        // Relative path does not start with /
        // Convert it to an absolute path first.
        if (actionName[0] !== '/') {
            actionName = pkg.prefix + '/' + actionName;
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
    }
};

const loadActors = (dir, prefix) => {
    let files = getFiles(dir);
    if (!global.hasOwnProperty('actors')) {
        global.actors = {};
    }
    for (let i in files) {
        let actor = require(files[i]);
        global.actors[actor.name] = actor;
    }
};
