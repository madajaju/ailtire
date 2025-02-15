const fs = require('fs');
const path = require('path');

const Renderer = require('../Documentation/Renderer');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    execute: async (action, inputs, env) => {
        let retval = await execute(action, inputs, env);
        return retval;
    },
    add: (route, action) => {
        let nroute = route.replaceAll(/\s/g, '').toLowerCase();
        global.actions[nroute] = action;
        global._server.all(nroute, async (req, res) => {
            await execute(action, req.query, {req: req, res: res});
        });
    },
    load: (server, prefix, mDir, config) => {
        if (server && !global._server) {
            global._server = server;
        }
        loadActions(prefix, mDir);
        mapToServices();
        if (server) {
            mapToServer(server, config);
        }
    },
    create: (pkg, path, details) => {
        global.actions[path] = details;
        global.actions[path].pkg = pkg.shortname; // If I put the object in here I geta circular reference.
        global.actions[path].obj = pkg.name;
        return global.actions[path];
    },
    defaults: (server) => {
        addForModels(server);
    },
    mapRoutes: (server, config) => {
        // Routes are mapped to action paths.
        for (let i in config.routes) {
            // Get Action handler from the actions.
            // let routeTarget = config.routes[i];
            if(config.routes[i].includes('layouts')) {
                   server.all(`/${config.routes[i]}`, (req, res) => {
                        let layout = config.routes[i].split('/')[1];  
                        return Renderer.render(layout, './index', {
                            app:{name: config.name},
                            name: config.name
                        });
                   }); 
            } else {
                let route = config.urlPrefix + '/' + i.toLowerCase();
                let action = find(config.routes[i]);
                if (action) {
                    if (route.includes('/upload')) {
                        server.post(route, global.upload.single('file-to-upload'), async (req, res) => {
                            await execute(action, req.query, {req: req, res: res});
                        });
                    } else {
                        server.all(route, async (req, res) => {
                            await execute(action, req.query, {req: req, res: res});
                        });
                    }
                } else {
                    console.error("Could not find the route: ", i, config.routes[i]);
                }
            }
        }
    },
    find: (name) => {
        return find(name);
    }
};

