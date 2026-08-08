const express = require('express');
const server = express();
const http = require('http').createServer(server);
const path = require('path');
const Action = require('./Action.js');
const multer  = require('multer');
const fs = require('fs');
// const redis = require('socket.io-redis');
const bodyParser = require("body-parser");
const upload = multer({dest: '.uploads/'});
const ASocketIOAdaptor = require('../Comms/ASocketIOAdaptor');

const BootStrap = require('../../src/BootStrap');

const {McpServer} = require('@modelcontextprotocol/sdk/server/mcp.js');
const {StreamableHTTPServerTransport} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");

global.upload = upload;
global.ailtire = global.ailtire || {};
_instances = global._instances || {};

const htmlGenerator = require('../Documentation/html');
const Renderer = require('../Documentation/Renderer');
let ailtireBaseDir = path.resolve(__dirname, '../..');
ailtire = global.ailtire || { config: { baseDir: ailtireBaseDir }};

// Here we are configuring express to use body-parser as middle-ware.

// server.set('json replacer', circularReplacer());

module.exports = {
    listen: async (config) => {

    // This loads everything.
        global.ailtire.config = config;
        global.ailtire.baseDir = config.baseDir || ailtireBaseDir;
        
        BootStrap.init(ailtireBaseDir);
        ARole.loadAll();
        AActor.loadAll({dir: path.resolve(ailtireBaseDir, "actors")});
        console.log(global.ailtire.baseDir);
        console.log(ailtireBaseDir);
        _loadRuntimeTarget(config);

        server.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            res.header("Access-Control-Allow-Private-Network", "true");
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
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

        normalizeConfig(config);
        global.ailtire = global.ailtire || {};  
        global.ailtire.config = config;

        // Action.defaults(server);
        if(config.mcp) {
            let mcpServer = new McpServer({name: config.name, version: config.version});
            config.mcpServer = mcpServer;
        }

        Action.load(server, "/api/", config);
        // Action.mapRoutes(server, config);

        standardFileTypes(config, server);
        await _setupAdaptors(config);
        _setupPeerConnections(config);
        _setupDefaultServices(config);

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
        /*
        server.all('*', (req, res) => {
            console.error(`Config: ${config.urlPrefix}`)
            console.error("Catch All", req.originalUrl);
            // Look in the views directly for items to load.
            let str = findPage(req.originalUrl, config);
            res.end(str);
        });

         */

        http.listen(config.listenPort, () => {
            console.log("Listening on port: " + config.listenPort);
            // call the post configuration script.
            if(config.hasOwnProperty('post')) {
                config.post(config);
                console.log("Done!");
            }
        });
    },
}

function _loadRuntimeTarget(config) {
    let target = _normalizeRuntimeTarget(config);

    if(target.type === 'microservice') {
        _loadMicroserviceTarget(config, target);
        return;
    }

    _loadApplicationTarget(config);
}

function _loadApplicationTarget(config) {
// If the working directory is the same as the ailtire then do not load the application.
    if(ailtireBaseDir !== global.ailtire.baseDir) {
        AApplication.load({dir: config.baseDir});
        ailtire.baseDir = ailtireBaseDir;
    } else {
        AApplication.load({dir: global.ailtire.baseDir});
        console.log("Skipping loading");
    }
}

function _loadMicroserviceTarget(config, target) {
    let manifest = _resolveMicroserviceManifest(config, target);
    let packageEntries = _normalizeMicroservicePackages(manifest);

    if(packageEntries.length === 0) {
        throw new Error('Microservice target requires at least one package entry.');
    }

    let rootPackage = _createMicroserviceRoot(config, manifest);
    let loadedPackages = {};
    for(let i in packageEntries) {
        let entry = packageEntries[i];
        let packageDir = _resolvePackageDir(config.baseDir, entry.path || entry.dir || entry);
        let prefix = entry.prefix || manifest.prefix;
        let pkg = APackage.load({dir: packageDir, prefix: prefix});
        let packageKey = pkg.name.replace(/\s/g, '');
        loadedPackages[packageKey] = pkg;
        rootPackage.subpackages[packageKey] = pkg;
    }

    let actors = AActor.loadAll({dir: path.resolve(config.baseDir, 'actors')}) || {};
    let notes = ANote.loadAll({dir: path.resolve(config.baseDir, '.notes')}) || {};

    global.topPackage = rootPackage;
    global.application = {
        name: manifest.name || config.name || rootPackage.name,
        type: 'microservice',
        dir: path.resolve(config.baseDir),
        package: rootPackage,
        packages: loadedPackages,
        actors: actors,
        notes: notes,
        manifest: manifest,
    };
}

function _normalizeRuntimeTarget(config) {
    if(!config.target) {
        return {type: 'application'};
    }
    if(typeof config.target === 'string') {
        return {type: config.target.toLowerCase()};
    }
    return {
        ...config.target,
        type: (config.target.type || 'application').toLowerCase(),
    };
}

