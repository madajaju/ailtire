const express = require('express');
const server = express();
const sLoader = require('./Loader.js');
const path = require('path');
const Action = require('./Action.js');
const fs = require('fs');
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const bodyParser = require("body-parser");

// Here we are configuring express to use body-parser as middle-ware.
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

module.exports = {
    listen: (config) => {
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);

        Action.defaults(server);
        Action.load(server, '', path.resolve('./interface'));
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
        io.on('connection', function (socket) {
            socket.emit('news', { hello: 'world' });
            socket.on('list', function (data) {
                console.log(data);
            });
        });


        http.listen(config.listenPort);
    },
    start: (config) => {
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);

        Action.defaults();
        Action.load(server, '', path.resolve('./interface'));
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