// Add ServiceProxy here.
const mergeMaps = (target, source) => {
    if (!target) {
        target = {};
    }
    if (typeof source === 'object') {
        for (let i in source) {
            if (!target[i]) {
                target[i] = {};
            }
            target[i] = mergeMaps(target[i], source[i]);
        }
        return target;
    } else {
        return source;
    }
};
const addForModels = (server) => {
    // This are the same actions for all of the standard action for the Models.
    // They are not copies but are references to the actions.
    // Anything you attach to these actions will show up in all of the default model actions.
    const newAction = require('./actions/new.js');
    const createAction = require('./actions/create.js');
    const destroyAction = require('./actions/destroy.js');
    const updateAction = require('./actions/update.js');
    const listAction = require('./actions/list.js');
    const showAction = require('./actions/show.js');
    const addAction = require('./actions/add.js');
    let act;
    const AClass = require('./AClass');
    for (let name in global.classes) {
        let cls = AClass.getClass(name);
        act = setAction(`/${name}/new`, newAction);

        act.obj = cls.definition.name;
        act.pkg = cls.definition.package;
        act.cls = cls.definition.name;

        // Check if Create method exists
        if (cls.definition.methods.hasOwnProperty('create')) {
            let ninputs = {};
            let oinputs = createAction.inputs;
            let cinputs = cls.definition.methods.create.inputs;
            for (let oname in oinputs) {
                ninputs[oname] = oinputs[oname];
            }
            for (let iname in cinputs) {
                ninputs[iname] = cinputs[iname];
            }
            let newCreate = {
                friendlyName: 'create',
                description: 'create entity',
                static: true,
                inputs: ninputs,
                exits: updateAction.exits,
                fn: createAction.fn
            }
            act = setAction(`/${name}/create`, newCreate);
            act.obj = cls.definition.name;
            act.pkg = cls.definition.package
            act.cls = cls.definition.name;
        } else {
            act = setAction(`/${name}/create`, createAction);
            act.obj = cls.definition.name;
            act.pkg = cls.definition.package;
            act.cls = cls.definition.name;
        }
        act = setAction(`/${name}/list`, listAction);
        act.obj = cls.definition.name;
        act.pkg = cls.definition.package;
        act.cls = cls.definition.name;
        act = setAction(`/${name}/destory`, destroyAction);
        act.obj = cls.definition.name;
        act.pkg = cls.definition.package;
        act.cls = cls.definition.name;
        let inputs = {};
        for (let aname in cls.definition.attributes) {
            let attr = cls.definition.attributes[aname];
            inputs[aname] = {
                type: attr.type,
                description: attr.description,
                required: false
            }
        }
        for (let aname in cls.definition.associations) {
            let assoc = cls.definition.associations[aname];
            if (assoc.cardinality !== 1) {
                let assocUpper = aname;
                assocUpper = assocUpper[0].toUpperCase() + assocUpper.slice(1);
                const newAddAction = {
                    friendlyName: `add${assocUpper}`,
                    description: addAction.description,
                    static: false,
                    inputs: addAction.inputs,
                    assocName: aname,
                    fn: addAction.fn
                };
                act = setAction(`/${name}/add${assocUpper}`, newAddAction);
                act.obj = cls.definition.name;
                act.pkg = cls.definition.package;
                act.cls = cls.definition.name;
            } else {
                inputs[aname] = {
                    type: 'object',
                    description: assoc.description,
                    required: false
                }
            }
        }

        act = setAction(`/${name}`, showAction);

        act.obj = cls.definition.name;
        act.pkg = cls.definition.package;
        act.cls = cls.definition.name;
        inputs.id = {
            type: 'string',
            description: 'ID of the item to update',
            required: false
        };
        inputs.name = {
            type: 'string',
            description: 'Name of the item to update',
            required: false
        };
        let newUpdateAction = {
            friendlyName: 'update',
            description: 'Update entity',
            static: true,
            inputs: inputs,
            exits: updateAction,
            fn: updateAction.fn
        }
        act = setAction(`/${name}/update`, newUpdateAction);
        act.obj = cls.definition.name;
        act.pkg = cls.definition.package;
        act.cls = cls.definition.name;
    }
};

const setAction = (route, action) => {
    route = route.toLowerCase();
    if (!global.actions) {
        global.actions = {};
    }
    if (!global.actions.hasOwnProperty(route)) {
        global.actions[route] = action;
    } else {
        console.log('Action', route, 'already exists');
    }
    return global.actions[route];
};

const loadActions = (prefix, mDir) => {
    let files = getFiles(mDir);
    for (let i in files) {
        let file = files[i].replace(/\\/g, '/');
        let aname = path.basename(file).replace('.js', '');
        let apath = prefix + '/' + aname;
        apath = apath.toLowerCase();
        setAction(apath, require(file));
    }
    let dirs = getDirectories(mDir);
    for (let i in dirs) {
        let dirname = path.basename(dirs[i]);
        let apath = prefix + '/' + dirname;
        apath = apath.toLowerCase();
        loadActions(apath, dirs[i]);
    }
};

