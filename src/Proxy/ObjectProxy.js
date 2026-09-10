const addToRegex = /^addTo/;
const hasInRegex = /^hasIn/;
const removeFromRegex = /^removeFrom/;
const clearRegex = /^clear/;
const funcHandler = require('./MethodProxy');
const stateNetHandler = require('./StateNetProxy');
const path = require("path");
const fs = require("fs");
const axios = require('axios');

// Return the definition visible to an instance, including inherited fields.
// Child definitions override parent definitions with the same name.
function getDefinition(definition) {
    if (!definition) return {attributes: {}, associations: {}};
    const chain = [];
    const visited = new Set();
    let current = definition;
    while (current && !visited.has(current.name)) {
        visited.add(current.name);
        chain.unshift(current);
        if (!current.extends) break;
        const parentClass = (typeof AClass !== 'undefined' && AClass.getClass)
            ? (AClass.getClass({name: current.extends}) || AClass.getClass(current.extends))
            : null;
        const parent = parentClass || (typeof global !== 'undefined' ? global[current.extends] : null);
        current = parent?.definition || null;
    }
    return {
        ...definition,
        attributes: Object.assign({}, ...chain.map(item => item.attributes || {})),
        associations: Object.assign({}, ...chain.map(item => item.associations || {}))
    };
}

