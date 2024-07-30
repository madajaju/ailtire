module.exports = {
    run: (method, obj, args) => {
        // Check that the parameters are valid.

        /*
        for(let i in args) {
            if(!method.inputs.hasOwnProperty(i)) {
                console.error("Parameter is not defined", i);
            }
            else {
                if(method.inputs[i].type === 'YAML' && typeof args[i] !== 'object') {
                    console.error("Method:", method.description, " Parameter:", i, "is the wrong type. Got", typeof args[i], "looking for", method.inputs[i].type);
                }
               else if(method.inputs[i].type !== typeof args[i]) {
                  console.error("Method:", method.description, " Parameter:", i , "is the wrong type. Got", typeof args[i], "looking for", method.inputs[i].type);
               }
            }
        }
         */
        // Execute the function with the validated parameters.
        // this needs to check for an async function call.
        // If it does have one return with await.
        if(method.fn.constructor.name === "AsyncFunction") {
            return (async () => {
                let retval = await method.fn(obj, args);
                return await _processReturnAsync(method, retval, args);
            })();
        } else {
            let retval = method.fn(obj, args);
            return _processReturn(method, retval, args);
        }
    }
};

function _processReturn (method, retval, env) {
    if (method.exits) {
        // Only send json if retval has something.
        if (retval) {
            try {
                if (env && env.res) {
                    if (method.exits.hasOwnProperty('json') && typeof method.exits.json === 'function') {
                        env.res.json(method.exits.json(retval));
                    } else if (method.exits.hasOwnProperty('json')) { // default return json in retval.
                        env.res.json(retval);
                    }
                }
            } catch (e) {
                console.error("Cannot send json for method:", e);
            }
        }
        if (method.exits.hasOwnProperty('success') && typeof method.exits.success === 'function') {
             return method.exits.success(retval);
        } else { // default just retval
            return retval;
        }
    }
    return retval;
};

function _processReturnAsync(method, retval, env) {
    if (method.exits) {
        // Only send json if retval has something.
        if (retval) {
            try {
                if (env && env.res) {
                    if (method.exits.hasOwnProperty('json') && typeof method.exits.json === 'function') {
                        env.res.json(method.exits.json(retval));
                    } else if (method.exits.hasOwnProperty('json')) { // default return json in retval.
                        env.res.json(retval);
                    }
                }
            } catch (e) {
                console.error("Cannot send json for method:", e);
            }
        }
        if (method.exits.hasOwnProperty('success') && typeof method.exits.success === 'function') {
                return method.exits.success(retval);
        } else { // default just retval
            return retval;
        }
    }
    return retval;
};