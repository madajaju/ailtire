var server = require('express')();
var http = require('http').createServer(server);
var io = require('socket.io')(http);
const path = require('path');

const sLoader = require('./Loader.js');
const AEvent = require('./AEvent.js');
const Action = require('./Action.js');
const fs = require('fs');
// const redis = require('socket.io-redis');
const bodyParser = require("body-parser");
const mdGenerator = require('../Documentation/md');
const Renderer = require('../Documentation/Renderer');


// Here we are configuring express to use body-parser as middle-ware.
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());

module.exports = {
    docBuild: (config) => {
        normalizeConfig(config);
        global.ailtire = { config: config };
        console.log("Config:", global.ailtire.config);
        let apath = path.resolve(config.baseDir);
        let topPackage = sLoader.processPackage(apath);
        sLoader.analyze(topPackage);

        Action.defaults(server);
        //let ailPath = __dirname + "/../../interface";
        // Action.load(server, '', path.resolve(ailPath)); // Load the ailtire defaults from the interface directory.
        Action.load(server, config.prefix, path.resolve(config.baseDir + '/api/interface'), config);
        // Action.mapRoutes(server, config.routes);
        mdGenerator.index(config.prefix, apath + '/docs');
        mdGenerator.package(global.topPackage, apath + '/docs');
        mdGenerator.actors(global.actors, apath + '/docs');
        console.log("Built the Documentation");
        return;
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
            let names = name.split('/');
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

function standardFileTypes(config,server) {

    server.get(`${config.urlPrefix}/styles/*`, (req, res) => {
        let apath = path.resolve('./assets' + req._parsedUrl.pathname.replace(config.urlPrefix,''));
        // let str = fs.readFileSync(apath, 'utf8');
        res.sendFile(apath);
    });
    server.get(`${config.urlPrefix}/js/*`, (req, res) => {
        let apath = path.resolve('./assets' + req._parsedUrl.pathname.replace(config.urlPrefix,''));
        // let str = fs.readFileSync(apath, 'utf8');
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
