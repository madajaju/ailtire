const fs = require('fs');
const path = require('path');
const topProxy = require('../../../src/Proxy/ClassProxy');

// First look load the index file as the name of the top subsystem.

const top = require('./index.js');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);
const classes = {};

let reservedDirs = {
    interface: function (package, dir) {
        // The Interface directory can be multiple directories deep which map to routes A/B/C
        let files = getFiles(dir);
        let dirs = getDirectories(dir);
    },
    models: function (package, dir) {
        // This stores the packages classes.
        package.classes = {};
        let models = getDirectories(dir);
        for (let i in models) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let modelDir = models[i];
            let model = path.basename(modelDir);

            let myClass = require('./' + modelDir + '/index.js');

            myClass.package = package;
            if (classes.hasOwnProperty(myClass.definition.name)) {
                console.error('Class Already defined', myClass.definition.name, "in this model:", modelDir);
                throw new Error('Class Already defined', myClass.definition.name, "in this model:", modelDir);
            } else {
                let myProxy = new Proxy(myClass, topProxy);
                package.classes[myClass.definition.name] = myProxy;
                classes[myClass.definition.name] = myProxy;
                global[myClass.definition.name] = myProxy;
            }
            loadClassMethods(myClass, modelDir);
        }
    },
    usecases: function (package, dir) {
        package.usecases = {};
        let usecases = getDirectories(dir);
        for (let i in usecases) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let ucDir = usecases[i];
            let model = path.basename(ucDir);

            let myUC = require('./' + ucDir + '/index.js');
            myUC.package = package;
            package.usecases[myUC.name] = myUC;
            loadUCScenarios(myUC, ucDir);
        }
    }
};
const loadUCScenarios = (mUC, mDir) => {
    let files = getFiles(mDir);
    mUC.scenarios = {};
    for (let i in files) {
        let file = './' + files[i].replace(/\\/g, '/');
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
        let file = './' + files[i].replace(/\\/g, '/');
        let methodname = path.basename(file).replace('.js', '');
        if (methodname !== 'index') {
            console.log("MethodName:", methodname);
            mClass.definition.methods[methodname] = require(file);
        }
    }
};
// Now read the directory and then traverse down each subdirectory that is not in the list above.
const loadDirectory = dir => {
    let dirs = getDirectories(dir);
    // Get the package definition from the index.js file.
    let package = require('./' + dir + '/index.js');

    for (let i in dirs) {
        let file = path.basename(dirs[i]);
        if (reservedDirs.hasOwnProperty(file)) {
            reservedDirs[file](package, path.join(dir, file));
        } else {
            let subpackage = loadDirectory(path.join(dir, file));
            if (!package.hasOwnProperty('subpackage')) {
                package.subpackage = {};
            }
            package.subpackage[subpackage.shortname] = subpackage;
        }
    }
    return package;
};

const checkPackage = package => {
    // check the package for consistencies
    // associations,
    // attributes.
};
const processDirectory = dir => {
    let package = loadDirectory(dir);
    checkPackage(package);
    return package;
};

let package = processDirectory('.');

DataReference.load({scope:"Here I am", name:"MyName"});
let myData = new DataReference();
myData.access = "MyConnection";
myData.load("myData", myData);
