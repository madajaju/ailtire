const express = require('express');
const server = express();
const sLoader = require('./Loader.js');
const AEvent = require('./AEvent.js');
const path = require('path');
const Action = require('./Action.js');
const fs = require('fs');
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const redis = require('socket.io-redis');
const bodyParser = require("body-parser");
const plantuml = require('node-plantuml');
const htmlGenerator = require('../Documentation/html');

plantuml.useNailgun();

// Here we are configuring express to use body-parser as middle-ware.
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());

module.exports = {
    doc: (config) => {
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);

        Action.defaults(server);
        //let ailPath = __dirname + "/../../interface";
        // Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'));
        // Action.mapRoutes(server, config.routes);
        htmlGenerator.index(config.prefix, apath + '/docs');
        htmlGenerator.package(global.topPackage, apath + '/docs');
        htmlGenerator.actors(global.actors, apath + '/docs');

        server.get('/styles/*', (req, res) => {
            let apath = path.resolve('./docs/assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.send(str);
        });
        server.get('/js/*', (req, res) => {
            let apath = path.resolve('./docs/assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.send(str);
        });
        server.get('*.html', (req, res) => {
            let apath = path.resolve('./docs/' + req.url);
            res.sendFile(apath);
        });
        server.get('*.png', (req, res) => {
            let apath = path.resolve('./docs/' + req.url);
            // res.sendFile(apath, { root: __dirname });
            res.sendFile(apath);
        });
        server.get('*.jpg', (req, res) => {
            let apath = path.resolve('./docs/' + req.url);
            // res.sendFile(apath, { root: __dirname });
            res.sendFile(apath);
        });
        server.get('*.puml', (req, res) => {
            let apath = path.resolve('./docs/' + req.url);
            if (fs.existsSync(apath)) {
                res.set('Content-Type', 'image/svg+xml');
                let gen = plantuml.generate(apath, {format: 'svg'});
                gen.out.pipe(res);
            } else {
                console.error(req.url + ' not found!');
                res.end(req.url + ' not found!');
            }
        });
        server.get('/doc/actor/*', (req, res) => {
            let actorName = req.url.replace(/\/doc\/actor\//, '');
            let apath = `/actors/${actorName}/index.html`;
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get('/doc/usecase/*', (req, res) => {
            let name = req.url.replace(/\/doc\/usecase\//, '');
            // Name is Package.SubPackage.Name
            let names = name.split('/');
            let ucName = names.pop();
            let uidName = names.join('/');

            let apath = `/${uidName}/usecases/${ucName}/index.html`;
            res.redirect(apath)
        });
        server.get('/doc/model/*', (req, res) => {
            let name = req.url.replace(/\/doc\/model\//, '');
            let names = name.split('/');
            let mName = names.pop();
            let prefix = names.join('/');
            let apath = `/${prefix}/models/${mName}/index.html`;
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get('/doc/package/*', (req, res) => {
            let name = req.url.replace(/\/doc\/package\//, '');
            let apath = `/${name}/index.html`;
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get('/', (req, res) => {
            res.redirect('/index.html');
        });

        console.log("Serving up documentation on Port:", config.listenPort);
        http.listen(config.listenPort);
    },
    listen: (config) => {
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        if (config.hasOwnProperty('redis')) {
            io.adapter(redis({host: config.redis.host, port: config.redis.port}));
        }

        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'));
        Action.mapRoutes(server, config.routes);

        server.get('/init', (req, res) => {
            let retval = {};
            for (let path in global.actions) {
                let prunedPath = path.replace(/\//, '').replace(config.prefix, '');
                retval[prunedPath] = {
                    name: prunedPath,
                    inputs: global.actions[path].inputs,
                    friendlyName: global.actions[path].friendlyName,
                    description: global.actions[path].description
                };
            }
            res.json(retval);
        });

        server.get('/', (req, res) => {
            console.error("Hello Error", req);
        });
        server.get('/styles/*', (req, res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.send(str);
        });
        server.get('/js/*', (req, res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.send(str);
        });
        server.get('*.html', (req, res) => {
            let apath = path.resolve('./' + req.url);
            // res.sendFile(apath, { root: __dirname });
            res.sendFile(apath);
        });
        server.get('*.puml', (req, res) => {
            let apath = path.resolve('./' + req.url);
            if (fs.existsSync(apath)) {
                res.set('Content-Type', 'image/svg+xml');
                let gen = plantuml.generate(apath, {format: 'svg'});
                gen.out.pipe(res);
            } else {
                console.error(req.url + ' not found!');
                res.end(req.url + ' not found!');
            }
        });
        server.get('/doc/actor/*', (req, res) => {
            let actorName = req.url.replace(/\/doc\/actor\//, '');
            let apath = '/docs/actors/' + actorName + '/index.html';
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get('/doc/usecase/*', (req, res) => {
            let name = req.url.replace(/\/doc\/usecase\//, '');
            // Name is Package.SubPackage.Name
            let names = name.split(/\./);
            let ucName = names.pop();
            let uidName = names.join('/');

            let apath = '/docs/edgemere/' + uidName + '/usecases/' + ucName + '/index.html';
            res.redirect(apath)
        });
        server.get('/doc/model/*', (req, res) => {
            let actorName = req.url.replace(/\/doc\/model\//, '');
            let apath = '/docs/edgemere/' + actorName + '/index.html';
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });
        server.get('/doc/package/*', (req, res) => {
            let actorName = req.url.replace(/\/doc\/package\//, '');
            let apath = '/docs/actors/' + actorName + '/index.html';
            res.redirect(apath)
            // res.sendFile('index.html', {root: apath});
        });

        global.io = io;
        io.on('connection', function (msocket) {
            console.log("IO ON, Connection");
            AEvent.addHandlers(msocket);
        });

        console.log("Listening on Port:", config.listenPort);
        http.listen(config.listenPort);
    },
    micro: (config) => {
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
            console.log("Micro IO ON, Connection");
            AEvent.addHandlers(msocket);
        });

        console.log("Listening on Port:", config.listenPort);
        http.listen(config.listenPort);
    },
    start: (config) => {
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);

        Action.defaults();
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'));
        Action.defaults(server);
        Action.mapRoutes(server, config.routes);

        server.get('/', (req, res) => {
            console.error("Hello Error", req);
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
