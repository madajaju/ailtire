const express = require('express');
const exec = require('child_process').spawnSync;
const server = express();
const bent = require('bent');
const bodyParser = require("body-parser");
const http = require('http').createServer(server);
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
let app = null;

let children = {};
// Needs
// name of the stack to run AILTIRE_PARENT_AILTIRE_STACKNAME-AILTIRE_TASK
// name of the parent to connect to. Host and port AILTIRE_PARENTHOST:AILTIRE_PARENTPORT
// Host of the server.js process and port HOSTNAME: AILTIRE_STACKPORT
console.log(process.env);
let hostname = process.env.HOSTNAME;
let stackName = process.env.AILTIRE_STACKNAME || process.env.HOSTNAME;
let parent = process.env.AILTIRE_PARENTHOST || '';
let parentport = process.env.AILTIRE_PARENTPORT || '3000';
let port = process.env.AILTIRE_STACKADMINPORT || '3000';

process.env.AILTIRE_PARENTHOST = process.env.HOSTNAME;

(async () => {
    try {
        await register();
        deploy();
        setupExpress();
    } catch (e) {
        // Deal with the fact the chain failed
        console.error(e);
    }
})();

function setupExpress() {
// Here we are configuring express to use body-parser as middle-ware.
    server.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    server.use(bodyParser.urlencoded({extended: false}));
    server.use(bodyParser.json());


    server.get('*/update', (req, res) => {
        console.log("Update stack:");
        console.log("Update Stack Environment Parameters:", req.body.parameters);
        console.log("Update Stack Environment Variables:", req.body.environment);
        console.log("Update Stack definition:", req.body.composefile);
        res.end("Done");
    });
    server.get('*/shutdown', (req, res) => {
        console.log("Shutdown");
        let proc = exec('docker', ['stack', 'rm', stackName], {cwd: '.', stdio: 'pipe', env: process.env});
        console.log("proc:", proc.stdout.toString('utf8'));
        res.end(proc.stdout.toString('utf8'));
        app.close(() => {
            console.log("Everything is shutdown");
        });
        process.exit();
    });
    server.get('*/status', async (req, res) => {
        let status = await getStats();
        res.json(status);
        res.end();
    });
    server.get('*/register', (req, res) => {
        console.log("Register");
        console.log("Register", req.query);
        children[req.query.name] = req.query.url;
        res.json({status: 'ok'});
        res.end()
    });
    server.get('*/children', (req, res) => {
        console.log("Children");
        console.log(children);
        res.json(children);
        res.end();
    });
    server.get('*/view', async (req, res) => {
        let apath = path.resolve('./views/main.ejs');
        let status = await getStats();
        let retval = renderPage('./views/main.ejs', {stats:status});
        res.end(retval);
    });
    server.get('*', (req, res) => {
        console.log("Request:", req);
        console.log("Do Nothing from Default");
        res.send("Did Nothing");
    });

    app = http.listen(port);

    process.once('SIGINT', (code) => {
        console.log("SIGINT:", code);
        let proc = exec('docker', ['stack', 'rm', stackName], {cwd: '.', stdio: 'pipe', env: process.env});
        console.log("proc:", proc.stdout.toString('utf8'));
        process.exit();
    });

}


function checkStatus() {
    console.log("Checking ", stackName);
    let proc = exec('docker', ['stack', 'ps', stackName], {cwd: '.', stdio: 'pipe', env: process.env});
    if (proc.status !== 0) {
        console.error(proc.stderr.toString('utf8'));
        proc = exec('docker', ['stack', 'deploy', '-c', 'docker-compose.yml', stackName], {
            cwd: '.',
            stdio: 'inherit',
            env: process.env
        });
    } else {
        console.log(stackName, "Running");
        console.log(proc.stdout.toString('utf8'));
    }
}

async function register() {
    if (parent) {
        console.log("Parent:", parent);
        let url = `http://${parent}:${parentport}`;
        console.log("URL:", url);
        const get = bent('GET', 'json');
        let response;
        try {
            let urlreq = `${url}/register?name=${stackName}&url=${hostname}:${port}`;
            console.log(urlreq);
            response = await get(urlreq, 'test');
        } catch (e) {
            console.error("Could not connect to Parent:", response);
            console.error("Could not connect to Parent:", e);
            setTimeout(register, 30000);
        };
    }
}

function deploy() {
    checkStatus();
   //  setInterval(checkStatus, 10000);
}

async function getStatus(children, status) {
    let retval = status;
    const get = bent('GET', 'json');
    for(let name in children) {
        console.log("Calling children for ", name);
        let response;
        try {
            let urlreq = `http://${children[name]}/status`;
            if(!retval.hasOwnProperty(name)) {
                retval[name] = { type: 'stack' };
            }
            response = await get(urlreq, '');
            retval[name].type = 'stack';
            retval[name].services = response;
        } catch (e) {
            retval[name].status ="Network Error";
            retval[name].line = e;
            console.log("Could not connect to Service:", e);
        }
    }
    return retval;
}
function parseStatus(input) {
    let retval = {};
    const lines = input.split('\n');
    for(let line in lines) {
        let items = lines[line].split(/\s+/);
        if(items[1] && items[1] !== 'NAME' && items[1] !== "\\_") {
            let serviceName = items[1].replace(/\./g, '-');
            retval[serviceName] = {
                name: items[1],
                image: items[2],
                node: items[3],
                desired: items[4],
                status: items[5],
                line: lines[line],
            }
        }
    }
    return retval;
}

async function getStats() {
    let proc = exec('docker', ['stack', 'ps', stackName], {cwd: '.', stdio: 'pipe', env: process.env});
    let status = parseStatus(proc.stdout.toString('utf8'));
    let cstatus = await getStatus(children, status);
    return cstatus;
}

const renderPage = (page, objects) => {
    let apath = path.resolve(page);
    try {
        let str = fs.readFileSync(apath, 'utf8');
        let retval = ejs.render(str, objects);
        console.log("Return:", retval)
        return retval;
    } catch (e) {
        console.error("Renderering Error:", e);
        console.error("Renderering Error:", page, "with", objects);
    }
    return "";
};
