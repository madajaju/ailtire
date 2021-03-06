const fs = require('fs');
const path = require('path');
const renderer = require('../Documentation/Renderer.js');
const AClass = require('./AClass');


const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    execute: (action, inputs, env) => {
        return execute(action, inputs, env);
    },
    load: (server, prefix, mDir, config) => {
        loadActions(prefix, mDir);
        mapToServices();
        if (server) {
            mapToServer(server, config);
        }
    },
    defaults: (server) => {
        addForModels(server);
    },
    mapRoutes: (server, config) => {
        // Routes are mapped to action paths.
        for (let i in config.routes) {
            // Get Action handler from the actions.
            let route = config.urlPrefix + i.toLowerCase();
            if (global.actions.hasOwnProperty(routes[i])) {
                console.log("Route:", route);
                server.all(route, (req, res) => {
                    execute(global.actions[routes[i]], req.query, {req: req, res: res});
                });
            } else {
                console.error("Could not find the route: ", i, routes[i]);
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

    for (let name in global.classes) {
        let cls = AClass.getClass(name);
        act = setAction(`/${name}/new`, newAction);

        act.obj = cls.definition.name;
        act.pkg = cls.definition.package;
        act.cls = cls.definition.name;

        // Check if Create method exists
        if(cls.definition.methods.hasOwnProperty('create')) {
            let ninputs = {};
            let oinputs = createAction.inputs;
            let cinputs = cls.definition.methods.create.inputs;
            for(let oname in oinputs) {
                ninputs[oname] = oinputs[oname];
            }
            for(let iname in cinputs) {
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
        }
        else {
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
        for(let aname in cls.definition.attributes) {
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
    if (!global.actions.hasOwnProperty(route)) {
        global.actions[route] = action ;
    }
    else {
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
        if (i[0] != '/') {
            i = '/' + i;
        }
        let normalizedName = i.replace('/' + global.topPackage.shortname,'' );
        server.all('*' + normalizedName, (req, res) => {
            req.url = req.url.replace(config.urlPrefix, '');
            execute(gaction, req.query, {req: req, res: res});
        });
        normalizedName = config.urlPrefix + normalizedName;
        server.all('*' + normalizedName, (req, res) => {
            req.url = req.url.replace(config.urlPrefix, '');
            execute(gaction, req.query, {req: req, res: res});
        });
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

const execute = (action, inputs, env) => {
    // check the iputs
    // Add the body of the env.req to the inputs.
    // This handles POST REST items.
    // This will overide the inputs from the query if they exist.
    if(env && env.hasOwnProperty('req') && env.req.hasOwnProperty('body')) {
        if(env.req.body.data) {
            for (let i in env.req.body.data) {
                inputs[i] = env.req.body.data[i];
            }
        }
        else {
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
                console.error("Error with action:", action.friendlyName, action.description);
                console.error("Type Mismatch for: ", i, "expecting", action.inputs[i].type, "got", typeof inputs[i]);
            }
        } else {
            finputs[i] = inputs[i];
            console.warn("Parameter:", i, " is not defined!");
        }
    }
    // run the function
    return action.fn(finputs, env);
};
const find = (name) => {
    name = name.toLowerCase();
    // If you match the action name directly return.
    if(global.actions.hasOwnProperty(name)) {
        return global.actions[name];
    }
    else if(global.actions.hasOwnProperty('/' + name)) {
        return global.actions['/' + name];
    }
    else if(global.actions.hasOwnProperty(name.replace('/', ''))) {
        return global.actions[name.replace('/','')];
    }
    else {
        let items = name.replace(/[\/\\]/g, '/').replace(/^\//, '').split('/');
        let nName = '/' + global.topPackage.shortname + '/' + items.join('/');
        if(global.actions.hasOwnProperty(nName)) {
            return global.actions[nName];
        }
        else {
            return null;
        }
    }
}
