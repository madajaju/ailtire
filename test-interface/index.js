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
let config = {
    baseDir: '.',
    host: host,
    urlPrefix: urlPrefix,
    listenPort: port,
    internalURL: `${host}:${port}${urlPrefix}`,
    routes: {},
};
if(fs.existsSync('.ailtire.js')) {
    let overConfig = require('./.ailtire.js');
    for(let i in overConfig) {
        config[i] = overConfig[i];
    }
} else {
    let outputString = `module.exports = ${JSON.stringify(config)};`;
    fs.writeFileSync('.ailtire.js', outputString, 'utf8');
}

global.openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

server.listen( config);
