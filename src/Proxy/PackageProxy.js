const handler = require('./ClassProxy');
const funcHandler = require('./MethodProxy');

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
                let retval = {};
                for(let i in obj.definition) {
                    if(typeof obj.definition[i] === 'object') {
                        retval[i] = {};
                        for(let j in obj.definition[i]) {
                            if (i === 'usecases') {
                                retval[i][j] = obj.definition[i][j];
                            }
                            else if(typeof obj.definition[i][j] === 'object') {
                                if(obj.definition[i][j].hasOwnProperty('toJSON')) {
                                    retval[i][j] = obj.definition[i][j].toJSON();
                                }
                                else {
                                    retval[i][j] = obj.definition[i][j];
                                }
                            }
                            else {
                                retval[i][j] = obj.definition[i][j];
                            }
                        }
                    }
                    else {
                        retval[i] = obj.definition[i];
                    }
                }
                return retval;
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

