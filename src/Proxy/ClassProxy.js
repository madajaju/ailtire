const objHandler = require('./ObjectProxy');
const funcHandler = require('./MethodProxy');

module.exports = {
    get: (obj, prop) => {
        if (obj.definition.methods.hasOwnProperty(prop)) {
            return function (...args) {
                if (obj.definition.methods[prop].static) {
                    return funcHandler.run(obj.definition.methods[prop], this, args[0]);
                } else {
                    console.error("Cannot call object method with a class. Call with object from new", obj.definition.name + "();");
                }
            }
        }
        if (prop === 'doc') {
            return obj.doc;
        }
        if (prop === '_gid') {
            if (!obj.hasOwnProperty('_gid)')) {
                obj._gid = 0;
            }
            return obj._gid;
        }
        if (prop === 'definition') {
            if (!obj.definition.hasOwnProperty('attributes')) {
                obj.definition.attributes = {};
            }
            if (!obj.definition.hasOwnProperty('associations')) {
                obj.definition.associations = {};
            }
            if (!obj.definition.hasOwnProperty('methods')) {
                obj.definition.methods = {};
            }
            obj.definition.package = obj.package;
            return obj.definition;
        }
        if (prop === 'doc') {
            return obj.doc;
        }
        if (prop === 'toJSON') {
            return function (...args) {
                let methods = {};
                let pkgname = obj.definition.package.shortname;
                methods['create'] = {name: 'create', description: 'default create method'};
                methods['destroy'] = {name: 'destroy', description: 'default destroy method'};
                methods['update'] = {name: 'update', description: 'default update method'};
                methods['addTo'] = {name: 'addTo', description: 'default addTo method'};
                methods['removeFrom'] = {name: 'removeFrom', description: 'default removeFrom method'};
                for (let mname in obj.definition.methods) {
                    let method = obj.definition.methods[mname];
                    methods[mname] = {name: mname, description: method.description, inputs: method.inputs};
                }
                return {
                    name: obj.name,
                    id: obj.id,
                    methods: methods,
                    package: pkgname,
                    description: obj.definition.description,
                    _attributes: obj.definition.attributes,
                    _associations: obj.definition.associations,
                    statenet: obj.definition.statenet,
                    document: obj.document,
                }
            }
        }
        if (prop === 'fromJSON') {
            /* return {
                 _attributes: obj._attributes,
                 _associations: obj._associations,
             }
             */
        }
        if (prop === 'create') {
            return function (...args) {
                return {}
            }
        }
        // Need to find all of the other subclass items as well.
        if (prop === 'findDeep') {
            return async function (...args) {
                let retval = await findObject(obj, obj.definition.name, args);
                if (!retval) {
                    for (let i in obj.definition.subClasses) {
                        if (!retval) {
                            let subclassName = obj.definition.subClasses[i];
                            retval = await findObject(obj, subclassName, args);
                        }
                    u}
                }
                return retval;
            }
        } else if (prop === 'find') {
            return function (...args) {
                let retval = _findObjectInMemory(obj, obj.definition.name, args);
                if (!retval) {
                    for (let i in obj.definition.subClasses) {
                        if (!retval) {
                            let subclassName = obj.definition.subClasses[i];
                            retval = _findObjectInMemory(obj, subclassName, args);
                        }
                    }
                }
                return retval;
            }
        } else if (prop === 'load') {
            if (obj.definition.methods.hasOwnProperty("load")) {
                return function (...args) {
                    let retval = funcHandler.run(obj.definition.methods["load"], this, args[0]);
                    return retval;
                }
            } else {
                return function (...args) {
                    let adaptor = global.ailtire.config.persist?.adaptor;
                    if (adaptor) {
                        adaptor.load(obj, args[0]);
                        return obj;
                    } else {
                        return obj;
                    }
                }
            }
        } else if (prop === 'instances') {
            return async function (...args) {
                let retval = {};
                await _getSubInstances(obj.definition.name, retval);
                return retval;
            }
        }
    },
    construct: (target, args) => {
        if (!target.hasOwnProperty('_gid')) {
            target._gid = 0;
        }
        let oid = target._gid;
        let obj = Reflect.construct(target, args);
        obj.definition = obj.__proto__.constructor.definition;
        let uid = obj.definition.name + oid;

        // Check if the class instances are unique and the funtion they are unique by.
        if (args[0].id) {
            uid = args[0].id;
        } else if (obj.definition.hasOwnProperty('unique')) {
            uid = obj.definition.unique(args[0]);
        }
        obj._attributes = {id: uid};
        obj._state = 'Init';
        obj._associations = {};
        if (!global.hasOwnProperty('_instances')) {
            global._instances = {};
        }
        // Make sure the instances already exist for the class
        if (!global._instances.hasOwnProperty(target.name)) {
            global._instances[target.name] = {};
        }
        let proxy;

        // Now make sure the uniqueness is gaurenteed
        if (!global._instances[target.name].hasOwnProperty(obj._attributes.id)) {
            proxy = new Proxy(obj, objHandler);
            obj._proxy = proxy;
            // Populate the object based on the arguments.
            for (let name in args[0]) {
                if (name[0] !== '_') {
                    proxy[name] = args[0][name];
                }
            }

            target._gid++;
            global._instances[target.name][obj._attributes.id] = proxy;
        } else {
            proxy = global._instances[target.name][obj._attributes.id];
        }
        if (!args[0].hasOwnProperty('_loading')) {
            proxy.create(args[0]);
        } else {
            obj._state = "Loading";
            if (args[0]._file) {
                obj._persist = {file: args[0]._file._file, _clsName: args[0]._file._clsName, notLoaded: true};
            }
        }

        return proxy;
    },
};

