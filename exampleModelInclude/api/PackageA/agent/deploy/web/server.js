const fs = require('fs');
// Check for node_modules directory. If it exists then continue. If not ask to run npm install.
if(!fs.existsSync('./node_modules')) {
   console.error('Error: you must run "npm install" first');
   return;
}
const server = require('ailtire');

let hostname = process.env.HOSTNAME;
let port = process.env.EDGEMERE_PORT || 3000
let urlPrefix = process.env.AILTIRE_BASEURL || '/pa/a'

server.micro({
    baseDir: '../..',
    prefix: 'pa/a',
    routes: {},
    host: hostname,
    urlPrefix: urlPrefix,
    listenPort: port
});
