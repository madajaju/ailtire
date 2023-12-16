const bent = require('bent');
const fs = require('fs');
const path = require('path');
const Action = require('./Action.js');

module.exports = {
    call: (actionName, opts, env) => {
        let actions = actionName.split('.');
        let action = _findAction(actions);
        if (action && action.fn) {
           let args = _processArguments(action, opts);
           return Action.execute(action, args, env);
        } else {
            console.log("Could not find local Service:", actionName);
            console.log("Running via REST service!");
            let url = 'https://' + global.ailtire.config.internalURL;
            const post = bent(url, 'POST', 'string', 200);
            const astring = actions.join('/');
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
    let aname = '/' + global.topPackage.shortname + '/' + actions.join('/');
    aname = aname.toLowerCase();
    if(global.actions.hasOwnProperty(aname)) {
        return global.actions[aname];
    }
}
const _processArguments = (action, opts)  => {
    let retval = {};
    for(let name in opts) {
        if(action.inputs.hasOwnProperty(name)) {
            if(action.inputs[name].type === 'file') {
                // get the file and store it in the data variable
                try {
                    let apath = path.resolve(process.cwd() + '/' + opts[name]);
                                        if(fs.existsSync(apath)) {
                                            let contents = fs.readFileSync(apath, 'utf-8');
                                            retval[name] = {data: contents};
                                        } else {
                            retval[name] = {data: opts[name]};
                                        }
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