module.exports = {
    get: (obj, prop) => {
        // Check and set _attributes and _associations
        // Initialize the object

        _initalize(obj);
        const directGetHandler = directGetHandlers[prop];
        if (directGetHandler && (prop === 'isProxy' || prop === 'definition' || prop[0] === '_')) {
            return directGetHandler(obj);
        }
        if (typeof prop === 'string' && prop[0] === '_') {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                return obj[prop];
            }
            if (obj._attributes && Object.prototype.hasOwnProperty.call(obj._attributes, prop)) {
                return obj._attributes[prop];
            }
            return obj[prop];
        }
        if (obj._persist._notLoaded) {
            _load(obj, []);
        }

        try {
            let definition = obj.definition;

            if (typeof prop === 'string' && prop[0] === '_') { // This is a private  transient attribute.
                return obj._attributes[prop];
            }
            return getHandler(obj, definition, prop);
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    set: (obj, prop, value) => {
        _initalize(obj);
        if (prop === "_state") {
            return obj._state = value;
        }
        if (prop[0] === '_') {
            return obj._attributes[prop] = value;
        }
        if (obj._persist._notLoaded) {
            _load(obj, []);
        }
        // Check if the class has the attribute
        if (!obj.hasOwnProperty('definition')) {
            console.error("Missing \"definition\" property value for ", obj);
            return false;
        }
        const effectiveDefinition = getDefinition(obj.definition);
        if (effectiveDefinition.hasOwnProperty('attributes')) {
            if (effectiveDefinition.attributes.hasOwnProperty(prop)) {
                // Check for attributes first
                if (typeof value === effectiveDefinition.attributes[prop].type) {
                    obj._attributes[prop] = value;
                    obj._persist = {dirty: true};
                } else if (typeof value === 'object' && effectiveDefinition.attributes[prop].type === 'json') {
                    obj._attributes[prop] = value;
                    obj._persist = {dirty: true};
                } else {
                    // console.error("Data Type Mismatch: ", prop, " wants a ", getDefinition(obj.definition).attributes[prop], " but got ", typeof value);
                    obj._attributes[prop] = value;
                    obj._persist = {dirty: true};
                    return false;
                }
                return true;
            }
        }
        if (!obj.hasOwnProperty('_associations')) {
            obj._associations = {};
        }
        if (effectiveDefinition.hasOwnProperty('associations')) {
            if (hasAssociation(effectiveDefinition, prop)) {
                // Check for associations
                let myAssoc = getAssociation(effectiveDefinition, prop);
                // Make the assignment if it is an object.
                if (myAssoc.cardinality === 'n') {
                    return myAssoc.add({parent: obj, items: value});
                } else {
                    return myAssoc.add({parent: obj, item: value});
                }
            }
        }
        if (obj._persist && obj._persist.service) {
            obj._attributes[prop] = value;
            return true;
        }
        return true;
    },
    construct: (target, args) => {
        this.definition = target._definition;
        this._attributes = {};
        this._state = "Init";
        this._associations = {};
        //this.apply(target, obj, args);
        return this;
    },
    apply: (target, args) => {
        return new target(...args);
    },
    deleteProperty: (oTarget, sKey) => {
        // deleting an attribute or a complete association.
        if (oTarget._attributes.hasOwnProperty(sKey)) {
            delete oTarget._attributes[sKey];
        }
        if (oTarget._associations.hasOwnProperties(sKey)) {
            // Iterate over all of the items in the association and delete them.
            while (obj._associations[sKey].length) {
                let assocItem = obj._associations[name].pop();
                if (obj.definition._associations[name].owner === true) {
                    assocItem.destroy();
                }
            }
        }
    },
};

const directGetHandlers = Object.assign(Object.create(null), {
    name: obj => obj._attributes.name || "",
    className: obj => obj.definition.name,
    isTypeOf: obj => (...args) => isTypeOf(obj, args[0].name),
    package: obj => obj.definition.package,
    state: obj => obj._state,
    toPrompt: obj => () => JSON.stringify(_toJSON(obj), null, 2),
    getDocumentation: obj => () => _getDocumentation(obj),
    toJSON: obj => () => _toJSON(obj),
    toJSONShallow: obj => shallowJSON(obj),
    hasOwnProperty: obj => (...args) =>
        obj.hasOwnProperty(args[0]) ||
        obj._attributes.hasOwnProperty(args[0]) ||
        obj._associations.hasOwnProperty(args[0]),
    update: obj => (...args) => _update(obj, args[0]),
    definition: obj => obj.definition,
    create: (obj, definition) => function (...args) {
        return _create(obj, definition, this, args);
    },
    save: (obj, definition) => function (...args) {
        return _save(obj, definition, this, args);
    },
    destroy: (obj, definition) => (...args) => _destroy(obj, definition),
    then: () => undefined,
    load: obj => function (...args) {
        return _load(this, args);
    },
    aiUpdate: obj => (...args) => _aiUpdate(obj, args[0]),
    isProxy: () => () => true,
    _associations: obj => obj._associations,
    _attributes: obj => obj._attributes,
    _presist: obj => obj._persist,
});

function _create(obj, definition, context, args) {
    if (!obj.definition.methods) obj.definition.methods = {};
    if (obj.definition.methods.hasOwnProperty('create')) {
        if (hasStateNet(obj.definition)) return stateNetHandler.processEvent(context, obj, 'create', args);
        const retval = funcHandler.run(definition.methods.create, context, args[0]);
        AEvent.emit({event: definition.name + '.create', data: {obj: context.toJSON}});
        obj._persist = {dirty: true};
        return retval;
    }
    let myDef = obj.definition;
    while (myDef) {
        if (!myDef.hasOwnProperty('extends')) break;
        const parent = AClass.getClass({name: myDef.extends});
        myDef = parent?.definition;
        if (myDef?.methods?.hasOwnProperty('create')) {
            if (hasStateNet(myDef)) return stateNetHandler.processEvent(context, obj, 'create', args);
            return funcHandler.run(myDef.methods.create, context, args[0]);
        }
    }
    if (hasStateNet(definition)) return stateNetHandler.processEvent(context, obj, 'create', args);
    try {
        if (!AEvent) AEvent.emit({event: definition.name + '.create', data: {obj: context.toJSON}});
    } catch (e) {}
    return context;
}

function _save(obj, definition, context, args) {
    if (obj._persist && obj._persist.service) {
        const serviceURL = _resolveServiceURL(obj._persist.service);
        return axios.post(`${serviceURL}/${obj.definition.name}/save`, obj._attributes).then(res => res.data);
    }
    if (definition.methods.hasOwnProperty('save')) {
        return funcHandler.run(definition.methods.save, context, args[0]);
    }
    const adaptor = global.ailtire?.config?.persist?.adaptor;
    return adaptor ? adaptor.save(context, args[0]) : context;
}

function _destroy(obj, definition) {
    const oid = obj._attributes.id;
    for (const name in obj._attributes) delete obj._attributes[name];
    for (const name in obj._associations) {
        const assoc = obj._associations[name];
        const dassoc = getAssociation(definition, name);
        if (dassoc.cardinality === 1) {
            if (dassoc.owner === true) assoc?.destroy();
            delete obj._associations[name];
        } else {
            while (obj._associations[name].length) {
                const item = obj._associations[name].pop();
                if (dassoc.owner === true) item?.destroy();
            }
        }
    }
    if (global._instances?.[definition.name]) delete global._instances[definition.name][oid];
    return true;
}

function getHandler(obj, definition, prop) {
    const directHandler = directGetHandlers[prop];
    if (directHandler) {
        return directHandler(obj, definition);
    } else if (hasInRegex.test(prop)) { // Association addTo, removeFrom, and Clear
        return function (...args) {
            const simpleProp = prop.replace(hasInRegex, '').toLowerCase();
            if (obj._associations.hasOwnProperty(simpleProp)) {
                return obj._associations[simpleProp].hasOwnProperty(args[0]);
            } else {
                return false;
            }
        }
    } else if (addToRegex.test(prop)) {
        return function (...args) {
            const simpleProp = prop.replace(addToRegex, '').toLowerCase();
            let assoc = getAssociation(obj.definition, simpleProp);
            if (assoc && assoc.service && assoc.type !== 'ARemoteReference') {
                return _remoteCall(obj, assoc, 'add', args[0]);
            }
            let retval = addToAssoc(simpleProp, obj, this, args[0]);
            if (definition.methods.hasOwnProperty('add')) {
                retval = funcHandler.run(definition.methods['add'], this, args[0]);
            } else if (definition.methods.hasOwnProperty(prop)) {
                retval = funcHandler.run(definition.methods[prop], this, args[0]);
            }
            return retval;
        }
    } else if (removeFromRegex.test(prop)) {
        return function (...args) {
            const simpleProp = prop.replace(removeFromRegex, '').toLowerCase();
            let assoc = getAssociation(obj.definition, simpleProp);
            if (assoc && assoc.service && assoc.type !== 'ARemoteReference') {
                return _remoteCall(obj, assoc, 'remove', args[0]);
            }
            if (!obj._associations.hasOwnProperty(simpleProp)) {
                return false;
            }
            for (let i = 0; i < obj._associations[simpleProp].length;) {
                if (obj._associations[simpleProp][i] === args[0]) {
                    obj._associations[simpleProp].splice(i, i + 1);
                } else {
                    i++;
                }
            }
            return obj._associations[simpleProp];
        }
    } else if (clearRegex.test(prop)) {
        return function (...args) {
            const simpleProp = prop.replace(clearRegex, '').toLowerCase();
            if (!obj._associations.hasOwnProperty(simpleProp)) {
                return true;
            }
            while (obj._associations[simpleProp].length > 0) {
                obj._associations[simpleProp].pop();
            }
            return obj._associations[simpleProp];
        }
    }
    // Structural property and dynamic method dispatch follow below.
    if (getDefinition(obj.definition).attributes.hasOwnProperty(prop)) {
        let attr = getDefinition(obj.definition).attributes[prop];
        if(Object.prototype.hasOwnProperty.call(obj._attributes, prop)) {
            return obj._attributes[prop];
        }
        if (attr.type === 'file' || attr.type === 'blob') {
            return _loadAttribute(obj, prop);
        }
        return null;
    } else if (Object.prototype.hasOwnProperty.call(obj._attributes, prop) && !hasAssociation(obj.definition, prop)) {
        return obj._attributes[prop];
        // Check if the attribute definition is defined if so then return null
    } else if (obj._associations.hasOwnProperty(prop)) {
        // Add check to see if the association is loaded.

        let assocDef = getAssociation(obj.definition, prop);
        if (assocDef.service && assocDef.type !== 'ARemoteReference') {
            if (obj._persist && obj._persist.depth >= 1) {
                return obj._attributes[prop] || null;
            }
            return _createRemoteProxy(obj, assocDef);
        }
        if (assocDef.cardinality !== 'n') {
            let retval = obj._associations[prop];
            // Local associations are resolved by the persistence adapter's
            // second pass. Keep this synchronous and use the registry only as
            // a compatibility fallback for objects loaded individually.
            retval = resolveLocalAssociation(assocDef, retval);
            obj._associations[prop] = retval;
            return retval;
        } else {
            let retval = obj._associations[prop];
            if (Array.isArray(retval)) {
                retval = retval.map(item => resolveLocalAssociation(assocDef, item));
            } else if (retval && typeof retval === 'object') {
                for (const key of Object.keys(retval)) {
                    retval[key] = resolveLocalAssociation(assocDef, retval[key]);
                }
            }
            if (assocDef.type === 'ARemoteReference') {
                retval = decorateRemoteCollection(retval);
            }
            obj._associations[prop] = retval;
            return retval;
        }
        // Check if the association definition is defined if so then return an empty array or null
    } else if (hasAssociation(obj.definition, prop)) {
        let assoc = getAssociation(obj.definition, prop);
        if (assoc.service && assoc.type !== 'ARemoteReference') {
            if (obj._persist && obj._persist.depth >= 1) {
                return obj._attributes[prop] || null;
            }
            return _createRemoteProxy(obj, assoc);
        }
        if (assoc.cardinality === 1) {
            return null;
        } else {
            // return an empty array
            return assoc.type === 'ARemoteReference'
                ? decorateRemoteCollection(obj._attributes[prop] || [])
                : (obj._attributes[prop] || []);
        }
    } else if (prop === 'toString') {
        return function (...args) {
            if (obj._attributes.hasOwnProperty('name')) {
                return obj._attributes.name;
            } else {
                return obj._attributes.id;
            }
        }
        // If there is an extends then you need to check the parent stateenet.
    } else if (hasStateNet(definition)) {
        return function (...args) {
            return stateNetHandler.processEvent(this, obj, prop, args);
        }
    }
    // Now check for methods that are called.
    else if (definition.methods.hasOwnProperty(prop)) {
        // Need to check if the method called is async
        // If it is then you need to call await
        if (definition.methods[prop].fn.constructor.name === "AsyncFunction") {
            return async (...args) => {
                // Need to create a news proxy for the object here because the await/async module is setting this to
                // global.
                const objHandler = require('./ObjectProxy.js');
                let proxy = new Proxy(obj, objHandler);
                if (!definition.methods[prop].static) {
                    if (hasStateNet(definition)) {
                        return stateNetHandler.processEvent(proxy, obj, prop, args);
                    } else {
                        let objHandler
                        let retval = await funcHandler.run(definition.methods[prop], proxy, args[0]);
                        return retval;
                    }
                } else {
                    console.error("Cannot call class method with an object. Call with class from ", definition.name + "." + prop + "(...);");
                    return undefined;
                }
            };
        } else {
            return function (...args) {
                if (!definition.methods[prop].static) {
                    if (hasStateNet(definition)) {
                        return stateNetHandler.processEvent(this, obj, prop, args);
                    } else {
                        // let retval =  orgMethod.apply(this,args);
                        let retval = funcHandler.run(definition.methods[prop], this, args[0]);
                        return retval;
                    }
                } else {
                    console.error("Cannot call class method with an object. Call with class from ", definition.name + "." + prop + "(...);");
                    return undefined;
                }
            }
        }
    } else {
        if (obj._persist && obj._persist.service) {
            return (...args) => {
                const serviceURL = _resolveServiceURL(obj._persist.service);
                const url = `${serviceURL}/${obj.definition.name}/${prop}`;
                return axios.post(url, {id: obj._attributes.id || obj._attributes.name, args: args})
                    .then(res => res.data);
            };
        }
        return null;
    }
}

function decorateRemoteCollection(items) {
    const collection = Array.isArray(items)
        ? items
        : (items && typeof items === 'object' ? Object.values(items) : (items ? [items] : []));
    if (!Object.prototype.hasOwnProperty.call(collection, 'resolveAll')) {
        Object.defineProperty(collection, 'resolveAll', {
            enumerable: false,
            value: async function () {
                return Promise.all(collection.map(reference => {
                    if (reference && typeof reference.get === 'function') return reference.get();
                    return reference;
                }));
            }
        });
    }
    return collection;
}

function addToAssoc(simpleProp, obj, proxy, item) {

    if (item === null) { // do not add a null to the assoication
        return null;
    }

    let myAssoc = getAssociation(obj.definition, simpleProp);
    myAssoc.parent = proxy;
    if (myAssoc.type === 'ARemoteReference') {
        item = toRemoteReference(item, myAssoc.service, myAssoc.remoteType);
    }
    // Make the assignment if it is an object.
    const items = Array.isArray(item) && myAssoc.cardinality === 'n' ? item : [item];
    const retval = Array.isArray(item) && myAssoc.cardinality === 'n'
        ? myAssoc.add({parent: obj, items: item})
        : myAssoc.add({parent: obj, item: item});
    if (myAssoc.owner) {
        for (const child of items) {
            if (!child || typeof child !== 'object' || !child.definition) continue;
            Object.defineProperty(child, '_owner', {
                configurable: true, enumerable: false, writable: true,
                value: {parent: proxy, association: simpleProp, composition: !!myAssoc.composition}
            });
            if (typeof child.save === 'function') {
                Promise.resolve(child.save()).catch(error => {
                    console.error(`Unable to save owned association ${simpleProp}:`, error.message);
                });
            }
        }
    }
    return retval;
}

function toRemoteReference(item, service, remoteType) {
    if (item && item.definition?.name === 'ARemoteReference') return item;
    const attrs = item?._attributes && typeof item._attributes === 'object' ? item._attributes : (item || {});
    const rid = attrs.rid || item?.rid || attrs.id || item?.id || attrs.name || item?.name;
    if (!rid) throw new Error(`Cannot add a remote reference without a remote id. ${item}`);
    const data = {
        service: attrs.service || service,
        type: attrs.type || remoteType || 'RemoteObject',
        rid: String(rid),
        displayName: attrs.displayName || item?.displayName || attrs.name || item?.name || String(rid),
        snapshot: attrs.snapshot || item?.snapshot || {
            id: String(rid), name: attrs.name || item?.name, type: attrs.type || item?.type,
            concept: attrs.concept || item?.concept, body: attrs.body || item?.body,
            description: attrs.description || item?.description, mimeType: attrs.mimeType || item?.mimeType
        },
        snapShotDate: attrs.snapShotDate || item?.snapShotDate || new Date()
    };
    return new ARemoteReference(data);
}

// This needs to handle looking at extends until there isn't one anymore.
function isTypeOf(item, type) {
    if (!item.definition) {
        console.error("Object is missing a definition:", item);
        return false;
    }
    if (item.definition.name === type) {
        return true;
    } else if (item.definition.extends) {
        if (item.definition.extends.toLowerCase() === type.toLowerCase()) {
            return true;
        } else {
            let parent = AClass.getClass({name: item.definition.extends});
            if (parent) {
                return isTypeOf(parent, type);
            } else {
                console.error("Could not find parent class:", type);
                return false;
            }
        }
    } else {
        return false;
    }
}

function hasStateNet(definition) {
    if (definition.hasOwnProperty('statenet')) {
        return true;
    } else if (definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass({name: definition.extends});
        return hasStateNet(parent.definition);
    } else {
        return false;
    }
}

function hasAssociation(definition, aname) {
    const effectiveDefinition = getDefinition(definition);
    return Object.prototype.hasOwnProperty.call(effectiveDefinition.associations || {}, aname);
}

function resolveLocalAssociation(association, value) {
    if (value === null || value === undefined) {
        return value;
    }
    if(typeof value === 'string') {
        const instances = global._instances?.[association.type];
        if (instances?.[value]) return instances[value];
    }
    return value;
}

function getAssociation(definition, aname) {
    const effectiveDefinition = getDefinition(definition);
    if (Object.prototype.hasOwnProperty.call(effectiveDefinition.associations || {}, aname)) {
        let assoc = effectiveDefinition.associations[aname];
        if (assoc) {
            try {
                if (assoc.isProxy()) {
                    return assoc;
                }
            } catch (e) {
                effectiveDefinition.associations[aname] = new AAssociation(assoc);
                effectiveDefinition.associations[aname].name = aname;
                return effectiveDefinition.associations[aname];
            }
        }
        return null
    } else {
        console.log("Could not find association:", aname);
        return null;
    }
}

function shallowJSON(obj) {
    let newAttributes = {id: obj._attributes.id, state: obj._state};
    for (let aname in obj._attributes) {
        if (getDefinition(obj.definition).attributes.hasOwnProperty(aname)) {
            // THis should check if the attribute is an object or function not the definition.
            if (typeof obj._attributes[aname] !== 'object' && typeof obj._attributes[aname] !== 'function') {
                newAttributes[aname] = obj._attributes[aname];
            }
        }
    }
    return {
        definition: _definitionJSON(obj.definition),
        statenet: obj.statenet,
        _attributes: newAttributes
    };
}

function _definitionJSON(definition) {
    let newAttributes = {};
    let newAssociations = {};
    for (let aname in definition.attributes) {
        let attr = definition.attributes[aname];
        newAttributes[aname] = {...attr._attributes};
    }
    for (let aname in definition.associations) {
        let assoc = definition.associations[aname];
        newAssociations[aname] = {};
        for (let i in assoc._attributes) {
            if (typeof assoc._attributes[i] !== 'object' && typeof assoc._attributes[i] !== 'function') {
                newAssociations[aname][i] = assoc._attributes[i];
            }
        }
    }
    return {
        name: definition.name,
        attributes: newAttributes,
        associations: newAssociations,
        package: {
            shortname: definition.package?.shortname || '',
            name: definition.package?.name || '',
            color: definition.package?.color || ''
        },
    }
}

function _safeStringify(obj) {
    const seen = new WeakSet();
    let retString = JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        return value;
    });
    return JSON.parse(retString);
}

