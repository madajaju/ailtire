require('./AError.js');
const path = require('path');
const packageProxy = require("./Proxy/PackageProxy");
const classProxy = require("./Proxy/ClassProxy");
const funcHandler = require("./Proxy/MethodProxy");

module.exports = {
    init: (dir) => {
        // First load the APackage and AClass
        let pdir = path.resolve(dir, 'api', 'Logical');
        let package = require(path.join(pdir, 'index.js'));
        if (package.shortname) {
            prefix = 'ailtire/' + package.shortname;
        }
        package.prefix = prefix.toLowerCase();
        package.dir = pdir;
        let packageNameNoSpace = package.name.replace(/\s/g, '');
        global.packages = {};
        package.classes = {};
        let logicalPackage = global.packages[packageNameNoSpace] = new Proxy(package, packageProxy);

        // Load the AMethod Class into the Global Space. Specifically the AMethod so the load and loadAll methods can be used.
        let mdir = path.resolve(pdir, 'models', 'AMethod');
        _bootstrapMethodClass(mdir);

        _bootstrapAttributeClass(path.resolve(pdir, 'models', 'AAttribute'));
        _bootstrapAssociationClass(path.resolve(pdir, 'models', 'AAssociation'));
        let cdir = path.resolve(pdir, 'models', 'AClass');
        _bootstrapClass(cdir);
        AClass.load({package: logicalPackage, dir: cdir});

        let pkgClassdir = path.resolve(pdir, 'models', 'APackage');
        AClass.load({package: logicalPackage, dir: pkgClassdir});

        APackage.load({dir:path.resolve(dir, 'api', 'Logical'), prefix: 'ailtire'});
        APackage.load({dir:path.resolve(dir, 'api')});
    }
}

function _bootstrapClass(mdir) {
    let obj = require(path.resolve(mdir, 'index.js'));
    obj.dir = mdir;
    let myProxy = new Proxy(obj, classProxy);
    obj.definition.owners = new Array();
    obj.definition.dir = mdir;

    global.classes["AClass"] = myProxy;
    global["AClass"] = myProxy;
    obj.definition.methods = {};
    let file = path.resolve(mdir, 'load.js');
    let loadMethod = require(file);
    obj.definition.methods['load'] = loadMethod;
    obj.prototype["load"] = function(inputs) { return funcHandler.run(loadMethod, this, inputs); };

    /*
    let isTypeOf = require(path.resolve(mdir, 'isTypeOf.js'));
    obj.definition.methods['isTypeOf'] = isTypeOf;
    obj.prototype["isTypeOf"] = function(inputs) { return funcHandler.run(isTypeOf, this, inputs); };

     */

}
function _bootstrapMethodClass(mdir) {
    let methodObj = require(path.resolve(mdir, 'index.js'));
    methodObj.dir = mdir;
    let myProxy = new Proxy(methodObj, classProxy);
    methodObj.definition.owners = new Array();
    methodObj.definition.dir = mdir;

    if(!global.hasOwnProperty("classes")) {
        global.classes = {};
    }
    global.classes["AMethod"] = myProxy;
    global["AMethod"] = myProxy;

    let methodLoad = require(path.resolve(mdir, 'load.js'));
    methodLoad.name = "load";
    methodLoad = new AMethod(methodLoad);
    methodObj.definition.methods[methodLoad.name] = methodLoad;
    methodObj.prototype["load"] = function(inputs) { return funcHandler.run(methodLoad, this, inputs); };
    let methodLoadAll = require(path.resolve(mdir, 'loadAll.js'));
    methodLoadAll.name = "loadAll";
    methodLoadAll = new AMethod(methodLoadAll);
    methodObj.definition.methods[methodLoadAll.name] = methodLoadAll;
    methodObj.prototype["loadAll"] = function(inputs) { return funcHandler.run(methodLoadAll, this, inputs); };
}
function _bootstrapAttributeClass(mdir) {
    let obj = require(path.resolve(mdir, 'index.js'));
    obj.dir = mdir;
    let myProxy = new Proxy(obj, classProxy);
    obj.definition.owners = new Array();
    obj.definition.dir = mdir;

    if(!global.hasOwnProperty("classes")) {
        global.classes = {};
    }
    global.classes["AAtribute"] = myProxy;
    global["AAtribute"] = myProxy;
}

function _bootstrapAssociationClass(mdir) {
    let obj = require(path.resolve(mdir, 'index.js'));
    obj.dir = mdir;
    let myProxy = new Proxy(obj, classProxy);
    obj.definition.owners = new Array();
    obj.definition.dir = mdir;

    if(!global.hasOwnProperty("classes")) {
        global.classes = {};
    }
    global.classes["AAssociation"] = myProxy;
    global["AAssociation"] = myProxy;

    let methodAdd = require(path.resolve(mdir, 'add.js'));
    methodAdd.name = "add";
    methodAdd = new AMethod(methodAdd);
    obj.definition.methods = {};
    obj.definition.methods['add'] = methodAdd;
    obj.prototype["add"] = function(inputs) { return funcHandler.run(methodAdd, this, inputs); };
}