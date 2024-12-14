const fs = require('fs');
const funcHandler = require('../Proxy/MethodProxy');
const path = require('path');
const classProxy = require('../Proxy/ClassProxy');
const packageProxy = require('../Proxy/PackageProxy');
const apiGenerator = require('../Documentation/api');
const YAML = require('yamljs');
const AClass = require('./AClass');
const AActor = require('./AActor');
const AHandler = require('./AHandler');
const AActivityInstance = require("./AActivityInstance");

module.exports = {
    analyze: (pkg) => {
        analyzeApp(pkg);
    },
    processPackage: (dir) => {
        if (!global.ailtire) {
            global.ailtire = {
                config: {'baseDir': dir}
            }
        }
        global.actors = {};
        global.actions = global.actions || {}; // Allow actions to be added programattically
        global.events = {};
        global.environments = global.enivornments || {};
        global.handlers = _initHandlers();
        global.classes = {};
        global.packages = {};
        global.topPackage = {};
        global.usecases = {};
        global.workflows = global.workflows || {};
        global.appBaseDir = dir;
        global.topPackage = processDirectory(dir);
        _processModelIncludeFiles();
        _loadWorkflowInstances();
        // await _loadNotes();
        return global.topPackage;
    },
    checkPackages: () => {
    }

};

