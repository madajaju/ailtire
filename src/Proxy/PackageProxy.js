const handler = require('./ClassProxy');
const funcHandler = require('./MethodProxy');
const {parse, stringify, toJSON, fromJSON} = require('flatted');

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
        if(prop === 'definition') {
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
                } catch(e) {
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
        if(obj.definition.hasOwnProperty(prop)) {
            return obj.definition[prop];
        } else {
            return obj[prop];
        }
    },
    set: (obj, prop, value) => {
        if (!obj.hasOwnProperty('definition')) {
            obj.definition = {};
        }
        obj.definition[prop] = value;
        return true;
    },
    construct: (target, args) => {
        let obj = new Proxy(target, handler);
        //   target.proxy = obj;
        return obj;
    },
};

function _toJSON(obj) {
    let jsonCache = [];
    let retval =  JSON.stringify(obj, (key, value) => {
        if(typeof value === 'object' && value !== null) {
            if(jsonCache.includes(value)) return;
            jsonCache.push(value);
        }
        return value;
    });
    jsonCache = null;
    return retval
}