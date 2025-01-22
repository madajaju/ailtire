const express = require('express');
const server = express();
const http = require('http').createServer(server);
const path = require('path');
const sLoader = require('./Loader.js');
const AEvent = require('./AEvent.js');
const Action = require('./Action.js');
const multer  = require('multer');
const fs = require('fs');
// const redis = require('socket.io-redis');
const bodyParser = require("body-parser");
const upload = multer({dest: '.uploads/'});
const ASocketIOAdaptor = require('../Comms/ASocketIOAdaptor');

global.upload = upload;

const htmlGenerator = require('../Documentation/html');
const Renderer = require('../Documentation/Renderer');


// Here we are configuring express to use body-parser as middle-ware.
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Increased to pass architecture definitions.
server.use(bodyParser.urlencoded({limit:'100mb', extended: true}));
server.use(bodyParser.json({limit:'100mb'}));
server.use(bodyParser.raw());

server.use((req, res, next) => {
    const oldJSON = res.json;
    res.json = function(obj) {
        arguments[0] = _toJSON(obj);
        oldJSON.apply(res, arguments);
    };
    next();
});

// server.set('json replacer', circularReplacer());

module.exports = {
    docBuild: (config) => {
        normalizeConfig(config);
        global.ailtire = { config: config };
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        sLoader.analyze(topPackage);

        Action.defaults(server);
        //let ailPath = __dirname + "/../../interface";
        // Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'), config);
        // Action.mapRoutes(server, config.routes);
        htmlGenerator.index(config.prefix, apath + '/docs');
        htmlGenerator.package(global.topPackage, apath + '/docs');
        htmlGenerator.actors(global.actors, apath + '/docs');
        console.log("Built the Documentation");
    },
    addRoute: (path, fn) => {
        server.all(path, fn);
    },
    doc: (config) => {
        console.log("Serving documenration");
        normalizeConfig(config);
        global.ailtire = { config: config };
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        sLoader.analyze(topPackage);

        Action.defaults(server);
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'), config);
        standardFileTypes(config,server);
        server.get(`${config.urlPrefix}/doc/actor/*`, (req, res) => {
            let actorName = req._parsedUrl.pathname.replace(/\/doc\/actor\//, '');
            actorName = actorName.replace(config.urlPrefix,'');
            let apath = `${config.urlPrefix}/actors/${actorName}/index.html`;
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get(`${config.urlPrefix}/doc/usecase/*`, (req, res) => {
            let name = req._parsedUrl.pathname.replace(config.urlPrefix,'').replace(/\/doc\/usecase\//, '');
            // Name is Package.SubPackage.Name
            let names = name.split('/');
            let ucName = names.pop();
            let uidName = names.join('/');

            let apath = `${config.urlPrefix}/${uidName}/usecases/${ucName}/index.html`;
            res.redirect(apath)
        });
        server.get(`${config.urlPrefix}/doc/action/*`, (req, res) => {
            console.log("Calling Action:", req.url);
            let name = req._parsedUrl.pathname.replace(/\/doc\/action\//, '');
            name = name.replace(config.urlPrefix,'');
            console.log("Calling Action Name:", name);
            let action = Action.find(name);
            let pkg = action.pkg
            let apath = `${config.urlPrefix}${pkg.prefix}/index.html#Action-${name.replace(/\//g,'-')}`;
            res.redirect(apath);
            // res.sendFile('index.html', {root: apath});
        });
        server.get(`${config.urlPrefix}/doc/model/*`, (req, res) => {
            console.log("Calling Model:", req.url);
            let name = req._parsedUrl.pathname.replace(/\/doc\/model\//, '');
            name = name.replace(config.urlPrefix,'');
            console.log("Calling Model Name:", name);
            let names = name.split('/');
            let apath = "";
            if(names.length === 1) {
               if(global.classes.hasOwnProperty(names[0])) {
                   let cls = global.classes[names[0]].definition;
                   apath = `${cls.package.prefix}/models/${names[0]}/index.html`;
               } else {
                   console.log("Model not found");
               }
            } else {
                let mName = names.pop();
                let prefix = names.join('/');
                apath = `${config.urlPrefix}/${prefix}/models/${mName}/index.html`;
            }
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get(`${config.urlPrefix}/doc/package/*`, (req, res) => {
            let name = req._parsedUrl.pathname.replace(/\/doc\/package\//, '');
            name = name.replace(config.urlPrefix, '');
            let apath = `${config.urlPrefix}/${name}/index.html`;
            res.redirect(apath);
        });
        server.get(`${config.urlPrefix}`, (req, res) => {
            res.redirect(`.${config.urlPrefix}/index.html`);
        });
        server.get('*', (req,res) => {
            console.log("Nothing routed:", req.url);
            console.log("Config urlPrefix:", config.urlPrefix);
            res.redirect(`.${config.urlPrefix}/index.html`);
        });
        console.log("Serving up documentation on Port:", config.listenPort);
        http.listen(config.listenPort);
    },
    listen: (config) => {

        normalizeConfig(config);
        global.ailtire = { config: config };

        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        sLoader.analyze(topPackage);
        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath), config); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'), config);
        Action.mapRoutes(server, config);

        _setupAdaptors(config);
        _setupDefaultServices(config);

        standardFileTypes(config,server);

        server.get(`${config.urlPrefix}/init`, (req, res) => {
            let retval = {};
            for (let path in global.actions) {
                let prunedPath = path.replace('\/' + config.prefix,'');
                retval[prunedPath] = {
                    name: prunedPath,
                    inputs: global.actions[path].inputs,
                    friendlyName: global.actions[path].friendlyName,
                    description: global.actions[path].description
                };
            }
            res.json(retval);
        });

        server.get(`${config.urlPrefix}/`, (req, res) => {
            let str = mainPage(config);
            res.end(str);
        });
        server.get(`${config.urlPrefix}`, (req, res) => {
            let str = mainPage(config);
            res.end(str);
        });
        try {
            let mdirs = fs.readdirSync(path.resolve(config.baseDir + '/views/layouts'))
            for(let i in mdirs) {
                if(path.extname(mdirs[i]) === '.ejs') {
                    let basename = path.basename(mdirs[i], '.ejs');
                    server.all(`/${basename}`, (req, res) => {
                        config.layout = basename;
                        let str = mainPage(config);
                        res.end(str);
                    });
                }
            }
        } catch(e) {
            console.error("No Web Interface found!");
        }
        server.all('*', (req, res) => {
            console.error(`Config: ${config.urlPrefix}`)
            console.error("Catch All", req.originalUrl);
            // Look in the views directly for items to load.
            let str = findPage(req.originalUrl, config);
            res.end(str);
        });

        http.listen(config.listenPort, () => {
            console.log("Listening on port: " + config.listenPort);
            // call the post configuration script.
            if(config.hasOwnProperty('post')) {
                config.post(config);
                console.log("Done!");
            }
        });
    },
    micro: (config) => {
        normalizeConfig(config);
        global.ailtire = { config: config };

        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        /*if (config.hasOwnProperty('redis')) {
            io.adapter(redis({host: config.redis.host, port: config.redis.port}));
        }
        */
        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath), config); // Load the ailtire defaults from the interface directory.
        // The Package microservice does not have an api directory. Everything is in the baseDirectory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/interface'), config);
        Action.mapRoutes(server, config);

        _setupAdaptors(config);
        _setupDefaultServices(config);

        standardFileTypes(config,server);

        server.get(`${config.urlPrefix}/init`, (req, res) => {
            let retval = {};
            for (let path in global.actions) {
                let prunedPath = path.replace('\/' + config.prefix,'');
                retval[prunedPath] = {
                    name: prunedPath,
                    inputs: global.actions[path].inputs,
                    friendlyName: global.actions[path].friendlyName,
                    description: global.actions[path].description
                };
            }
            res.json(retval);
        });

        server.get(`${config.urlPrefix}/`, (req, res) => {
            let str = mainPage(config);
            res.end(str);
        });
        server.get(`${config.urlPrefix}`, (req, res) => {
            let str = mainPage(config);
            res.end(str);
        });
        let mdirs = fs.readdirSync(path.resolve(config.baseDir + '/views/layouts'))
        for(let i in mdirs) {
            if(path.extname(mdirs[i]) === '.ejs') {
                let basename = path.basename(mdirs[i], '.ejs');
                server.all(`/${basename}`, (req, res) => {
                    config.layout = basename;
                    let str = mainPage(config);
                    res.end(str);
                });
            }
        }
        
        server.all('*', (req, res) => {
            console.error(`Config: ${config.urlPrefix}`)
            console.error("Catch All", req.originalUrl);
            // Look in the views directly for items to load.
            let str = findPage(req.originalUrl, config);
            res.end(str);
        });

        console.log("Micro Service Interface:", Object.keys(global.actions).join(",\n"));
        http.listen(config.listenPort, () => {
            console.log("Listening on port: " + config.listenPort);
            // call the post configuration script.
            if(config.hasOwnProperty('post')) {
                config.post(config);
                console.log("Done!");
            }
        });
    },
    start: (config) => {
        normalizeConfig(config);
        // let apath = path.resolve(config.baseDir);

        Action.defaults();
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'));
        Action.defaults(server);
        Action.mapRoutes(server, config.routes);

        standardFileTypes(config,server);
        server.get('/', (req, res) => {
            let str = mainPage(config);
            res.end(str);
        });

    }
}

function mainPage(config) {
    let layout = config.layout || 'default';
    return Renderer.render(layout, './index', {
        app: {name: config.name},
        name: config.name,
    });
}
function findPage(page, config) {
    let npage = page.replace(config.urlPrefix, '');
    // Do not add the layout again.
    return Renderer.renderPage(npage, {
        app: {name: config.name},
        name: config.name,
    });
}

function normalizeConfig(config) {
    config.port = config.port || 3000;
    config.host = config.host || 'localhost';
    config.urlPrefix = config.urlPrefix || '/';
    config.name = config.name || 'service';
    config.externalURL = config.externalURL || `localhost/${config.urlPrefix}`;
    config.internalURL = config.internalURL || `${config.host}:${config.port}`;
    config.instanceName = config.instanceName || process.env.AILTIRE_STACKNAME;
}

function findStaticFile(config, apath) {
    config.staticPaths = config.staticPaths || [ path.resolve('.'), path.resolve(`./views`), path.resolve(`./assets`) ];
    let paths = config.staticPaths;
    paths.push(path.resolve(`${__dirname}/../../assets`));
    for(let i in paths) {
        let checkPath = path.resolve(`${paths[i]}/${apath}`);
        if(fs.existsSync(checkPath)) {
            return checkPath    
        }
    }
}
function standardFileTypes(config,server) {

    server.get(`${config.urlPrefix}/styles/*`, (req, res) => {
        let apath = findStaticFile(config, req._parsedUrl.pathname.replace(config.urlPrefix,''));
        // let str = fs.readFileSync(apath, 'utf8');
        res.sendFile(apath);
    });
    server.get(`${config.urlPrefix}/js/*`, (req, res) => {
        let apath = findStaticFile(config, req._parsedUrl.pathname.replace(config.urlPrefix,''));
        if(apath) {
            res.sendFile(apath);
        } else {
            console.log(req._parsedUrl.pathname, "Not found!");
        }
    });
    server.get(`${config.urlPrefix}/views/*`, (req, res) => {
        let apath = findStaticFile(config, req._parsedUrl.pathname.replace(config.urlPrefix,''));
        res.sendFile(apath);
    });
    server.get('*.html', (req, res) => {
        let apath = path.resolve('./docs/' + req._parsedUrl.pathname.replace(config.urlPrefix,'')).toLowerCase();
        apath = apath.toLowerCase();
        res.sendFile(apath);
    });
    server.get('*.png', (req, res) => {
        let apath = path.resolve('./docs/' + req._parsedUrl.pathname.replace(config.urlPrefix,''));
        apath = apath.toLowerCase();
        if (fs.existsSync(apath)) {
            res.sendFile(apath);
        }
        else {
            res.end(apath + " not found!!");
        }
    });
    server.get('*.jpg', (req, res) => {
        let apath = path.resolve('./docs/' + req._parsedUrl.pathname.replace(config.urlPrefix,''));
        apath = apath.toLowerCase();
        if (fs.existsSync(apath)) {
            res.sendFile(apath);
        }
        else {
            res.end(apath + " not found!!");
        }
    });
    server.get('*.puml', (req, res) => {
        let apath = path.resolve('./docs/' + req._parsedUrl.pathname.replace(config.urlPrefix,''));
        apath = apath.toLowerCase();
        let svgPath = apath.replace(/.puml$/, '.png');
        if (fs.existsSync(svgPath)) {
            res.set('Content-Type', 'image/svg+xml');
            res.sendFile(svgPath);
        } else {
            console.log(req._parsedUrl.pathname.replace(config.urlPrefix,'') + ' not found!');
            console.log(apath + ' file not found!');
            res.end(req._parsedUrl.pathname.replace(config.urlPrefix,'') + ' not found!');
        }
    });
}
function _toJSON(obj) {
    let cache = new Set();
    function clone(obj) {
        // if it is a primitive or function, return as is
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        // if circular detected, return undefined
        if (cache.has(obj)){
            return undefined;
        }
        cache.add(obj);
        // handle Array
        if (Array.isArray(obj)) {
            let newArray = [];
            for(let value of obj){
                newArray.push(clone(value));
            }
            return newArray;
        }
        // handle generic object
        let newObj = {};
        for(let key in obj){
            newObj[key] = clone(obj[key]);
        }
        return newObj;
    }
    let retval = clone(obj);
    return retval;
}

function _setupDefaultServices(config) {
    const AStack = require('./AStack');
    const design = require(`${__dirname}/../Services/services.js`);
    
    AStack.load('ailtire', 'local', design);
}
function _setupAdaptors(config) {
    global.ailtire.comms = { services: []};

    // Default should always be there. This is the websocket socket.io that communicates with the webinterface.
    let myconfig = {
        urlPrefix: config.urlPrefix,
        http: http,
    }
    global.ailtire.comms.services.push( new ASocketIOAdaptor(myconfig) );
    if(config.comms) {
        for(let i in config.comms) {
            let comms = config.comms[i];
            comms.http = http;
            comms.urlPrefix = config.urlPrefix;
            global.ailtire.comms.services.push( new comms.adaptor({comms: comms}) );
        }
    }
    if(config.ai) {
        let aiAdaptor = config.ai.adaptor;
        global.ai = new aiAdaptor(config.ai);
        // this might need an await.
        global.ai.init();
    }
    if(config.persist) {
        let pAdaptor = config.persist.adaptor;
        pAdaptor.loadAll();
    }
}
