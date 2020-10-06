const express = require('express');
const exec = require('child_process').spawnSync;
const server = express();
const path = require('path');
const fs = require('fs');
const bodyParser = require("body-parser");
const http = require('http').createServer(server);
let app = null;

console.log("ENVIRONMENT::");
console.log(process.env);
console.log("::ENVIRONMENT");

if(!process.env.AILTIRE_STACKNAME) {
   process.env.AILTIRE_STACKNAME = process.env.HOSTNAME;
}

// Here we are configuring express to use body-parser as middle-ware.
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());

let stackName = process.env.AILTIRE_STACKNAME;
console.log("StackName: ", stackName);
// Check to see if the service is already running.
// If it is then do nothing.
let proc = exec('docker', ['stack', 'ps', stackName], {cwd: '.', stdio: 'inherit', env:process.env});
// console.log("proc:", proc.stdout.toString('utf8'));
//console.log("proc Error:", proc.stderr.toString('utf8'));

// If it isn't then get it started.
proc = exec('docker', ['stack', 'deploy', '-c', 'docker-compose.yml', stackName], {cwd: '.', stdio: 'inherit', env:process.env});
// console.log("proc:", proc.stdout.toString('utf8'));

server.get('/update', (req, res) => {
    console.log("Update stack:");
    console.log("Update Stack Environment Parameters:", req.body.parameters);
    console.log("Update Stack Environment Variables:", req.body.environment);
    console.log("Update Stack definition:", req.body.composefile);
    res.end("Done");
});
server.get('/shutdown', (req, res) => {
    console.log("Shutdown");
    let proc = exec('docker', ['stack', 'rm', stackName], {cwd: '.', stdio: 'pipe', env:process.env});
    console.log("proc:", proc.stdout.toString('utf8'));
    res.end(proc.stdout.toString('utf8'));
    app.close(() => {
        console.log("Everything is shutdown");
    });
    process.exit();
});
server.get('/status', (req, res) => {
    console.log("Status");
    let proc = exec('docker', ['stack', 'ps', stackName], {cwd: '.', stdio: 'pipe', env:process.env});
    console.log("proc error:", proc.stderr.toString('utf8'));
    console.log("proc:", proc.stdout.toString('utf8'));
    res.end(proc.stdout.toString('utf8'));
});
server.get('*', (req, res) => {
    console.log("Do Nothing from Default");
    res.send("Did Nothing");
});

app = http.listen("3000");

process.once('SIGINT', (code) => {
    console.log("SIGINT:", code);
    let proc = exec('docker', ['stack', 'rm', stackName], {cwd: '.', stdio: 'pipe', env:process.env});
    console.log("proc:", proc.stdout.toString('utf8'));
    process.exit();
});

