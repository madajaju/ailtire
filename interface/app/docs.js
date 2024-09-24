const path = require('path');
const spawn = require('child_process').spawnSync;
const server = require('../Server/doc-md');

module.exports = {
    friendlyName: 'docs',
    description: 'Generate Documentation of the app',
    static: true,
    inputs: {
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: function (inputs, env) {

        let host = process.env.AITIRE_HOST || 'localhost'
        let port = process.env.AITIRE_PORT || 80
        let urlPrefix = process.env.AITIRE_BASEURL || '/docs'

        let project = require(process.cwd() + '/package.json');

        server.docBuild( {
            version: project.version,
            baseDir: '.',
            prefix: project.name,
            routes: {
            },
            host: host,
            urlPrefix: urlPrefix,
            listenPort: port
        });
        let volumeStr = process.cwd() + '/docs:/docs';
        let plantimage = "ailtire-plantuml";
        console.log("Generating Diagrams from PUML");
        let proc = spawn('docker', ['run', '-v', volumeStr, plantimage], {
            stdio: 'pipe',
            env: process.env
        });
        if(proc.status != 0) {
            console.error("Error Building PNG from Plantruml");
            console.error(proc.stdout.toString('utf-8'));
            console.error(proc.stderr.toString('utf-8'));
        }
        console.log(proc.stdout.toString('utf-8'));
        console.log("Done Generating Diagrams from PUML");

    }
};


