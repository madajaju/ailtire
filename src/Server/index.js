const express = require('express');
const sLoader = require('./Loader.js');
const AEvent = require('./AEvent.js');
const path = require('path');
const Action = require('./Action.js');
const fs = require('fs');
const redis = require('socket.io-redis');
const bodyParser = require("body-parser");
const htmlGenerator = require('../Documentation/html');
const Renderer = require('../Documentation/Renderer');
const server = express();
const http = require('http').createServer(server);
const io = require('socket.io')(http);

// plantuml.useNailgun();

// Here we are configuring express to use body-parser as middle-ware.
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());

module.exports = {
    doc: (config) => {
        normalizeConfig(config);
        global.ailtire = { config: config };
        // const plantuml = require('node-plantuml');
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
        console.log("CONFIG PATH:", config.urlPrefix);
        standardFileTypes(config,server);
        server.get(`${config.urlPrefix}/doc/actor/*`, (req, res) => {
            let actorName = req.url.replace(config.urlPrefix,'').replace(/\/doc\/actor\//, '');
            let apath = `${config.urlPrefix}/actors/${actorName}/index.html`;
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get(`${config.urlPrefix}/doc/usecase/*`, (req, res) => {
            let name = req.url.replace(config.urlPrefix,'').replace(/\/doc\/usecase\//, '');
            // Name is Package.SubPackage.Name
            let names = name.split('/');
            let ucName = names.pop();
            let uidName = names.join('/');

            let apath = `${config.urlPrefix}/${uidName}/usecases/${ucName}/index.html`;
            res.redirect(apath)
        });
        server.get(`${config.urlPrefix}/doc/model/*`, (req, res) => {
            let name = req.url.replace(config.urlPrefix,'').replace(/\/doc\/model\//, '');
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
            let name = req.url.replace(config.urlPrefix,'').replace(/\/doc\/package\//, '');
            console.log("NAME of Package:", name);
            let apath = `${config.urlPrefix}/${name}/index.html`;
            console.log("NAME of APATH:", apath);
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get(`${config.urlPrefix}/`, (req, res) => {
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
        /*if (config.hasOwnProperty('redis')) {
            io.adapter(redis({host: config.redis.host, port: config.redis.port}));
        }
         */

        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath), config); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'), config);
        Action.mapRoutes(server, config.routes);

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
            console.log("Hello World:", req);
            let str = mainPage(config);
            res.end(str);
        });

        server.all('*', (req, res) => {
            console.error("Catch All", req.originalUrl);
            for (let i in global.actions) {
                console.error("Path: ", i);
            }
            res.end(req.originalUrl);
        });

        global.io = io;
        io.on('connection', function (msocket) {
            AEvent.addHandlers(msocket);
        });

        console.log("Listening on Port:", config.listenPort);
        http.listen(config.listenPort);
    },
    micro: (config) => {
        normalizeConfig(config);
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);

        if (!config.hasOwnProperty('redis')) {
            config.redis = {host: 'redis', port: 6379};
        }
        io.adapter(redis({host: config.redis.host, port: config.redis.port}));

        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        // Make sure the prefix from the config is put in here to handle forwarded url.
        Action.load(server, config.prefix, path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/interface'));

        Action.mapRoutes(server, config.routes);

        server.get('/', (req, res) => {
            console.error("Hello Error", req.originalUrl);
            res.end(req.originalUrl);
        });
        server.all('*', (req, res) => {
            console.error("Catch All", req.originalUrl);
            for (let i in global.actions) {
                console.error("Path: ", i);
            }
            res.end(req.originalUrl);
        });
        global.io = io;

        io.on('connection', function (msocket) {
            AEvent.addHandlers(msocket);
        });

        console.log("Listening on Port:", config.listenPort);
        http.listen(config.listenPort);
    },
    start: (config) => {
        normalizeConfig(config);
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);

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
        server.get('/styles/*', (req, res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.end(str);
        });
        server.get('/js/*', (req, res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.end(str);
        });
    }
}

function mainPage(config) {
    return Renderer.render('default', 'views/index.ejs', {
        app: {name: config.name},
        name: config.name,
    });
}

function normalizeConfig(config) {
    config.port = config.port || 3000;
    config.host = config.host || 'localhost';
    config.urlPrefix = config.urlPrefix || '/';
}

function standardFileTypes(config,server) {

    server.get(`${config.urlPrefix}/styles/*`, (req, res) => {
        let apath = path.resolve('./assets' + req.url.replace(config.urlPrefix,''));
        let str = fs.readFileSync(apath, 'utf8');
        res.send(str);
    });
    server.get(`${config.urlPrefix}/js/*`, (req, res) => {
        let apath = path.resolve('./assets' + req.url.replace(config.urlPrefix,''));
        let str = fs.readFileSync(apath, 'utf8');
        res.send(str);
    });
    server.get('*.html', (req, res) => {
        let apath = path.resolve('./docs/' + req.url.replace(config.urlPrefix,'')).toLowerCase();
        res.sendFile(apath);
    });
    server.get('*.png', (req, res) => {
        let apath = path.resolve('./docs/' + req.url.replace(config.urlPrefix,''));
        if (fs.existsSync(apath)) {
            res.sendFile(apath);
        }
        else {
            res.end(apath + " not found!!");
        }
    });
    server.get('*.jpg', (req, res) => {
        let apath = path.resolve('./docs/' + req.url.replace(config.urlPrefix,''));
        if (fs.existsSync(apath)) {
            res.sendFile(apath);
        }
        else {
            res.end(apath + " not found!!");
        }
    });
    server.get('*.puml', (req, res) => {
        let apath = path.resolve('./docs/' + req.url.replace(config.urlPrefix,''));
        if (fs.existsSync(apath)) {
            res.set('Content-Type', 'image/svg+xml');
            //let gen = plantuml.generate(apath, {format: 'svg'});
            // gen.out.pipe(res);
            res.end("");
        } else {
            console.error(req.url.replace(config.urlPrefix,'') + ' not found!');
            console.error(apath + ' file not found!');
            res.end(req.url.replace(config.urlPrefix,'') + ' not found!');
        }
    });
}