async function findObject(obj, name, args) {
    let retval = _findObjectInMemory(obj, name, args);
    if (!retval) {
        retval = _findObjectInPersist(obj, args);
    }
    return retval;
}

async function _findObjectInPersist(obj, args) {
    let adaptor = global.ailtire.config.persist?.adaptor;
    if (adaptor) {
        let retval = await adaptor.find(obj, args[0]);
        return retval;
    } else {
        return obj;
    }
}

function _findObjectInMemory(obj, name, args) {
    if (!global._instances) {
        return null;
    }
    if (!global._instances.hasOwnProperty(name)) {
        return null;
    } else if (global._instances[name][args[0]]) {
        return global._instances[name][args[0]];
    } else {
        for (let i in global._instances[name]) {
            let instance = global._instances[name][i];
            if (typeof args[0] === 'object') {
                let foundMatch = false;
                for (let key in args[0]) {
                    let attr = instance._attributes;
                    if (attr.hasOwnProperty(key)) {
                        if (instance[key] === args[0][key]) {
                            foundMatch = true;
                        } else {
                            foundMatch = false;
                        }
                    } else {
                        break;
                    }
                }
                if (foundMatch) {
                    return global._instances[name][i];
                }
            } else {
                if (instance.name === args[0]) {
                    return global._instances[name][i];
                }
            }
        }
        return null;
    }
}

async function _getSubInstances(clsname, retval) {
    if(!global._instances) {
        global._instances = {};
    }
    if (global._instances.hasOwnProperty(clsname) && global._instances[clsname] !== null) {
        for (let oname in global._instances[clsname]) {
            retval[oname] = global._instances[clsname][oname];
        }
    } else {
        let adaptor = global.ailtire.config.persist?.adaptor;
        if (adaptor) {
            await adaptor.loadClass(clsname);
            if(global._instances.hasOwnProperty(clsname)) {
                for (let oname in global._instances[clsname]) {
                    retval[oname] = global._instances[clsname][oname];
                }
            }
        }
    }
    let subclasses = global.classes[clsname].definition.subClasses;
    for (let i in subclasses) {
        let subclass = subclasses[i];
        await _getSubInstances(subclass, retval);
    }
}

function _createTransparentProxy(promise) {
    return new Proxy(
        {},
        {
            get: (_, prop) => {
                return (...args) => {
                    // Chain promise resolution to access the final property/method
                    return promise.then(resolved => {
                        if (typeof resolved[prop] === 'function') {
                            return resolved[prop](...args); // Call resolved method
                        }
                        return resolved[prop]; // Return resolved property
                    });
                };
            },
        }
    );
}