const fs = require('fs');
// Check for node_modules directory. If it exists then continue. If not ask to run npm install.
if(!fs.existsSync('./node_modules')) {
    console.error('Error: you must run "npm install" first');
    return;
}
const server = require('ailtire');
const OpenAI = require('openai');

let host = process.env.AILTIRE_HOST || 'localhost';
let port = process.env.AILTIRE_PORT || 80;
let urlPrefix = process.env.AITIRE_BASEURL || '/web';

global.openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

let config = {};
if(fs.existsSync('.ailtire.js')) {
    config = require('./.ailtire.js');
} else {
    config.host = host;
    config.port = port;
    let outputString = `module.exports = ${JSON.stringify(config)};`;
    fs.writeFileSync('.ailtire.js', outputString, 'utf8');
}

server.listen( {
    baseDir: '.',
    prefix: '',
    host: config.host,
    urlPrefix: urlPrefix,
    listenPort: config.port,
    internalURL: `${host}:${port}${urlPrefix}`,
    routes: {
    },
});
