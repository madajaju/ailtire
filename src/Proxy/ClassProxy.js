const objHandler = require('./ObjectProxy');
const funcHandler = require('./MethodProxy');
const z = require("zod");
const fs = require('fs');
const path = require('path');
const AIHelper = require('../Server/AIHelper');

module.exports = {
    get: (obj, prop) => {
        if (obj.definition.methods.hasOwnProperty(prop)) {
            // This is a class method and should have the static flag set.
            let method = obj.definition.methods[prop];
            const isAsync = Object.getPrototypeOf(method.fn).constructor.name === 'AsyncFunction';
            if (isAsync) {
                return async function (inputs) {
                    return funcHandler.run(method, this, inputs);
                }
            } else {
                return function (inputs) {
                    return funcHandler.run(method, this, inputs);
                }
            }
        }
        if(prop === 'hasOwnProperty') {
            return function (...args) {
                return obj.hasOwnProperty(args[0]);
            }
        }
        if (prop === 'isProxy') {
            return "ClassProxy";
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
        if( prop === 'getDocumentation') {
            return function (...args) {
                return _getDocumentation(obj);
            }
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
        if (prop === 'toPrompt') {
            return function (...args) {
                let objects = args[0];
                if (!objects) {
                    objects = _instances[obj.definition.name];
                }
                let retval = "";
                for (let i in objects) {
                    retval += objects[i].toPrompt();
                }
                return JSON.stringify(retval);
            }
        }
        if (prop === 'schema') {
            return function (...args) {
                // Ok I need to take the inputs and create a template that will be based to a genAI to generate the json 
                // to call the method with the inputs defined in the construct method.
                if( obj.definition.methods.hasOwnProperty( "construct" )) {
                    return `{ ${toInputCalls(obj.definition.methods.construct.inputs)} }`;
                }
                return toInputCalls(obj.definition.attributes);
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
        if(prop === 'add') {
            return function (...args) {
                let assocName = args[0];
                let aobj = args[1];
                if (!aobj.isProxy) {
                    aobj = aobj._proxy;
                }
                let uid = aobj._attributes.name;
                let assocDef = obj.definition[assocName];
                assocDef[uid] = aobj;
                return aobj;
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
                    }
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
                return async function (...args) {
                    const adaptor = global.ailtire?.config?.persist?.adaptor;
                    if (adaptor && typeof adaptor.loadClass === 'function') {
                        return await adaptor.loadClass(obj, args[0]);
                    }
                    if (adaptor && typeof adaptor.load === 'function') {
                        return await adaptor.load(obj, args[0]);
                    }
                    return obj;
                }
            }
        } else if (prop === 'loadAll') {
            if (obj.definition.methods.hasOwnProperty("loadAll")) {
                return function (...args) {
                    let retval = funcHandler.run(obj.definition.methods["loadAll"], this, args[0]);
                    return retval;
                }
            } else {
                return async function (...args) {
                    const adaptor = global.ailtire?.config?.persist?.adaptor;
                    if (adaptor && typeof adaptor.loadAll === 'function') {
                        return await adaptor.loadAll(obj, args[0]);
                    }
                    if (adaptor && typeof adaptor.loadClass === 'function') {
                        return await adaptor.loadClass(obj, args[0]);
                    }
                    return obj;
                }
            }
        } else if (prop === 'instances') {
            return async function (...args) {
                let retval = {};
                await _getSubInstances(obj.definition.name, retval);
                return retval;
            }
        } else if (prop === 'aiUpdate') {
            return async function (...args) {
                return await _aiUpdate(this, args[0]);
            }
        } else if(prop === 'isTypeOf') {
            return function (...args) {
                let inputs =  args[0];
                if(inputs.name === 'AClass') {
                    return true;
                }
                if(inputs.name === obj.definition.name || inputs.name.toLowerCase() === obj.definition.name.toLowerCase()) {
                    return true;
                }
                if(obj.extends) {
                    let parentClass = AClass.find({name: obj.extends})
                    return parentClass.IsTypeOf({name:inputs.name});
                }
                return false;
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

        // Check for a duplicate. Someone constructing a new object with an object. That should pass back the same object.
        try {
            if(args[0].isProxy) {
                return args[0];
            }
        }
        catch(e) {
            // continue to load the object.
        }
        // Check if the class instances are unique and the function they are unique by.
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
        try {
        if (!args[0].hasOwnProperty('_loading')) {
            proxy.create(args[0]);
        } else {
            obj._state = "Loading";
            if (args[0]._file) {
                obj._persist = {file: args[0]._file._file, _clsName: args[0]._file._clsName, notLoaded: true};
            }
        }
        }
        catch(e) {
            console.log(e);
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
                        if (instance[key].toLowerCase() === args[0][key].toLowerCase()) {
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
    if (!global._instances) {
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
            if (global._instances.hasOwnProperty(clsname)) {
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

function toInputCalls(inputs) {
    let schema = [];
    for (const [name, def] of Object.entries(inputs)) {
        let {type, description, required, default: defValue, values, properties} = def;

        // Map custom types into valid Zod types
        let item = "";
        if (type) {
            switch (type.toLowerCase()) {
                case 'json':
                    item = `${name}: {json} // ${description}"`;
                    break;
                case 'ref':
                case 'string':
                    item = `${name}: "string" // ${description}"`;
                    break;
                case 'integer':
                    item = `${name}: number // ${description}"`;
                    break;
                case 'number':
                    item = `${name}: number // ${description}"`;
                    break;
                case 'boolean':
                    item = `${name}: boolean // ${description}"`;
                    break;
                case 'array':
                    item = `${name}: [`
                    if (properties && typeof properties === 'object') {
                        const shape = toInputCalls(properties);
                        item += shape;
                    } else {
                        item += `"string"`;
                    }
                    item += `] // ${description}"`;
                    break;
                case 'object':
                    item = `${name}: {`;
                    if (properties && typeof properties === 'object') {
                        if (properties && typeof properties === 'object') ;
                        const shape = toInputCalls(properties);
                        item += shape;
                    } else {
                        item += "json"
                    }
                    item += `} // ${description}"`;
                    break;
                default:
                    item = `${name}: "string" // ${description}"`;
            }
            schema.push(item);
        }
    }

    return schema.join(',\n');
}

function _getDocumentation(obj) {
    if(obj.dir) {
        const docPath = path.join(obj.dir, 'doc');
        let documentation = '';

        if (fs.existsSync(docPath)) {
            const readFilesRecursively = (dir) => {
                const files = fs.readdirSync(dir);

                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        readFilesRecursively(fullPath);
                    } else if (file.endsWith('.md') || file.endsWith('.emd')) {
                        documentation += fs.readFileSync(fullPath, 'utf8') + '\n';
                    }
                });
            };

            readFilesRecursively(docPath);
        }

        return documentation;
    }
    return "";
}

async function _aiUpdate(obj, inputs) {

    let fields = inputs.fields ? inputs.fields.split(',') : ['description', 'documentation'];
    let cls = inputs.cls;

    // Make sure the fields are valid attributes in the obj definition
    let flag = false;
    let objPrompt = cls.toPrompt();
    let doc = cls.getDocumentation();
    let userPrompt = inputs.prompt ? inputs.prompt : '';

    for (let field of fields) {
        if (obj.definition.attributes.hasOwnProperty(field) || field === "documentation") {
            let messages = [];
            messages.push({role: 'system', content: `Use the following ${cls.definition.name} for analysis of the user prompt: ${objPrompt}`});
            if(doc) {
                messages.push({
                    role: 'system',
                    content: `Use the following as ${cls.definition.name} documentation for analysis of the user prompt: ${doc}`
                });
            }
            message.push({role: 'system', content: `Generate a ${field} for ${cls.definition.name} based on the user prompt and the current documentation and specification`});
            message.push({role: 'user', content: userPrompt});
            let response = await AIHelper.ask(messages);
            cls[field] = response;
        } else if(obj.definition.associations.hasOwnProperty(field)) {

            let assocDef = obj.definition.associations[field];
            const many = assocDef.cardinality === 'n';
            let assocClass = AClass.getClass({name:assocDef.type});
            let assocFormat = assocClass.schema();

            // build a system prompt for GenAI
            const messages = [];
            messages.push({
                role: 'system',
                content:
                    `Parent ${cls.definition.name} spec:\n${ objPrompt }\n\n` +
                    `Association name: ${ field }\n` +
                    `Description: ${ assocDef.description }\n` +
                    `Cardinality: ${ assocDef.cardinality }\n\n` +
                    (doc
                        ? `Parent documentation:\n${ doc }\n\n`
                        : '')
            });
            messages.push({
                role: 'user',
                content:
                    `“${ userPrompt }”.\n` +
                    `Please generate ${ many ? 'an array of' : 'a single' } ` +
                    `${ assocDef.type } object${ many ? 's' : '' } ` +
                    `to attach under the "${ field }" association. ` +
                    `Return JSON objects matching the following format: ${assocFormat}\n\n`
            });

            // ask GenAI to produce the raw JSON for child(ren)
            const results = await AIHelper.askForCode(messages);
            if(results.length > 0) {
                if (many) {
                    for (let child of results) {
                        // e.g. ADisk.generate(childDef)
                        const childObj = await assocClass.construct(child);
                        cls.add(field, childObj);
                    }
                } else {
                    const childObj = await assocClass.construct(results[0]);
                    cls.add(field, childObj.toJSON());
                }
            }
        }
    }
    obj.save(cls);

    return cls;
}
