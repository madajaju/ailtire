const fs = require('fs');
const path = require('path');
const renderer = require('../Documentation/Renderer.js');


const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    execute: (action, inputs, env) => {
        return execute(action, inputs, env);
    },
    load: (server, prefix, mDir) => {
        loadActions(prefix, mDir);
        mapToServices();
        if (server) {
            mapToServer(server);
        }
    },
    defaults: (server) => {
        addForModels(server);
    },
    mapRoutes: (server, routes) => {
        // Routes are mapped to action paths.
        for (let i in routes) {
            // Get Action handler from the actions.
            if (global.actions.hasOwnProperty(routes[i])) {
                server.use(i, (req, res) => {
                    execute(global.actions[routes[i]], req.query, {req: req, res: res});
                });
            } else {
                console.error("Could not find the route: ", i, routes[i]);
            }
        }

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
    const newAction = require('./actions/new.js');
    const createAction = require('./actions/create.js');
    const destroyAction = require('./actions/destroy.js');
    const updateAction = require('./actions/update.js');
    const listAction = require('./actions/list.js');
    const showAction = require('./actions/show.js');
    const addAction = require('./actions/add.js');
    for (let name in global.classes) {
        let cls = global.classes[name];
        setAction(`/${name}/new`, newAction);
        setAction(`/${name}/create`, createAction);
        setAction(`/${name}/update`, updateAction);
        setAction(`/${name}/list`, listAction);
        setAction(`/${name}/destory`, destroyAction);

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
                setAction(`/${name}/add${assocUpper}`, newAddAction);
            }
        }

        setAction(`/${name}`, showAction);
    }
};

const setAction = (route, action) => {
    if (!global.actions.hasOwnProperty(route)) {
        global.actions[route] = action;
    }
    /*else {
        console.log('Action', route, 'already exists');
    }*/
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

const mapToServer = (server) => {
    for (let i in global.actions) {
        let gaction = global.actions[i];
        if (i[0] != '/') {
            i = '/' + i;
        }
        server.all(i, (req, res) => {
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
    let finputs = {};
    for (let i in action.inputs) {
        let input = action.inputs[i];
        if (input.hasOwnProperty('required') && input.required) {
            if (inputs.hasOwnProperty(i)) {
                if (typeof inputs[i] === input.type) {
                    finputs[i] = inputs[i];
                } else {
                    console.error("Type Mismatch for: ", i, "expecting", input.type, "got", typeof inputs[i]);
                }
            } else {
                console.error("Required parameter does not exist:", i);
            }
        }
    }
    for (let i in inputs) {
        if (action.inputs.hasOwnProperty(i)) {
            if (typeof inputs[i] === action.inputs[i].type) {
                finputs[i] = inputs[i];
            } else {
                console.error("Type Mismatch for: ", i, "expecting", inputs.type, "got", typeof inputs[i]);
            }
        } else {
            finputs[i] = inputs[i];
            console.warn("Parameter:", i, " is not defined!");
        }
    }
    // run the function
    return action.fn(finputs, env);
};