function _initalize(obj) {
    // Initalize obj
    if (!obj.hasOwnProperty('_attributes')) {
        obj._attributes = {};
    }
    if (!obj.hasOwnProperty('_associations') || Object.keys(obj._associations).length === 0) {
        obj._associations = {};
    }
    if (!obj.hasOwnProperty('_persist')) {
        obj._persist = {};
    }
    if (!obj.definition.hasOwnProperty('methods')) {
        obj.definition.methods = {};
    }
}

async function _load(obj, args) {
    if (!obj._persist._clsName) {
        console.error("Object _load failed to find the class for this object!", obj);
    }
    let cls = AClass.getClass({name: obj._persist._clsName});
    if (cls.definition.methods.hasOwnProperty('load')) {

        let retval = await funcHandler.run(cls.definition.methods['load'], obj, args[0]);
        return _hydrateLazyTarget(obj, retval);
    } else if (global.ailtire.config.persist) {
        const adaptor = global.ailtire.config.persist.adaptor;
        if (adaptor) {
            try {
                let retval = await adaptor.load(obj, args[0]);
                return _hydrateLazyTarget(obj, retval);
            } catch (error) {
                console.error("Error in adaptor.load:", error);
                return null; // Handle errors appropriately
            }
        }
    }
    return null; // Fallback if no load method or adaptor exists
}

