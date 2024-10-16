const path = require('path');
const spawn = require('child_process').spawnSync;
const server = require('../../src/Server/doc-md');

module.exports = {
    friendlyName: 'docs',
    description: 'Generate Documentation of the app',
    static: true,
    inputs: {},

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

        try {
            server.docBuild({
                version: project.version,
                baseDir: '.',
                prefix: project.name,
                routes: {},
                host: host,
                urlPrefix: urlPrefix,
                listenPort: port
            });
        } catch (e) {
            console.error(e);
        }
        let volumeStr = process.cwd() + '/docs:/docs';
        let plantimage = "ailtire-plantuml";
        console.log("Generating Diagrams from PUML");
        let proc = spawn('docker', ['run', '-v', volumeStr, plantimage], {
            stdio: 'pipe',
            env: process.env
        });
        if (proc.status != 0) {
            console.error("Error Building pdf from md");
            console.error(proc.stdout.toString('utf-8'));
            console.error(proc.stderr.toString('utf-8'));
        }
        console.log(proc.stdout.toString('utf-8'));
        console.log("Done Generating Diagrams from PUML");
        console.log("Generating pdf from md");
        let pdfimage = "ailtire_buildpdf";
        let proc2 = spawn('docker', ['run', '-v', volumeStr, pdfimage, "singleDoc.md", "singleDoc.pdf"], {
            stdio: 'pipe',
            env: process.env
        });
        if (proc2.status != 0) {
            console.error("Error Building PNG from Plantruml");
            console.error(proc2.stdout.toString('utf-8'));
            console.error(proc2.stderr.toString('utf-8'));
        }
        console.log(proc2.stdout.toString('utf-8'));
        console.log("Done Generating Diagrams from PUML");
    }
};


