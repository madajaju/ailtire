const express = require('express');
const server = express();
const http = require('http').createServer(server);
let port = process.env.AILTIRE_PORT || '3000';
let stackName = process.env.AILTIRE_STACKNAME || process.env.HOSTNAME;
console.log("StackName", stackName);

(async () => {
    try {
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


    server.get('*', (req, res) => {
        console.log("Got Request", req.originalUrl);
        res.end("Stack:" + stackName + "REQ:"+ req.originalUrl);
    });
    console.log(stackName, "- Listening on port:", port);
    http.listen(port);

}