function _hydrateLazyTarget(target, loaded) {
    if (!loaded) return null;

    const loadedProxy = loaded._proxy || loaded;
    if (loadedProxy === target) {
        target._persist = {...(target._persist || {}), _notLoaded: false};
        return loadedProxy;
    }

    // `target` is the raw object behind the ObjectProxy handler. Assigning
    // these fields directly updates the existing proxy identity rather than
    // replacing the association with another raw object.
    if (loaded._attributes) target._attributes = loaded._attributes;
    if (loaded._associations) target._associations = loaded._associations;
    if (loaded.definition) target.definition = loaded.definition;
    if (loaded._state !== undefined) target._state = loaded._state;
    target._persist = {
        ...(loaded._persist || target._persist || {}),
        _notLoaded: false
    };

    return loadedProxy;
}

function _update(obj, inputs) {
    _initalize(obj);

    if (!inputs || typeof inputs !== 'object') {
        return obj;
    }

    let changed = false;
    const attributes = obj.definition?.attributes || {};

    for (const [key, value] of Object.entries(inputs)) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
            obj._attributes[key] = value;
            changed = true;
        }
    }

    if (changed) {
        obj._persist = Object.assign({}, obj._persist, {dirty: true});
    }

    return obj;
}


function _toJSON(obj) {
    let assocs = {};
    // this should always be the object's class not the parent class.
    obj.package = obj.definition.package?.name?.replace(/ /g, '') || '';
    let definition = obj.definition;
    let seenObjects = new WeakSet();

    for (let i in obj._associations) {
        let assocObj = obj._associations[i];
        if (hasAssociation(definition, i)) {
            let dassoc = getAssociation(definition, i);
            if (dassoc.cardinality === 1 || dassoc.cardinality === '1') {
                if (assocObj) {
                    if (seenObjects.has(assocObj)) {
                        assocs[i] = assocObj.id;
                    } else {
                        seenObjects.add(assocObj);
                        if (dassoc.composition) {
                            assocs[i] = assocObj.toJSON();
                        } else {
                            assocs[i] = assocObj.id;
                        }
                    }
                } else {
                    assocs[i] = null;
                }
            } else {
                assocs[i] = {};
                for (let j in assocObj) {
                    if (assocObj[j]) {
                        if (seenObjects.has(assocObj[j])) {
                            assocs[i][j] = assocObj[j].id;
                        } else {
                            seenObjects.add(assocObj[j]);
                            if (dassoc.composition) {
                                assocs[i][j] = assocObj[j].toJSON();
                            } else {
                                assocs[i][j] = assocObj[j].id;
                            }
                        }
                    }
                }
            }
        } else { // the association is not defined. So set it to null.
            assocs[i] = null;
        }
    }
    // toJSON is same as toJSONShallow but it adds the associations.
    let retval = shallowJSON(obj);
    retval._associations = assocs;
    retval = _safeStringify(retval);
    return retval;
}