const _loadNotes = async () => {
    return null;
    try {
        const {default: ANote} = await import('./ANote.mjs');
        ANote.loadDirectory(path.resolve('./.notes'));
        global.notes = ANote.list();
        return global.notes;
    } catch (e) {
        console.error("_loadNotes Error:", e);
    }
}

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
        AActor.loadAll(actorDir);
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
    let physicalDir = dir + '/physical';
    if (isDirectory(physicalDir)) {
        loadPhysical(pkg, pkg.prefix, physicalDir);
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
        AActor.loadAll(dir);
    }, node_modules: (pkg, prefix, dir) => {
        // Do Nothing.
        // Just skip
    }, doc: (pkg, prefix, dir) => {
        loadDocs(pkg, dir);
    }, deploy: (pkg, prefix, dir) => {
        pkg = loadDeploy(pkg, prefix, dir);
    }, handlers: (pkg, prefix, dir) => {
        // The Interface directory can be multiple directories deep which map to routes A/B/C
        pkg.handlers = loadHandlers(pkg, prefix, dir);
    }, interface: (pkg, prefix, dir) => {
        //The Interface directory can be multiple directories deep which map to routes A/B/C
        pkg.interfaceDir = dir;
        pkg.interface = loadActions(pkg, prefix, dir);
    }, models: (pkg, prefix, dir) => {
        // This stores the pkg classes.
        // Process the Model Include Files
        pkg.classes = {};
        pkg.includes = {};
        let models = getDirectories(dir);
        for (let i in models) {
            // let modelDir = models[i].replace(/\\/g,'/');
            let modelDir = models[i];
            // let model = path.basename(modelDir);
            AClass.load(pkg, modelDir);
        }
    }, workflows: (pkg, prefix, dir) => {
        loadWorkflows(pkg, "", dir);
    }, usecases: (pkg, prefix, dir) => {
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
        let category = {};
        let workflows = [];
        let files = getFiles(dir);
        for (let i in files) {
            let file = files[i];
            let ext = path.extname(file);
            if (file.includes('index.js')) {
                category = require(file);
            } else if (ext === '.js') {
                let workflow = require(file);
                workflow.baseDir = dir;
                pkg.workflows[workflow.name] = workflow;
                workflow.pkg = pkg.shortname;
                workflow.category = prefix;
                if (!global.hasOwnProperty('workflows')) {
                    global.workflows = {};
                }
                if (!global.workflows.hasOwnProperty(workflow.name)) {
                    let anospace = workflow.name.replace(/\s/g, '');
                    global.workflows[anospace] = workflow;
                } else {
                    console.error("Workflow already defined:", workflow.name);
                }
                workflows.push(workflow);
            }
        }
        category.prefix = prefix;
        category.baseDir = dir;
        category.subcategories = [];
        category.workflows = workflows;
        let dirs = getDirectories(dir);
        for (let i in dirs) {
            let mdir = dirs[i];
            let mprefix = path.basename(mdir);
            if (mprefix !== 'doc') {
                if (prefix) {
                    mprefix = `${prefix}/${mprefix}`;
                }
                let subcategory = loadWorkflows(pkg, mprefix, mdir);
                category.subcategories.push(subcategory);
            }
        }
        let shortName = path.basename(dir);
        if (!global.categories) {
            global.categories = {};
        }
        global.categories[shortName] = category;
        return category;
    }
};
const loadDocs = (pkg, dir) => {
    /* const { default: ADocumentation } = await import("./ADocumentation.mjs");
     ADocumentation.load(pkg, dir);

     */
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

const _loadPhysicalModules = (obj, prefix, dir, files) => {
    for (let i in files) {
        let file = files[i];
        let fpath = path.resolve(`${dir}/${file}`);
        if (isDirectory(fpath)) {
            let dfiles = fs.readdirSync(fpath);
            _loadPhysicalModules(obj, prefix + file + '/', fpath, dfiles);
        } else {
            if (path.extname(file) === ".js") {
                let module = require(fpath);
                obj[prefix + file.replace('.js', '')] = module;
            }
        }
    }
    return obj;
}

const _loadEnvironments = (obj, prefix, dir, files) => {
    for (let i in files) {
        let file = files[i];
        let fpath = path.resolve(`${dir}/${file}`);
        if (isDirectory(fpath)) {
            let dfiles = fs.readdirSync(fpath);
            _loadEnvironments(obj, prefix + file + '/', fpath, dfiles);
        } else {
            if (path.extname(file) === ".js") {
                let environment = require(fpath);
                obj[prefix + file.replace('.js', '')] = environment;
            }
        }
    }
}

const _getPhysicalModule = (pkg, resource, moduleName) => {
    if (pkg.physical.modules.hasOwnProperty(moduleName)) {
        return pkg.physical.modules[moduleName];
    }
    if (global.physical.modules.hasOwnProperty(moduleName)) {
        return global.physical.modules[moduleName];
    }
    throw new Error("Type Not Found");

}

const _checkPhysicalResourceTypes = (pkg, obj, path) => {

    for (let name in obj) {
        let item = obj[name];
        if (typeof item === 'object') {
            _checkPhysicalResourceTypes(pkg, item, `${path}/${name}`)
        } else if (name === 'type') {
            try {
                let module = _getPhysicalModule(pkg, obj, item);
                obj._module = module;
            } catch (e) {
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({
                    type: 'physical.module',
                    object: {type: "Environment", id: pkg.id, name: item},
                    message: `Could not find the physical type: ${item} for ${path}`,
                    data: obj,
                    lookup: 'physical/module/list'
                });
                console.error(`Could not find the physical type: ${item} for ${path}`);
            }
        }
    }
}

const _checkLocations = (pkg, obj) => {
    let locations = {};
    for (let ename in obj.environments) {
        let defaultLocation = "";
        let environment = obj.environments[ename];
        if (!environment.locations) {
            console.warn("No Locations found for environment: ", ename)
            global.ailtire.error.push({
                type: 'environment.location',
                object: {type: "location", id: ename, name: ename},
                message: "Location not found for environment: " + ename,
                data: environment,
                lookup: 'location/list'
            });
        } else {
            for (let lname in environment.locations) {
                let location = environment.locations[lname];
                location.name = lname;
                // Location does not exist create it.
                if (!locations.hasOwnProperty(lname)) {
                    locations[lname] = {};
                    location.name = lname;
                    for (let i in location) {
                        locations[lname][i] = location[i];
                    }
                    locations[lname].environments = [];
                }
                locations[lname].environments.push(ename);
                if (location.default) {
                    defaultLocation = lname;
                }
            }
            // Now traverse the network, storage, and compute devices. Make sure the location matches one of these. If
            // there is not a location assigned then assign it to the defaultLocation.
            for (let dname in environment.network?.devices) {
                let device = environment.network?.devices[dname];
                if (!device.location) {
                    device.location = defaultLocation;
                }
                if (!environment.hasOwnProperty(locations)) {
                }
                if (typeof device.location !== 'object' && !environment.locations.hasOwnProperty(device.location)) {
                    console.warn("Location not found for network device: ", dname)
                    global.ailtire.error.push({
                        type: 'environment.location',
                        object: {type: "location", id: device.location, name: device.location},
                        message: "Location not found for network device: " + dname,
                        data: device,
                        lookup: 'location/list'
                    });
                }
            }
            for (let dname in environment.compute) {
                let device = environment.compute[dname];
                if (!device.location) {
                    device.location = defaultLocation;
                }

                if (typeof device.location !== 'object' && !environment.locations.hasOwnProperty(device.location)) {
                    console.warn("Location not found for compute device: ", dname, device.location)
                    global.ailtire.error.push({
                        type: 'environment.location',
                        object: {type: "location", id: device.location, name: device.location},
                        message: "Location not found for compute device: " + dname,
                        data: device,
                        lookup: 'location/list'
                    });
                }
            }
            for (let dname in environment.storage) {
                let device = environment.storage[dname];
                if (!device.location) {
                    device.location = defaultLocation;
                }
                if (typeof device.location !== 'object' && !environment.locations.hasOwnProperty(device.location)) {
                    console.warn("Location not found for storage device: ", dname)
                    global.ailtire.error.push({
                        type: 'environment.location',
                        object: {type: "location", id: lname, name: lname},
                        message: "Location not found for storage device: " + dname,
                        data: device,
                        lookup: 'location/list'
                    });
                }
            }
        }
    }

}
const _checkNetworks = (pkg, obj) => {
    for (let ename in obj.environments) {
        // Check that each network has a switch or router cooresponding.
        // Check that each device in compute and storage has a network cooresponding.

        let environment = obj.environments[ename];
        let networks = environment.network.networks;
        for (let dname in environment.network.devices) {
            let device = environment.network.devices[dname];
            if (!device.networks || device.networks.length < 1) {
                console.warn("No Networks found for network device: ", dname, ename);
                global.ailtire.error.push({
                    type: 'environment.network',
                    object: {type: "network", id: dname, name: dname},
                    message: "Location not found for network device: " + dname,
                    data: device,
                    lookup: 'network/list'
                });
            }
            for (let i in device.networks) {
                let nname = device.networks[i];
                if (!networks.hasOwnProperty(nname)) {
                    console.warn("Network not found for network device: ", dname, nname)
                    global.ailtire.error.push({
                        type: 'environment.network',
                        object: {type: "network", id: nname, name: nname},
                        message: "Location not found for storage device: " + nname,
                        data: device,
                        lookup: 'network/list'
                    });
                } else {
                    networks[nname].hosted = true;
                }
            }
        }
        for (let nname in networks) {
            let network = networks[nname];
            if (!network.hosted) {
                console.warn("Network not host by a network device: ", nname)
                global.ailtire.error.push({
                    type: 'environment.network',
                    object: {type: "network", id: nname, name: nname},
                    message: "Network not hosted by network device: " + nname,
                    data: network,
                    lookup: 'network/list'
                });
            }
        }
        for (let dname in environment.compute) {
            let device = environment.compute[dname];
            if (!device.networks || device.networks.length < 1) {
                console.warn("No Networks found for storage device: ", dname, ename);
                global.ailtire.error.push({
                    type: 'environment.network',
                    object: {type: "network", id: dname, name: dname},
                    message: "Location not found for storage device: " + dname,
                    data: device,
                    lookup: 'network/list'
                });
            }
            for (let nname in device.networks) {
                if (!networks.hasOwnProperty(nname)) {
                    console.warn("Network not found for network device: ", dname, nname)
                    global.ailtire.error.push({
                        type: 'environment.network',
                        object: {type: "network", id: nname, name: nname},
                        message: "Location not found for storage device: " + dname + ", " + nname,
                        data: device,
                        lookup: 'network/list'
                    });
                }
            }
        }
        for (let dname in environment.storage) {
            let device = environment.storage[dname];
            if (!device.networks || device.networks.length < 1) {
                console.warn("No Networks found for storage device: ", dname, ename);
                global.ailtire.error.push({
                    type: 'environment.network',
                    object: {type: "network", id: dname, name: dname},
                    message: "Location not found for storage device: " + dname,
                    data: device,
                    lookup: 'network/list'
                });
            }
            for (let nname in device.networks) {
                if (!networks.hasOwnProperty(nname)) {
                    console.warn("Network not found for network device: ", dname, nname)
                    global.ailtire.error.push({
                        type: 'environment.network',
                        object: {type: "network", id: nname, name: nname},
                        message: "Location not found for storage device: " + dname + ", " + nname,
                        data: device,
                        lookup: 'network/list'
                    });
                }
            }
        }
    }
}
const _checkCompute = (pkg, obj) => {

}
const _checkEnvironments = (pkg) => {
    // Check that all of the types have a cooresponding module.
    // This should travse the complete module and environments structure and check that the type matchs a module.
    try {
        _checkPhysicalResourceTypes(pkg, pkg.physical, "");
        _checkLocations(pkg, pkg.physical);
        _checkNetworks(pkg, pkg.physical);
        _checkCompute(pkg, pkg.physical);
    } catch (e) {
        console.error("CheckPhysicalResource Types failed:", e);
    }
}

const _checkDeployments = (pkg) => {

}

const _loadPhysicalDefaults = () => {

    if (!global.physical) {
        global.physical = {
            modules: {}, environments: {},
        }
    }
    if (!global.environments) {
        global.environments = {};
    }
    let mdir = path.resolve(__dirname + '../../../defaults/physical/modules');
    let mfiles = fs.readdirSync(mdir);
    _loadPhysicalModules(global.physical.modules, "", mdir, mfiles);

    // Next load the environment files.
    mdir = path.resolve(__dirname + '../../../defaults/physical/environments');
    mfiles = fs.readdirSync(mdir);
    _loadEnvironments(global.physical.environments, "", mdir, mfiles);

}
const loadPhysical = (pkg, prefix, dir) => {

    let physical = {
        dir: dir, prefix: prefix, environments: {}, modules: {}
    };
    _loadPhysicalDefaults();

    // first load the modules as they will be referenced in the environments.
    let mdir = path.resolve(dir + '/modules');
    let mfiles = fs.readdirSync(mdir);
    _loadPhysicalModules(physical.modules, "", mdir, mfiles);

    // Next load the environment files.
    mdir = path.resolve(dir + '/environments');
    mfiles = fs.readdirSync(mdir);

    _loadEnvironments(physical.environments, "", mdir, mfiles);
    pkg.physical = physical;
    // Now check the environment files for references to the modules, consistency in the configurations.
    _checkEnvironments(pkg);

    // Now check all of the deployments that they can handle the physical infrastructure that has been designed.
    _checkDeployments(pkg);
}


const loadDeploy = (pkg, prefix, dir) => {
    pkg.deploy = {
        dir: dir, prefix: prefix, envs: {}, build: {}
    };
    // Get the build file
    let apath = path.resolve(dir + '/build.js');
    if (!global.ailtire) {
        global.ailtire = {};
    }
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
                image: image, context: iname, pkg: pkg.shortname, basedir: dir, name: image.tag
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
                    object: {type: "environment", id: env, name: env},
                    message: "cloud not find envrionemt association type does not map to a model",

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
            let found = false;
            let anospace = aname.replace(/\s/g, '');
            if (aname !== "Init") {
                if (global.workflows.hasOwnProperty(anospace)) {
                    activity.obj = global.workflows[anospace];
                    activity.type = "workflow";
                    found = true;
                } else if (global.usecases.hasOwnProperty(anospace)) {
                    activity.obj = global.usecases[aname];
                    activity.type = "usecase";
                    found = true;
                } else {
                    for (let uname in global.usecases) {
                        let uc = global.usecases[uname];
                        if (uc.scenarios.hasOwnProperty(anospace)) {
                            activity.obj = uc.scenarios[anospace];
                            activity.type = "scenario";
                            found = true;
                            break;
                        }
                    }
                }
                // Now check and see if there is an interface that matches
                if (!found) {
                    if (global.actions.hasOwnProperty(anospace)) {
                        activity.obj = global.actions[anospace];
                        activity.type = "action";
                        found = true;
                    }
                }
                if (!found) {
                    console.error(`Activity "${aname}" not found for workflow "${wname}"`);
                }
            }
            for (nname in activity.next) {
                let next = activity.next[nname];
                if (!workflow.activities.hasOwnProperty(nname)) {
                    console.error("Activity not found in the workflow:", nname, " for next activity in ", aname);
                }
            }
        }
    }
}
const checkDeployment = (deployments, images) => {
    let imageRepo = global.ailtire.implementation.images;
    if (!global.ailtire.error) {
        global.ailtire.error = [];
    }
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
                                        pkg: 'undefined', context: 'external', name: base, children: {}
                                    }
                                }
                                global.ailtire.implementation.images[base].children[image.name] = image;
                                image.base = base;
                            }
                        }
                    }
                }
            } catch (e) {
                if (!global.ailtire.error) {
                    global.ailtire.error = [];
                }
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
        if (cls.definition.extends && typeof cls.definition.extends === 'string') {
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
                    if (parentCls.definition.extends) {
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
        } else {
            if (cls.definition.extends) {
                console.error("Fix problem with:", cls.definition.name);
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
            }, 'destroy': {
                name: `${ename}.destroy`,
                description: `When an object of type ${cls.definition.name} is destroyed.`,
                emitter: cls,
                handlers: {}
            }, 'updated': {
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
        AHandler.checker(pkg, handler);
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
            let pusecase = global.usecases[pusecaseName];
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
    if (!actionName) {
        return;
    }
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
////////////////////////
// Include file format
// module.export = {
//  models: [
//      'Agent',
//      'BluePrint',
//  ]
// }
const processModelIncludefile = (pkg, dir) => {
    // First check if there is an includes.js file.
    // If there is then process the includes.js file to import the classes into the global namespace.
    if (fs.existsSync(dir + '/include.js')) {
        let include = require(dir + '/include.js');

        for (let i in include.models) {
            let model = include.models[i];
            if (global.classes.hasOwnProperty(model)) {
                pkg.includes[model] = global.classes[model];
            } else {
                // let apath = path.resolve(file);
                if (!global.ailtire.hasOwnProperty('error')) {
                    global.ailtire.error = [];
                }
                global.ailtire.error.push({
                    type: 'package.includesFile',
                    object: {type: "Package", id: pkg, name: pkg.name},
                    message: "Model not found in package includes.js file",
                    data: model,
                    lookup: 'model/list'
                });
                console.error("Could not find Model:", model, "in include file for ", dir);
            }
        }
    }
}

function _loadWorkflowInstances() {
    let AWorkFlowInstance = require('./AWorkflowInstance');
    AWorkFlowInstance.loadAll();
}

function _processModelIncludeFiles() {

    for (let pname in global.packages) {
        let pkg = global.packages[pname];
        processModelIncludefile(pkg, path.resolve(`${pkg.dir}/models`));
    }
}

// Contains defaultHandlers for workflows and activities
function _initHandlers() {
    const AActivityInstance = require('./AActivityInstance');
    let retval = {};
    retval['activity.completed'] = {
        name: "activity.completed", handlers: [{
            description: 'Activity Completed Handler. Notifies the next activity of the completion.', fn: (data) => {
                AActivityInstance.handleEvent("activity.completed", data);
            }
        },]
    };
    retval['activity.skipped'] = {
        name: "activity.skipped", handlers: [{
            description: 'Activity Completes with a Skipped Handler. Notifies the next activity of the skipped state.',
            fn: (data) => {
                AActivityInstance.handleEvent("activity.skipped", data);
            }
        },]
    };
    retval['activity.error'] = {
        name: "activity.error", handlers: [{
            description: 'Activity Completes with an Error Handler. Notifies the next activity of the error state.',
            fn: (data) => {
                AActivityInstance.handleEvent("activity.error", data);
            }
        },]
    };
    return retval;
}

