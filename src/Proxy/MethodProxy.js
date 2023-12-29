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
            (async () => {
                return await method.fn(obj, args);
            })();
        } else {
            return method.fn(obj, args);
        }
    }
};

