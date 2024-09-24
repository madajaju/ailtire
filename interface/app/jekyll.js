const spawn = require('child_process').spawnSync;

module.exports = {
    friendlyName: 'jekyll',
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

       /* let host = process.env.AITIRE_HOST || 'localhost'
        let port = process.env.AITIRE_PORT || 80
        let urlPrefix = process.env.AITIRE_BASEURL || '/docs'

        let project = require(process.cwd() + '/package.json');
        */

        let volumeStr = process.cwd() + '/docs:/srv/jekyll';
        let image = "ailtire_hostdocs";

        console.log("Generating Diagrams from PUML");
        let proc = spawn('docker', ['run', '-v', volumeStr, "-p", "4000:4000", image, "jekyll", "serve"], {
            stdio: 'pipe',
            env: process.env
        });
        if(proc.status !== 0) {
            console.error("Error Hosting Docs");
            console.error(proc.stdout.toString('utf-8'));
            console.error(proc.stderr.toString('utf-8'));
        }
        console.log(proc.stdout.toString('utf-8'));
        console.log("Done Hosting Docs");

    }
};