const mapToServer = (server, config) => {
    for (let i in global.actions) {
        let gaction = global.actions[i];
        if (i[0] !== '/') {
            i = '/' + i;
        }
        let normalizedName = i.replace('/' + global.topPackage.shortname, '');
        if(normalizedName.includes('/upload')) {
            server.post('*' + normalizedName, async (req, res) => {
                req.url = req.url.replace(config.urlPrefix, '');
                await upload(gaction, req.query, {req: req, res: res});
            });   
        } else {
            server.post('*' + normalizedName, async (req, res) => {
                req.url = req.url.replace(config.urlPrefix, '');
                await execute(gaction, req.query, {req: req, res: res});
            });
            server.all('*' + normalizedName, async (req, res) => {
                req.url = req.url.replace(config.urlPrefix, '');
                await execute(gaction, req.query, {req: req, res: res});
            });
        }
        if (!config.hasOwnProperty('urlPrefix')) {
            config.urlPrefix = '';
        }
        normalizedName = config.urlPrefix + normalizedName;
        if(normalizedName.includes('/upload')) {
            if(global.upload) {
                server.post('*' + normalizedName, global.upload.single('file'), async (req, res) => {
                    req.url = req.url.replace(config.urlPrefix, '');
                    await upload(gaction, req.query, {req: req, res: res});
                });
            }
        } else {
            server.post('*' + normalizedName, async (req, res) => {
                req.url = req.url.replace(config.urlPrefix, '');
                await execute(gaction, req.query, {req: req, res: res});
            });
            server.all('*' + normalizedName, async (req, res) => {
                req.url = req.url.replace(config.urlPrefix, '');
                await execute(gaction, req.query, {req: req, res: res});
            });
        }
    }
};

