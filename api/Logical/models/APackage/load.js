const path = require('path');
const helper = require('../../../../src/utils/helper');
const classProxy = require("../../../../src/Proxy/ClassProxy");
const packageProxy = require("../../../../src/Proxy/PackageProxy");
const fs = require("fs");

const isDirectory = source => fs.existsSync(source) && fs.lstatSync(source).isDirectory();
const isFile = source => fs.existsSync(source) && !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

let dirOrder = [ 'models', 'interface', 'handlers', 'usecases', 'workflows', 'deploy' ];

let reservedDirs = {
    actors: (package, prefix, dir) => {
        AActor.loadAll(dir);
    },
    node_modules: (package, prefix, dir) => {
        // Do Nothing.
        // Just skip
    },
    doc: (package, prefix, dir) => {
        APackage.loadDocs(package, dir);
    },
    deploy: (package, prefix, dir) => {
    //    package = ADeployment.load(package, prefix, dir);
    }, handlers: (package, prefix, dir) => {
        // The Interface directory can be multiple directories deep which map to routes A/B/C
        // package.handlers = AHandler.loadAll(package, prefix, dir);
    },
    interface: (package, prefix, dir) => {
        //The Interface directory can be multiple directories deep which map to routes A/B/C
        AInterface.loadAll({package:package});
    },
    models: (package, prefix, dir) => {
        package.classes = {};
        AClass.loadAll({dir:dir,package:package});
    },
    workflows: (package, prefix, dir) => {
        package.workflows = {};
        if(global.AWorkflow) {
            AWorkflow.loadAll({dir: dir, package: package});
        }
    },
    usecases: (package, prefix, dir) => {
        package.usecases = {};
        //AUseCase.loadAll({dir:dir,package:package});
    }
};

module.exports = {
    friendlyName: 'load',
    description: 'Load a package from the directory',
    static: true,
    inputs: {
        dir: {
            description: 'Package Directory to load the Package definition',
            type: 'string',
            required: true
        },
        prefix: {
            description: 'Prefix of the package',
            type: 'string',
        }
    },
    outputs: {
        type: "APackage",
        description: "The package object loaded.",
    },

    exits: {
    },

    fn: function (inputs, env) {
        // Get the package definition from the index.js file.
        const dir = inputs.dir;
        if(!fs.existsSync(dir + '/index.js')) {
            console.error("Missing index.js, Not processing:", dir);
            return;
        }
        
        const pkgDetails = require(dir + '/index.js');
        let prefix = inputs.prefix || "";

        let dirs = getDirectories(dir);
        pkgDetails.prefix = prefix + '/' + pkgDetails.shortname;
        pkgDetails.dir = dir;
        pkgDetails.uid = prefix.replace(/\//, '.');

        let package = new APackage(pkgDetails);
        for (let i in dirs) {
            let file = path.basename(dirs[i]);
            if (file[0] !== '.' && file !== 'security') {
                if (!reservedDirs.hasOwnProperty(file)) {
                    let subpackage = APackage.load({dir: path.join(dir, file), prefix: prefix});
                    package.addToSubPackages(subpackage);
                }
            }
        }
        let packageNameNoSpace = package.name.replace(/\s/g, '');
        global.packages[packageNameNoSpace] = package;
        for(let i in dirOrder) {
            let rdir = path.resolve(dir, dirOrder[i]);
            if(fs.existsSync(rdir)) {
                reservedDirs[dirOrder[i]](package, prefix, rdir);
            }
        }
        return global.packages[packageNameNoSpace];
    }
};

