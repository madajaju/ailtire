const bent = require('bent');
const fs = require('fs');
const path = require('path');
const Action = require('./Action.js');


module.exports = {
    call: async (actionName, opts, env) => {
        const Action = require('./Action.js');
        let action = _findAction(actionName);
        // If the action is being called internally we need to fake the url in the req.
        if(!env) {
            env = { req:{ url: `/${actionName}` }};
        }
        if(!env.req) {
            env.req = `/${actionName}`;
        }
        if (action && action.fn) {
           let args = _processArguments(action, opts);
           try {
               return await Action.execute(action, args, env);
           }
           catch(e) {
               console.error(actionName);
               console.error("Action Execute Error:", e);
               throw e;
           }
        } else {
            console.log("Could not find local Service:", actionName);
            console.log("Running via REST service!");
            let url = 'https://' + global.ailtire.config.internalURL;
            const post = bent(url, 'POST', 'string', 200);
            const astring = actionName;
            (async () => {
                try {
                        return await post('/' + astring, opts);

                } catch (e) {
                    console.error("POST: ", astring, opts);
                    console.error("AServer call Response Error:", e);
                    // throw new Error(e);
                }
            })();
        }
    }
};

const _findAction = (actions) => {
    const Action = require('./Action');
    return Action.find(actions);
}
const _processArguments = (action, opts)  => {
    let retval = {};
    for(let name in opts) {
        if(action.inputs.hasOwnProperty(name)) {
            if(action.inputs[name].type === 'file') {
                // get the file and store it in the data variable
                try {
                    let apath = path.resolve(process.cwd() + '/' + opts[name]);
                    let contents = fs.readFileSync(apath, 'utf-8');
                    retval[name] = {data: contents};
                }
                catch(e) {
                    console.error("File error:", e);
                    throw new Error(e);
                }
            } else {
                retval[name] = opts[name];
            }
        } else {
            retval[name]= opts[name];
        }
    }
    return retval;
}
