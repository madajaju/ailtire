const addToRegex = /^addTo/;
const hasInRegex = /^hasIn/;
const removeFromRegex = /^removeFrom/;
const clearRegex = /^clear/;
const funcHandler = require('./MethodProxy');
const stateNetHandler = require('./StateNetProxy');
const AClass = require('../Server/AClass');

let toJSONDepth = 10;

module.exports = {
    get: (obj, prop) => {
        // Check and set _attributes and _associations
        try {
            let definition = obj.definition;
            return getHandler(obj, definition, prop);
        } catch (e) {
            console.error("Get cannot find ", prop);
            console.error(e);
            return null;
        }
    },
    set: (obj, prop, value) => {
        // Check if the class has the attribute
        if (!obj.hasOwnProperty('definition')) {
            console.error("Missing \"definition\" property value for ", obj);
            return false;
        }
        if (!obj.hasOwnProperty('_attributes')) {
            obj._attributes = {};
        }
        if (obj.definition.hasOwnProperty('attributes')) {
            if (obj.definition.attributes.hasOwnProperty(prop)) {
                // Check for attributes first
                if (typeof value === obj.definition.attributes[prop].type) {
                    obj._attributes[prop] = value;
                } else if (typeof value === 'object' && obj.definition.attributes[prop].type === 'json') {
                    obj._attributes[prop] = value;
                } else {
                    // console.error("Data Type Mismatch: ", prop, " wants a ", obj.definition.attributes[prop], " but got ", typeof value);
                    obj._attributes[prop] = value;
                    return false;
                }
                return true;
            }
        }
        if (!obj.hasOwnProperty('_associations')) {
            obj._associations = {};
        }
        if (obj.definition.hasOwnProperty('associations')) {
            if (hasAssociation(obj.definition,prop)) {
                // Check for associations
                // Make the assignment if it is an object.
                if (getAssociation(obj.definition,prop).cardinality === 'n') {

                    // Store things as an array or a map.
                    if (Array.isArray(value)) {
                        obj._associations[prop] = value;
                        return true;
                    } else {
                        console.error("Expecting an array, recieved a ", typeof value);
                        return false;
                    }
                } else {

                    if (typeof value === 'object' && !Array.isArray(value)) {
                        if (value.definition.name === getAssociation(obj.definition,prop).type) {
                            obj._associations[prop] = value;
                            return true;
                        } else {
                            console.error("Assignment is the wrong type: ", getAssociation(obj.definition,prop).type, " expected, recieved ", value.definition.name);
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

        } else {
            // console.warn("Not defined attribute ", prop, ": Assigned ", value, " to ", prop, " anyway!!");
            obj._attributes[prop] = value;
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
    if (!obj.hasOwnProperty('_attributes')) {
        obj._attributes = {};
    }
    if (!obj.hasOwnProperty('_associations')) {
        obj._associations = {};
    }
    if (prop === 'name') {
        if (obj._attributes.name) {
            return obj._attributes.name;
        } else {
            //return obj._attributes.id;
            return "";
        }
    } else if (prop === 'className') {
        return obj.definition.name;
    } else if (prop === 'package') {
        return obj.definition.package;
    } else if (prop === 'state') {
        return obj._state;
    } else if (prop === 'toJSON') {
        let assocs = {};
        if (toJSONDepth) {
            // this should always be the object's class not the parent class.
            obj.package = obj.definition.package.name.replace(/ /g, '');
            for (let i in obj._associations) {
                let assoc = obj._associations[i];
                if(hasAssociation(obj.definition, i)) {
                    let dassoc = getAssociation(definition, i);
                    if (dassoc.cardinality === 1) {
                        if (dassoc.owner) {
                            toJSONDepth--;
                            assocs[i] = assoc.toJSON;
                            toJSONDepth++;
                        } else {
                            toJSONDepth--;
                            assocs[i] = assoc.id;
                            toJSONDepth++;
                        }
                    } else {
                        assocs[i] = {};
                        for (let j in assoc) {
                            if (dassoc.owner) {
                                toJSONDepth--;
                                if (assoc[j]) {
                                    assocs[i][j] = assoc[j].toJSON;
                                }
                                toJSONDepth++;
                            } else {
                                toJSONDepth--;
                                if (assoc[j]) {
                                    assocs[i][j] = assoc[j].id;
                                }
                                toJSONDepth++;
                            }
                        }
                    }
                } else {
                    toJSONDepth--;
                    assocs[i] = assoc.toJSON;
                    toJSONDepth++;
                }
            }
            return {
                _attributes: obj._attributes,
                _associations: assocs
            }
        } else {
            return {};
        }
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
            let toberemoved = [];
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
                    return funcHandler.run(definition.methods[prop], this, args[0]);
                }
            } else {
                let myDef = obj.definition;

                while (myDef) {
                    if (myDef.hasOwnProperty('extends')) {
                        let parent = myDef.extends;
                        let newObj = AClass.getClass(parent);
                        myDef = newObj.definition;
                        if (myDef.methods.hasOwnProperty('create')) {
                            return funcHandler.run(myDef.methods.create, this, args[0]);
                        }
                    } else {
                        myDef = null;
                    }
                }
                // If the while loop exits without returning the use a default create.
                for (let name in args[0]) {
                    this[name] = args[0][name];
                }
                // Return the proxy.
                return this;
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
                let dassoc = getAssociation(definition,name);
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
        return obj._associations[prop];
        // Check if the association definition is defined if so then return an empty array or null
    } else if (hasAssociation(obj.definition, prop)) {
        if (getAssociation(obj.definition,prop).cardinality === 1) {
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
    } else if (hasStateNet(definition)) {
        return function (...args) {
            return stateNetHandler.processEvent(this, obj, prop, args);
        }
    }
    // Now check for methods that are called.
    else if (definition.methods.hasOwnProperty(prop)) {
        return function (...args) {
            if (!definition.methods[prop].static) {
                if (hasStateNet(definition)) {
                    return stateNetHandler.processEvent(this, obj, prop, args);
                } else {
                    return funcHandler.run(definition.methods[prop], this, args[0]);
                }
            } else {
                console.error("Cannot call class method with an object. Call with class from ", definition.name + "." + prop + "(...);");
                return undefined;
            }
        }
    } else {
        throw new Error(`Could not find ${prop}! on ${obj.name}`);
    }
}

function addToAssoc(simpleProp, obj, proxy, item) {
    let child = null;
    if(item === null) { // do not add a null to the assoication
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
            if(!hasAssociation(obj.definition,simpleProp)) {
                console.error("Cannot Add to unknown property:", simpleProp);
                return;
            }
            if (isTypeOf(item, getAssociation(obj.definition,simpleProp).type)) {
                child = item;
            } else {
                console.error(prop, "wrong type of object! Recieved:", item.definition.name, 'expecting', getAssociation(obj.definition,simpleProp).type);
                return;
            }
        } else {
            let newClass = AClass.getClass(getAssociation(obj.definition,simpleProp).type);
            child = new newClass(item);
        }
    }
    if (getAssociation(obj.definition,simpleProp).unique) {
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
    if (getAssociation(obj.definition,simpleProp).hasOwnProperty('via')) {
        let via = getAssociation(obj.definition,simpleProp).via;
        child[via] = proxy;
    }
    return child;
}

function isTypeOf(item, type) {
    if (item.definition.name === type) {
        return true;
    } else {
        if (item.definition.extends === type) {
            return true;
        } else {
            return false;
        }
    }
}

function hasStateNet(definition) {
    if(definition.hasOwnProperty('statenet')) {
        return true;
    } else if(definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        return hasStateNet(parent.definition);
    } else {
        return false;
    }
}
function hasAssociation(definition, aname) {
    if(definition.associations.hasOwnProperty(aname)) {
        return true;
    } else if(definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        return hasAssociation(parent.definition,aname);
    } else {
        return false;
    }
}

function getAssociation(definition, aname) {
    if(definition.associations.hasOwnProperty(aname)) {
        return definition.associations[aname];
    } else if(definition.hasOwnProperty('extends')) {
        let parent = AClass.getClass(definition.extends);
        console.log("Get Association Parent:", aname);
        console.log("CHILD:", Object.keys(definition.associations));
        console.log("PARENT:", Object.keys(parent.definition.associations));
        return getAssociation(parent.definition,aname);
    } else {
        console.log("Could not find association:", aname);
        return null;
    }
}