const mapToServices = () => {
    for (let i in global.actions) {
        let gaction = global.actions[i];
        // Now add the the actions to the global space so they can be called programatically.
        let names = i.split(/\//);
        if (!global.hasOwnProperty('services')) {
            global.services = {};
        }
        let service = gaction.fn;
        for (let j = names.length - 1; j >= 0; j--) {
            if (names[j].length > 0) {
                let parent = {};
                parent[names[j]] = service;
                service = parent;
            }
        }
        // Now add the new service to the global space.
        global.services = mergeMaps(global.services, service);
    }
};
const upload = async (action, inputs, env) => {
    let finputs = {};
    for (let i in action.inputs) {
        let input = action.inputs[i];
        if (input.hasOwnProperty('required') && input.required) {
            if (inputs.hasOwnProperty(i)) {
                if (typeof inputs[i] === input.type) {
                    finputs[i] = inputs[i];
                } else {
                    console.error("Error with action:", action.friendlyName, action.description);
                    console.error("Type Mismatch for: ", i, "expecting", input.type, "got", typeof inputs[i]);
                }
            } else {
                //  console.error("Required parameter does not exist:", i);
            }
        }
    }
    for (let i in inputs) {
        if (action.inputs.hasOwnProperty(i)) {
            if (typeof inputs[i] === action.inputs[i].type) {
                finputs[i] = inputs[i];
            } else {
                console.warn("Warning with action:", action.friendlyName, action.description);
                console.error("Type Mismatch for: ", i, "expecting", action.inputs[i].type, "got", typeof inputs[i]);
                finputs[i] = inputs[i];
            }
        } else {
            finputs[i] = inputs[i];
            console.warn("Parameter:", i, " is not defined!");
        }
    }
    finputs.buffer = Buffer.from(env.req.body)
    // run the function
    const retval = await _executeFunction(action, finputs, env);
    return retval;
}

const execute = async (action, inputs, env) => {
    // check the iputs
    // Add the body of the env.req to the inputs.
    // This handles POST REST items.
    // This will overide the inputs from the query if they exist.
    if (env && env.hasOwnProperty('req') && env.req.hasOwnProperty('body')) {
        if (env.req.body.data) {
            for (let i in env.req.body.data) {
                inputs[i] = env.req.body.data[i];
            }
        } else {
            for (let i in env.req.body) {
                inputs[i] = env.req.body[i];
            }
        }
    }
    let finputs = {};
    for (let i in action.inputs) {
        let input = action.inputs[i];
        if (input.hasOwnProperty('required') && input.required) {
            if (inputs.hasOwnProperty(i)) {
                if (typeof inputs[i] === input.type) {
                    finputs[i] = inputs[i];
                } else {
                    console.error("Error with action:", action.friendlyName, action.description);
                    console.error("Type Mismatch for: ", i, "expecting", input.type, "got", typeof inputs[i]);
                }
            } else {
                //  console.error("Required parameter does not exist:", i);
            }
        }
    }
    for (let i in inputs) {
        if (action.inputs.hasOwnProperty(i)) {
            if (typeof inputs[i] === action.inputs[i].type) {
                finputs[i] = inputs[i];
            } else {
                console.warn("Warning with action:", action.friendlyName, action.description);
                console.error("Type Mismatch for: ", i, "expecting", action.inputs[i].type, "got", typeof inputs[i]);
                finputs[i] = inputs[i];
            }
        } else {
            finputs[i] = inputs[i];
            console.warn("Parameter:", i, " is not defined!");
        }
    }
    // run the function
    const retval = await _executeFunction(action, finputs, env);
    return retval;
};
const _processReturn = (action, retval, env) => {
    if (action.exits) {
        // Only send json if retval has something.
        if (retval) {
            try {
                if (env && env.res) {
                    if (!env.res.headersSent) {
                        if (action.exits.hasOwnProperty('json') && typeof action.exits.json === 'function') {
                            env.res.json(action.exits.json(retval));
                        } else if (action.exits.hasOwnProperty('json')) { // default return json in retval.
                            env.res.json(retval);
                        }
                    }
                }
            } catch (e) {
                console.error("Cannot send json for action:", e);
            }
        }
        if (action.exits.hasOwnProperty('success') && typeof action.exits.success === 'function') {
            return action.exits.success(retval);
        } else { // default just retval
            return retval;
        }
    }
    return retval;
};
const _executeFunction = async (action, inputs, env) => {
    // Default is to pass on the inputs.
    let retval = inputs;
    try {
        if (action.fn.constructor.name === 'AsyncFunction') {
            return (async () => {
                try {
                    let returnAsync = await action.fn(inputs, env);
                    return _processReturn(action, returnAsync, env);
                } catch (e) {
                    console.error("Error executing Function:", e);
                    throw e;
                }
            })();
        } else {
            retval = action.fn(inputs, env);
            return _processReturn(action, retval, env);
        }
    } catch (e) {
        for (let name in action.exits) {
            if (name === e.type) {
                retval = action.exits[name](e.inputs);
            }
        }
        if (env && env.res) {
            console.error("Error:", e);
            console.error("Error Message:", retval.message);
            // env.res.status(retval.status).json({error: retval.message });
        }
        console.log("Error:", e, retval);
        throw new Error(e, retval);
    }
}
const find = (name) => {
    const AClass = require('./AClass');
    if(typeof name !== "string") {
       console.error("String should be here:", name) ;
    }
    name = name.toLowerCase();
    // If you match the action name directly return.
    if (global.actions.hasOwnProperty(name)) {
        return global.actions[name];
    } else if (global.actions.hasOwnProperty('/' + name)) {
        return global.actions['/' + name];
    } else if (global.actions.hasOwnProperty(name.replace('/', ''))) {
        return global.actions[name.replace('/', '')];
    } else {
        let items = name.replace(/[\/\\]/g, '/').replace(/^\//, '').split('/');
        let nName = global.topPackage.shortname + '/' + items.join('/');
        if (global.actions.hasOwnProperty(nName)) {
            return global.actions[nName];
        } else if (global.actions.hasOwnProperty('/' + nName)) {
            return global.actions['/' + nName];
        } else {
            // Look for automatic actions like create, destroy, etc.
            // First look if the first name is a class. If it is then check the methods on the class.
            // If it is available then return that action.
            let cls = AClass.getClass(items[0]);
            if (cls) {
                if (cls.definition.methods.hasOwnProperty(items[1])) {
                    let retval = cls.definition.methods[items[1]];
                    retval.pkg = cls.definition.package;
                    retval.obj = cls.definition.name;
                    return retval;
                }
            }
            return null;
        }
    }
}
