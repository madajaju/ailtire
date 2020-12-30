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
        if (prop === 'toJSON') {
            return function (...args) {
                return {
                    _attributes: obj.definition.attributes,
                    _associations: obj.definition.associations,
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
        if (prop === 'find') {
            return function (...args) {
                let retval = findObject(obj, obj.definition.name, args);
                if (!retval) {
                    for (let i in obj.definition.subClasses) {
                        if (!retval) {
                            let subclassName = obj.definition.subClasses[i];
                            retval = findObject(obj, subclassName, args);
                        }
                    }
                }
                return retval;
            }
        }
    },
    construct: (target, args) => {
        if (!target.hasOwnProperty('_gid')) {
            target._gid = 0;
        }
        let oid = target._gid;
        let retval = Reflect.construct(target, args);
        retval.definition = retval.__proto__.constructor.definition;
        retval._attributes = {id: retval.definition.name + oid};
        retval._state = 'Init';
        retval._associations = {};
        let obj = new Proxy(retval, objHandler);
        target._gid++;
        obj.create(args[0]);
        if (!global.hasOwnProperty('_instances')) {
            global._instances = {};
        }
        if (!global._instances.hasOwnProperty(target.name)) {
            global._instances[target.name] = {};
        }
        global._instances[target.name][retval._attributes.id] = obj;

        return obj;
    },
};

function findObject(obj, name, args) {
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
