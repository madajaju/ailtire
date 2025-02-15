const addToRegex = /^addTo/;
const hasInRegex = /^hasIn/;
const removeFromRegex = /^removeFrom/;
const clearRegex = /^clear/;
const funcHandler = require('./MethodProxy');
const stateNetHandler = require('./StateNetProxy');
const AClass = require('../Server/AClass');
const AEvent = require("../Server/AEvent");

module.exports = {
    get: (obj, prop) => {
        // Check and set _attributes and _associations
        // Initialize the object

        _initalize(obj);
        if (prop[0] === '_') {
            return obj[prop];
        }
        if (prop === 'definition') {
            return obj.definition;
        }
        if (obj._persist._notLoaded) {
            _load(obj, []);
        }

        try {
            let definition = obj.definition;

            if (prop === "_associations") {
                return obj._associations;
            }
            if (prop === "_attributes") {
                return obj._attributes;
            }
            if (prop === "_presist") {
                return obj._persist;
            }
            if (prop[0] === '_') { // This is a private  transient attribute.
                return obj[prop];
            }
            return getHandler(obj, definition, prop);
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    set: (obj, prop, value) => {
        _initalize(obj);
        if (prop[0] === '_') {
            return obj[prop] = value;
        }
        if (obj._persist._notLoaded) {
            _load(obj, []);
        }
        // Check if the class has the attribute
        if (prop === "_state") {
            obj._state = value;
        }
        if (!obj.hasOwnProperty('definition')) {
            console.error("Missing \"definition\" property value for ", obj);
            return false;
        }
        if (obj.definition.hasOwnProperty('attributes')) {
            if (obj.definition.attributes.hasOwnProperty(prop)) {
                // Check for attributes first
                if (typeof value === obj.definition.attributes[prop].type) {
                    obj._attributes[prop] = value;
                    obj._persist = {dirty: true};
                } else if (typeof value === 'object' && obj.definition.attributes[prop].type === 'json') {
                    obj._attributes[prop] = value;
                    obj._persist = {dirty: true};
                } else {
                    // console.error("Data Type Mismatch: ", prop, " wants a ", obj.definition.attributes[prop], " but got ", typeof value);
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
        if (obj.definition.hasOwnProperty('associations')) {
            if (hasAssociation(obj.definition, prop)) {
                // Check for associations
                // Make the assignment if it is an object.
                let myAssoc = getAssociation(obj.definition, prop);
                if (myAssoc.cardinality === 'n') {

                    // Store things as an array or a map.
                    if (Array.isArray(value)) {
                        let newArray = [];
                        // Iterate through each one. If an element is a string them try and load the Object.
                        for (let i in value) {
                            let aval = value[i];
                            if (typeof aval !== 'object') {
                                let myClass = AClass.getClass(myAssoc.type);
                                let myObj = myClass.findIn(aval);
                                if (!myObj) {
                                    myObj = new myClass({id: aval});
                                }
                                newArray.push(myObj);
                            } else {
                                newArray.push(aval);
                            }
                        }
                        obj._associations[prop] = newArray;
                        obj._persist = {dirty: true};
                        return true;
                    } else {
                        console.error("Expecting an array, recieved a ", typeof value);
                        return false;
                    }
                } else {
                    if (!value) {
                        obj._associations[prop] = value;
                        obj._persist = {dirty: true};
                        return true;
                    }
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        if (value.definition.name.toLowerCase() === getAssociation(obj.definition, prop).type.toLowerCase()) {
                            obj._associations[prop] = value;
                            obj._persist = {dirty: true};
                            return true;
                            // Check if the value type matches prop type.
                        } else if (isTypeOf(value, getAssociation(obj.definition, prop).type.toLowerCase())) {
                            obj._associations[prop] = value;
                            obj._persist = {dirty: true};
                            return true;
                        } else {
                            console.error("Assignment is the wrong type: ", getAssociation(obj.definition, prop).type, " expected, recieved ", value.definition.name);
                            return false;
                        }
                    } else {
                        console.error("Assigning something different for an object:", value);
                        return false;
                    }
                }
            }
        }
        if (typeof value === 'object') {
            // console.warn("Not defined association ", prop, ": Assigned to ", prop, " anyway!!");
            obj._associations[prop] = value;
            obj._persist = {dirty: true};

        } else {
            // console.warn("Not defined attribute ", prop, ": Assigned ", value, " to ", prop, " anyway!!");
            obj._attributes[prop] = value;
            obj._persist = {dirty: true};
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

function getHandler(obj, definition, prop) {
    if (prop === 'name') {
        if (obj._attributes.name) {
            return obj._attributes.name;
        } else {
            //return obj._attributes.id;
            return "";
        }
    }
    if (prop === 'className') {
        return obj.definition.name;
    } else if (prop === 'isTypeOf') {
        return function (...args) {
            return isTypeOf(obj, args[0]);
        }
    } else if (prop === 'package') {
        return obj.definition.package;
    } else if (prop === 'state') {
        return obj._state;
    } else if (prop === 'toJSON') {
        return _toJSON(obj);
    } else if (prop === 'toJSONShallow') {
        return shallowJSON(obj);
    } // Association addTo, removeFrom, and Clear
    else if (hasInRegex.test(prop)) {
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
            let retval = addToAssoc(simpleProp, obj, this, args[0]);
            if (definition.methods.hasOwnProperty('add')) {
                retval = funcHandler.run(definition.methods['add'], this, args[0]);
            } else if (definition.methods.hasOwnProperty(prop)) {
                retval = funcHandler.run(definition.methods[prop], this, args[0]);
            }
            return retval;
        }
    } else if (prop === 'add') {
        return function (...args) {
            const simpleProp = args[0];
            const upperProp = args[0][0].toUpperCase() + args[0].slice(1);
            const item = args[1];
            let retval = addToAssoc(simpleProp, obj, this, item);
            if (definition.methods.hasOwnProperty('add' + upperProp)) {
                retval = funcHandler.run(definition.methods['add' + upperProp], this, {item: item});
            } else if (definition.methods.hasOwnProperty('add')) {
                retval = funcHandler.run(definition.methods['add'], this, {item: item, assoc: simpleProp});
            }
            return retval;
        }
    } else if (removeFromRegex.test(prop)) {
        return function (...args) {
            const simpleProp = prop.replace(removeFromRegex, '').toLowerCase();
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
    // give a method to return the definition of the class
    else if (prop === 'definition') {
        return obj.definition;
    } else if (prop === 'create') {
        return function (...args) {
            // Call the method if it exists

            if (!definition.methods) {
                definition.methods = {};
            }
            if (definition.methods.hasOwnProperty('create')) {
                if (hasStateNet(definition)) {
                    return stateNetHandler.processEvent(this, obj, prop, args);
                } else {
                    let retval = funcHandler.run(definition.methods.create, this, args[0]);
                    let json = this.toJSON;
                    AEvent.emit(definition.name + '.create', {obj: json});
                    obj._persist = {dirty: true};
                    return retval;
                }
            } else {
                let myDef = obj.definition;

                while (myDef) {
                    if (myDef.hasOwnProperty('extends')) {
                        let parent = myDef.extends;
                        let newObj = AClass.getClass(parent);
                        myDef = newObj.definition;
                        if (myDef.methods.hasOwnProperty('create')) {
                            if (hasStateNet(myDef)) {
                                return stateNetHandler.processEvent(this, obj, prop, args);
                            } else {
                                let retval = funcHandler.run(myDef.methods.create, this, args[0]);
                                let json = this.toJSON;
                                AEvent.emit(definition.name + '.create', {obj: json});
                                return retval;
                            }
                        }
                    } else {
                        myDef = null;
                    }
                }
                // If the while loop exits without returning the use a default create.
                // This is now handled in the ClassProxy. All attributes are loaded into the object before create is called.
                // for (let name in args[0]) {
                //     this[name] = args[0][name];
                //  }

                if (hasStateNet(definition)) {
                    return stateNetHandler.processEvent(this, obj, prop, args);
                } else {
                    let json = this.toJSON;
                    AEvent.emit(definition.name + '.create', {obj: json});
                    return this;
                }
            }
        }
    } else if (prop === 'destroy') { // create a destroy method to destroy the object.
        return function (...args) {
            // call destroy on all of the attributes
            let oid = obj._attributes.id;
            for (let name in obj._attributes) {
                delete obj._attributes[name];
            }
            // call destroy on all of the associations
            for (let name in obj._associations) {
                let assoc = obj._associations[name];
                let dassoc = getAssociation(definition, name);
                if (dassoc.cardinality === 1) {
                    if (dassoc.owner === true) {
                        assoc.destroy();
                    }
                    delete obj._associations[name];
                } else {
                    // Call destroy on all of the objects in the array.
                    while (obj._associations[name].length) {
                        let assocItem = obj._associations[name].pop();
                        if (dassoc.owner === true) {
                            assocItem.destroy();
                        }
                    }
                }
            }
            // Now remove it from the class._instances array;
            delete global._instances[definition.name][oid];

            return true;
        }
    } else if (obj._attributes.hasOwnProperty(prop)) {
        return obj._attributes[prop];
        // Check if the attribute definition is defined if so then return null
    } else if (obj.definition.attributes.hasOwnProperty(prop)) {
        return null;
    } else if (obj._associations.hasOwnProperty(prop)) {
        // Add check to see if the associatio is loaded.

        let assocDef = getAssociation(obj.definition, prop);
        if (assocDef.cardinality === 1) {
            let retval = obj._associations[prop];
            // Could return a null.
            if(retval) {
                if (retval._persist?.hasOwnProperty('_notLoaded') && retval._persist._notLoaded) {
                    const promise = _load(retval, []).then(loaded => {
                        obj._associations[prop] = loaded; // Cache the resolved object
                        return obj._associations[prop];
                    });

                    // Return a Proxy that transparently resolves the promise
                    return _createTransparentProxy(promise);
                }
            }
            return retval;
        } else {
            let retval = obj._associations[prop];
            for (let i in retval) {
                let item = retval[i];
                if (item && item._persist.hasOwnProperty("_notLoaded") && item._persist?._notLoaded) {
                    let promise = _load(item, []).then(loaded => {
                        obj._associations[prop][i] = loaded; // Cache resolved item
                        return loaded;
                    });
                    obj._associations[prop][i] = _createTransparentProxy(promise);
                }
            }

            // Return a Proxy for the array that resolves the promises transparently
            return obj._associations[prop];
        }
        // Check if the association definition is defined if so then return an empty array or null
    } else if (hasAssociation(obj.definition, prop)) {
        if (getAssociation(obj.definition, prop).cardinality === 1) {
            return null;
        } else {
            // return an empty array
            return [];
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
    } else if (prop === 'then') {
        return new Promise(resolve => resolve(obj));
    } else if (prop === 'save') {
        if (definition.methods.hasOwnProperty('save')) {
            return function (...args) {
                let retval = funcHandler.run(definition.methods[prop], this, args[0]);
                return retval;
            }
        } else {
            return function (...args) {
                if (global.ailtire.config.persist) {
                    let adaptor = global.ailtire.config.persist.adaptor;
                    if (adaptor) {
                        return adaptor.save(this, args[0]);
                    } else {
                        return this;
                    }
                } else {
                    return this;
                }
            }
        }
    } else if (prop === 'load') {
        return function (...args) {
            return _load(this, args);
        }
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
        console.error(`Error cloudnot find ${prop} on ${obj}`);
        throw new Error(`Could not find ${prop}! on ${obj}`);
    }
}

function addToAssoc(simpleProp, obj, proxy, item) {
    let child = null;
    obj._persist.dirty = true;
    let associationDefinition = getAssociation(obj.definition, simpleProp);
    if (item === null) { // do not add a null to the assoication
        return null;
    }
    // retrieve the object and add it to the array if a number is passed in.
    if (typeof item === 'number') {
        if (global._instances.hasOwnProperty(item)) {
            child = global._instances[item];
        } else {
            console.error(prop, "could not find the object with id:", item);
            return null;
        }
    } else if (Array.isArray(item)) { // Check if it is an array of objects. if so then recursively add to the association.
        let retval = [];
        for (let i in item) {
            retval.push(addToAssoc(simpleProp, obj, proxy, item[i]));
        }
        return retval;
    } else if (typeof item === 'object') {
        // Create a new object if the item being passed in is a simple Object.
        // Add to the array if it is a object of the correct type.
        if (item.definition) {
            if (!hasAssociation(obj.definition, simpleProp)) {
                console.error("Cannot Add to unknown property:", simpleProp);
                return;
            }
            if (isTypeOf(item, associationDefinition.type)) {
                child = item;
            } else {
                console.error(simpleProp, "wrong type of object! Recieved:", item.definition.name, 'expecting', associationDefinition.type);
                return;
            }
        } else {
            let newClass = AClass.getClass(associationDefinition.type);
            child = new newClass(item);
        }
    }
    if (associationDefinition.unique) {
        if (!obj._associations.hasOwnProperty(simpleProp)) {
            obj._associations[simpleProp] = {};
        }
        obj._associations[simpleProp][child.name] = child;
    } else {
        if (!obj._associations.hasOwnProperty(simpleProp)) {
            obj._associations[simpleProp] = [];
        }
        obj._associations[simpleProp].push(child);
    }

    // Add the back link with via
    if (associationDefinition.hasOwnProperty('via')) {
        let via = getAssociation(obj.definition, simpleProp).via;
        if (child) {
            child[via] = proxy;
        } else {
            console.warn(`Setting via relationship ${via} on null child of ${obj.name} class!`);
        }
    }

    // Add the composition and owner backlinks for saving in the _presist
    if (associationDefinition.owner) {
        child._persist.owner = proxy;
    }
    if (associationDefinition.composition) {
        child._persist.composition = obj;
        obj._persist.dirty = true;
    }
    return child;
}

// This needs to handle looking at extends until there isn't one anymore.
function isTypeOf(item, type) {
    if (item.definition.name === type) {
        return true;
    } else if (item.definition.extends) {
        if (item.definition.extends.toLowerCase() === type.toLowerCase()) {
            return true;
        } else {
            let parent = AClass.getClass(item.definition.extends);
            return isTypeOf(parent, type);
        }
    } else {
        return false;
    }
}

function hasStateNet(definition) {
    if (definition.hasOwnProperty('statenet')) {
        return true;
    } else if (definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        return hasStateNet(parent.definition);
    } else {
        return false;
    }
}

function hasAssociation(definition, aname) {
    if (definition.associations.hasOwnProperty(aname)) {
        return true;
    } else if (definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        return hasAssociation(parent.definition, aname);
    } else {
        return false;
    }
}

function getAssociation(definition, aname) {
    if (definition.associations.hasOwnProperty(aname)) {
        return definition.associations[aname];
    } else if (definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        return getAssociation(parent.definition, aname);
    } else {
        console.log("Could not find association:", aname);
        return null;
    }
}

function shallowJSON(obj) {
    /*let object2d = null;
    let object3d = null;
    if(obj.definition.view) {
        if(obj.definition.view.object2d) {
            object2d = obj.definition.view.object2d();
        }
        if(obj.definition.view.object3d) {
            object3d = obj.definition.view.object3d();
        }
    }
     */
    let newAttributes = {id: obj._attributes.id, state: obj._state};
    for (let aname in obj._attributes) {
        if (obj.definition.attributes.hasOwnProperty(aname)) {
            if (obj.definition.attributes[aname].type !== 'ref') {
                newAttributes[aname] = obj._attributes[aname];
            }
        }
    }
    return {
        definition: {
            name: obj.definition.name,
            attributes: obj.definition.attributes,
            associations: obj.definition.associations,
            package: {
                shortname: obj.definition.package.shortname,
                name: obj.definition.package.name,
                color: obj.definition.package.color
            },
        },
        statenet: obj.statenet,
        _attributes: newAttributes
        // Shallow does not return the associations.
    };
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
}

async function _load(obj, args) {
    if(!obj._persist._clsName) {
        console.error("Object _load failed to find the class for this object!", obj);
    }
    let cls = AClass.getClass(obj._persist._clsName);
    if (cls.definition.methods.hasOwnProperty('load')) {

        let retval = await funcHandler.run(cls.definition.methods['load'], obj, args[0]);
        retval._state = obj._state;
        return retval;
    } else if (global.ailtire.config.persist) {
        const adaptor = global.ailtire.config.persist.adaptor;
        if (adaptor) {
            try {
                let retval = await adaptor.load(obj, args[0]);
                retval._state = obj._state;
                return retval;
            } catch (error) {
                console.error("Error in adaptor.load:", error);
                return null; // Handle errors appropriately
            }
        }
    }
    return null; // Fallback if no load method or adaptor exists
}


function _toJSON(obj) {
    let assocs = {};
    // this should always be the object's class not the parent class.
    obj.package = obj.definition.package.name.replace(/ /g, '');
    let definition = obj.definition;

    for (let i in obj._associations) {
        let assoc = obj._associations[i];
        if (hasAssociation(definition, i)) {
            let dassoc = getAssociation(definition, i);
            if (dassoc.cardinality === 1) {
                if (dassoc.owner) {
                    assocs[i] = assoc.toJSONShallow;
                } else if (dassoc.composition) {
                    assocs[i] = assoc.toJSON;
                } else {
                    assocs[i] = assoc.id;
                }
            } else {
                assocs[i] = {};
                for (let j in assoc) {
                    if (dassoc.owner) {
                        if (assoc[j]) {
                            assocs[i][j] = assoc[j].toJSONShallow;
                        }
                    } else if (dassoc.composition) {
                        if (assoc[j]) {
                            assocs[i][j] = assoc[j].toJSON;
                        }
                    } else {
                        if (assoc[j]) {
                            assocs[i][j] = assoc[j].id;
                        }
                    }
                }
            }
        } else {
            assocs[i] = assoc.id;
        }
    }
    // toJSON is same as toJSONShallow but it adds the associations.
    let retval = shallowJSON(obj);
    retval._associations = assocs;
    retval = _safeStringify(retval);
    return retval;
}

// Helper function to create a Proxy that transparently resolves a promise
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