function _resolveMicroserviceManifest(config, target) {
    if(target.manifest && typeof target.manifest === 'object') {
        return target.manifest;
    }
    if(config.microservice && typeof config.microservice === 'object' && !Array.isArray(config.microservice)) {
        return config.microservice;
    }

    let manifestPath = target.manifest || config.microservice;
    if(manifestPath) {
        let resolvedPath = path.resolve(config.baseDir, manifestPath);
        return require(resolvedPath);
    }

    return {
        name: config.name,
        shortname: config.name,
        packages: config.packages || config.packageDirs || [],
    };
}

function _normalizeMicroservicePackages(manifest) {
    let packages = manifest.packages || manifest.packageDirs || manifest.modules || [];
    if(!Array.isArray(packages)) {
        return [packages];
    }
    return packages;
}

function _resolvePackageDir(baseDir, packageRef) {
    let resolvedDir = path.resolve(baseDir, packageRef);
    if(fs.existsSync(path.resolve(resolvedDir, 'index.js'))) {
        return resolvedDir;
    }
    let apiDir = path.resolve(resolvedDir, 'api');
    if(fs.existsSync(path.resolve(apiDir, 'index.js'))) {
        return apiDir;
    }
    throw new Error(`Could not resolve microservice package directory: ${packageRef}`);
}

function _createMicroserviceRoot(config, manifest) {
    let serviceName = manifest.name || config.name || 'microservice';
    let shortname = (manifest.shortname || serviceName).replace(/\s/g, '');
    let rootPackage = new APackage({
        name: serviceName,
        shortname: shortname,
        description: manifest.description || `Microservice ${serviceName}`,
        prefix: manifest.prefix || `/${shortname.toLowerCase()}`,
        dir: path.resolve(config.baseDir),
        depends: [],
    });

    rootPackage.classes = {};
    rootPackage.handlers = {};
    rootPackage.interface = {};
    rootPackage.usecases = {};
    rootPackage.workflows = {};
    rootPackage.subpackages = {};
    rootPackage.events = {};
    rootPackage.deploy = manifest.deploy || {};
    rootPackage.doc = manifest.doc || {basedir: path.resolve(config.baseDir, 'doc'), files: []};

    return rootPackage;
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
    // Check in model views
    if (apath.startsWith('/views/')) {
        let parts = apath.split('/');
        let className = parts[2];
        if (global.classes && global.classes[className]) {
            let modelDir = global.classes[className].definition.dir;
            let subPath = parts.slice(3).join('/');
            let checkPath = path.resolve(`${modelDir}/views/${subPath}`);
            if (fs.existsSync(checkPath)) {
                return checkPath;
            }
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
    // const design = require(`${__dirname}/../Services/services.js`);
    
    // AStack.load('ailtire', 'local', design);
}
async function _setupAdaptors(config) {
    global.ailtire.comms = { services: []};

    // Default should always be there. This is the websocket socket.io that communicates with the webinterface.
    let myconfig = {
        urlPrefix: config.urlPrefix,
        http: http,
    }
    global.ailtire.comms.services.push( new ASocketIOAdaptor(myconfig) );
    myconfig.urlPrefix = '/design';
    global.ailtire.comms.services.push( new ASocketIOAdaptor(myconfig) );
    if(config.comms) {
        for(let i in config.comms) {
            let comms = config.comms[i];
            comms.http = http;
            comms.urlPrefix = config.urlPrefix;
            global.ailtire.comms.services.push( new comms.adaptor(comms) );
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
        if (pAdaptor && typeof pAdaptor.loadAll === 'function') {
            await Promise.resolve(pAdaptor.loadAll());
        }
    }
}

function _setupPeerConnections(config) {
    // Peer connections are initiated during startup, but ASocketIOAdaptor
    // keeps retrying until the peer is available. This makes startup order
    // independent and also allows peers to restart without reconfiguration.
    let peers = _peersFromDeployment(config);
    if (peers.length === 0) {
        peers = config.peers || config.servers || [];
    }
    if (!Array.isArray(peers)) {
        peers = [peers];
    }

    for (const peer of peers) {
        if (!peer || !peer.url) {
            console.error('Skipping websocket peer without a URL', peer);
            continue;
        }

        for (const commsService of global.ailtire.comms.services) {
            if (typeof commsService.connect === 'function') {
                commsService.connect(peer);
            }
        }
    }
}

function _peersFromDeployment(config) {
    const environments = global.deploy?.envs;
    if (!environments) return [];

    const environmentName = config.environment || process.env.AILTIRE_ENV;
    const environment = environmentName
        ? Object.values(environments).find(envs => envs[environmentName])?.[environmentName]
        : Object.values(environments)[0] && Object.values(environments)[0][Object.keys(Object.values(environments)[0])[0]];
    const services = environment?.definition?.services || {};
    const currentName = config.serviceName || process.env.AILTIRE_SERVICE_NAME || config.name;
    const peers = [];

    for (const [name, service] of Object.entries(services)) {
        if (name === currentName) continue;
        for (const [route, endpoint] of Object.entries(service.interface || {})) {
            if (!route.endsWith('/socket.io') && endpoint.path !== '/socket.io') continue;
            const host = service.host || service.hostname || name;
            const protocol = endpoint.protocol || 'http';
            peers.push({
                name,
                url: `${protocol}://${host}${route}`,
                pattern: '*',
            });
            break;
        }
    }
    return peers;
}
