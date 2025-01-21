const handler = require('./ClassProxy');
const funcHandler = require('./MethodProxy');
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const util = require('util');

module.exports = {
    get: (obj, prop) => {
        if (!obj.hasOwnProperty('definition')) {
            obj.definition = {};
            for (let i in obj) {
                if (i !== 'definition') {
                    obj.definition[i] = obj[i];
                }
            }
        }
        if (prop === 'definition') {
            return obj.definition;
        }
        /*if (obj.definition.methods.hasOwnProperty(prop)) {
            return function (...args) {
                if (obj.definition.methods[prop].static) {
                    return funcHandler.run(obj.definition.methods[prop], this, args[0]);
                } else {
                    console.error("Cannot call object method with a class. Call with object from new", obj.definition.name + "();");
                }
            }
        }
         */
        if (prop === 'toJSON') {
            return function (...args) {
                try {
                    let retval = _toJSON(obj.definition);
                    return retval;
                } catch (e) {
                    console.error(e);
                }
                /* let retval = {};
                for(let i in obj.definition) {
                    if(typeof obj.definition[i] === 'object') {
                        retval[i] = {};
                        for(let j in obj.definition[i]) {
                            if (i === 'usecases') {
                                retval[i][j] = obj.definition[i][j];
                            } else if(typeof obj.definition[i][j] === 'object') {
                                if(obj.definition[i][j].hasOwnProperty('toJSON')) {
                                    retval[i][j] = obj.definition[i][j].toJSON();
                                } else {
                                    // Just return the value not the object.
                                    retval[i][j] = toJSON(obj.definition[i][j]);
                                }
                            } else {
                                retval[i][j] = obj.definition[i][j];
                            }
                        }
                    } else {
                        retval[i] = obj.definition[i];
                    }
                }
                return retval;
                
                 */
            }
        }
        if (obj.definition.hasOwnProperty(prop)) {
            return obj.definition[prop];
        } else {
            return obj[prop];
        }
    }, set: (obj, prop, value) => {
        if (!obj.hasOwnProperty('definition')) {
            obj.definition = {};
        }
        obj.definition[prop] = value;
        return true;
    }, construct: (target, args) => {
        let obj = new Proxy(target, handler);
        //   target.proxy = obj;
        return obj;
    },
};

let _jsonCache = new WeakSet();

function _toJSON(obj) {
    let retval = {};
    for (let aname in obj) {
        switch (aname) {
            case "depends":
                retval.depends = [];
                for (let i in obj.depends) {
                    retval.depends.push({
                        shortname: obj.depends[i].shortname,
                        name: obj.depends[i].name,
                        description: obj.depends[i].description
                    });
                }
                break;
            case "subpackages":
                retval.subpackages = {};
                for (let i in obj.subpackages) {
                    retval.subpackages[i] = {
                        shortname: obj.subpackages[i].shortname,
                        name: obj.subpackages[i].name,
                        description: obj.subpackages[i].description
                    };
                }
                break;
            case 'usecases':
                retval.usecases = {};
                for (let i in obj.usecases) {
                    retval.usecases[i] = {
                        pkg: obj.usecases[i].pkg,
                        name: obj.usecases[i].name,
                        description: obj.usecases[i].description,
                        actors: obj.usecases[i].actors,
                        doc: obj.usecases[i].doc,
                        package: obj.usecases[i].package,
                        prefix: obj.usecases[i].prefix,
                        scenarios: Object.keys(obj.usecases[i].scenarios),
                    }
                }
            case 'interface':
                retval.interface = {};
                for (let i in obj.interface) {
                    retval.interface[i] = {
                        pkg: obj.interface[i].pkg.shortname,
                        name: obj.interface[i].name,
                        description: obj.interface[i].description,
                        inputs: obj.interface[i].inputs,
                        exits: obj.interface[i].exits,
                    }
                }
                break;
            default:
                retval[aname] = obj[aname];
        }
    }
    return retval;
}

function _toInterfaceJSON(obj) {
    const visited = new WeakMap(); // Stores visited objects

    function serialize(value) {
        if (value && typeof value === "object") {
            if (visited.has(value)) {
                // Circular reference detected
                const ref = visited.get(value);
                return ref.id || ref.name || "[Circular]";
            }

            // Mark object as visited and store its reference
            visited.set(value, value);

            if (Array.isArray(value)) {
                // Handle arrays recursively
                return value.map(serialize);
            } else {
                // Handle objects recursively
                const result = {};
                for (const key in value) {
                    if (value.hasOwnProperty(key)) {
                        result[key] = serialize(value[key]); // Recursively serialize
                    }
                }
                return result;
            }
        }
        return value; // Return primitive types as-is
    }

    return serialize(obj);
}