function _createTransparentProxy(promise) {
    return new Proxy(
        promise,
        {
            get: (target, prop) => {
                if (prop === 'then' || prop === 'catch' || prop === 'finally') {
                    return target[prop].bind(target);
                }
                return promise.then(resolved => {
                    if (resolved && typeof resolved[prop] === 'function') {
                        return resolved[prop].bind(resolved);
                    }
                    return resolved?.[prop];
                });
            },
        }
    );
}

function _getDocumentation(obj) {
    const docPath = path.join(obj.baseDir, 'doc');
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

async function _aiUpdate(obj, inputs) {

    let fields = inputs.fields ? inputs.fields.split(',') : ['description', 'documentation'];

    // Make sure the fields are valid attributes in the obj definition
    let flag = false;
    let objPrompt = obj.toPrompt();
    let doc = obj.getDocumentation();
    let userPrompt = inputs.prompt ? inputs.prompt : '';

    for (let field of fields) {
        if (getDefinition(obj.definition).attributes.hasOwnProperty(field) || field === "documentation") {
            let messages = [];
            messages.push({
                role: 'system',
                content: `Use the following ${obj.definition.name} for analysis of the user prompt: ${objPrompt}`
            });
            if (doc) {
                messages.push({
                    role: 'system',
                    content: `Use the following as ${obj.definition.name} documentation for analysis of the user prompt: ${doc}`
                });
            }
            message.push({
                role: 'system',
                content: `Generate a ${field} for ${obj.definition.name} based on the user prompt and the current documentation and specification`
            });
            message.push({role: 'user', content: userPrompt});
            let response = await AIHelper.ask(messages);
            obj[field] = response;
        } else if (getDefinition(obj.definition).associations.hasOwnProperty(field)) {

            let assocDef = getDefinition(obj.definition).associations[field];
            const many = assocDef.cardinality === 'n';
            let assocClass = AClass.getClass({name: assocDef.type});
            let assocFormat = assocClass.schema();

            // build a system prompt for GenAI
            const messages = [];
            messages.push({
                role: 'system',
                content:
                    `Parent ${obj.definition.name} spec:\n${objPrompt}\n\n` +
                    `Association name: ${field}\n` +
                    `Description: ${assocDef.description}\n` +
                    `Cardinality: ${assocDef.cardinality}\n\n` +
                    (doc
                        ? `Parent documentation:\n${doc}\n\n`
                        : '')
            });
            messages.push({
                role: 'user',
                content:
                    `“${userPrompt}”.\n` +
                    `Please generate ${many ? 'an array of' : 'a single'} ` +
                    `${assocDef.type} object${many ? 's' : ''} ` +
                    `to attach under the "${field}" association. ` +
                    `Return JSON objects matching the following format: ${assocFormat}\n\n`
            });

            // ask GenAI to produce the raw JSON for child(ren)
            const results = await AIHelper.askForCode(messages);
            if (results.length > 0) {
                if (many) {
                    for (let child of results) {
                        // e.g. ADisk.generate(childDef)
                        const childObj = await assocClass.generate(child);
                        obj.add(field, childObj);
                    }
                } else {
                    const childObj = await assocClass.generate(results[0]);
                    obj.add(field, childObj);
                }
            }
        }
    }
    obj.save();

    return obj;
}

async function _loadAttribute(obj, prop) {
    if (Object.prototype.hasOwnProperty.call(obj._attributes, prop)) return obj._attributes[prop]; // Already loading or loaded

    if (global.storage && global.storage.loadAttribute) {
        const promise = global.storage.loadAttribute(obj._proxy, prop).then(content => {
            obj._attributes[prop] = content;
            return content;
        });
        obj._attributes[prop] = promise;
        return promise;
    }
    return null;
}

function _resolveServiceURL(serviceName) {
    if (global.ailtire?.config?.services?.[serviceName]) {
        let s = global.ailtire.config.services[serviceName];
        return `${s.protocol || 'http'}://${s.host || serviceName}:${s.port || 3000}`;
    }
    // Fallback to just http://serviceName:3000 (common in Docker)
    return `http://${serviceName}:3000`;
}

async function _remoteCall(obj, assoc, action, item) {
    const serviceURL = _resolveServiceURL(assoc.service);
    const modelName = obj.definition.name;
    const id = obj._attributes.id || obj._attributes.name;
    const assocName = assoc.name;
    const assocUpper = assocName[0].toUpperCase() + assocName.slice(1);

    if (action === 'add' || action === 'remove') {
        const url = `${serviceURL}/${modelName}/${action === 'add' ? 'add' : 'removeFrom'}${assocUpper}`;
        const items = item.id || (item._attributes ? item._attributes.id : item);
        const response = await axios.post(url, {name: id, items: items});
        return response.data;
    } else if (action === 'list') {
        let url, params;
        if (assoc.via) {
            // If via is defined, query the target model directly
            url = `${serviceURL}/${assoc.type}`;
            params = { [assoc.via]: id };
        } else {
            // Fallback to querying the parent model's association
            url = `${serviceURL}/${modelName}`;
            params = { id: id };
        }

        const response = await axios.get(url, { params });
        
        // Handle standard ailtire list response
        let records = [];
        if (response.data) {
            if (response.data.records) records = response.data.records;
            else if (response.data.record && response.data.record[assocName]) {
                let val = response.data.record[assocName];
                records = val.values || val;
            }
            else if (Array.isArray(response.data)) records = response.data;
            else if (response.data.record) records = response.data.record;
            else records = response.data;
        }

        const depth = ((obj._persist && obj._persist.depth) ? obj._persist.depth : 0) + 1;
        const wrap = (itemData) => _wrapRemoteObject(itemData, assoc.type, assoc.service, depth);

        if (assoc.cardinality === 'n') {
            return Array.isArray(records) ? records.map(wrap) : [wrap(records)];
        } else {
            return Array.isArray(records) ? (records.length > 0 ? wrap(records[0]) : null) : wrap(records);
        }
    }
}

function _createRemoteProxy(obj, assoc) {
    let promise = _remoteCall(obj, assoc, 'list');
    return _createTransparentProxy(promise);
}

function _wrapRemoteObject(data, type, service, depth = 1) {
    let cls = AClass.getClass({name: type});
    let definition = cls ? cls.definition : {
        name: type,
        attributes: {},
        associations: {},
        methods: {}
    };

    let obj = {
        _attributes: data,
        _associations: {},
        _persist: {service: service, _clsName: type, depth: depth},
        definition: definition
    };

    const handler = require('./ObjectProxy');
    return new Proxy(obj, handler);
}

