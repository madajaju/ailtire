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
const funcHandler = require('../Proxy/MethodProxy');

// Here we are configuring express to use body-parser as middle-ware.
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

module.exports = {
    listen: (config) => {
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        if(!config.hasOwnProperty('redis')) {
           config.redis = { host: 'redis', port: 6379};
        }
        io.adapter(redis({ host: config.redis.host, port: config.redis.port }));

        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'));
        Action.mapRoutes(server, config.routes);

        server.get('/init', (req, res) => {
            let retval = {};
            for(let path in global.actions) {
                retval[path] = { name: path, inputs: global.actions[path].inputs,friendlyName: global.actions[path].friendlyName, description: global.actions[path].description };
            }
            res.json(retval);
        });

        server.get('/', (req,res) => {
            console.error("Hello Error", req);
        });
        server.get('/styles/*', (req,res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.send(str);
        });
        server.get('/js/*', (req,res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.end(str);
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

        if(!config.hasOwnProperty('redis')) {
            config.redis = { host: 'redis', port: 6379};
        }
        io.adapter(redis({ host: config.redis.host, port: config.redis.port }));

        Action.defaults(server);
        let ailPath = __dirname + "/../../interface";
        // Make sure the prefix from the config is put in here to handle forwarded url.
        Action.load(server, config.prefix, path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/interface'));

        Action.mapRoutes(server, config.routes);

        server.get('/', (req,res) => {
            console.error("Hello Error", req.originalUrl);
            res.end(req.originalUrl);
        });
        server.all('*', (req,res) => {
            console.error("Catch All", req.originalUrl);
            for(let i in global.actions) {
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

        server.get('/', (req,res) => {
            console.error("Hello Error", req);
        });
        server.get('/styles/*', (req,res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.end(str);
        });
        server.get('/js/*', (req,res) => {
            let apath = path.resolve('./assets' + req.url);
            let str = fs.readFileSync(apath, 'utf8');
            res.end(str);
        });
    }

}
