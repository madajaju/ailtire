const path = require('path');
const exec = require('child_process').spawnSync;
const fs = require('fs');
const axios = require('axios');

module.exports = {
    friendlyName: 'uninstall',
    description: 'Uninstall an application that was installed with docker swarm',
    static: true,
    inputs: {
        env: {
            description: 'Environment to Build',
            type: 'string',
            required: true
        },
        name: {
            description: 'Name of the Build',
            type: 'string',
            required: false
        },
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: async function (inputs, env) {
        // goto the deploy directory at the top level.
        // Call docker stack deploy -c docker-compose.yml
        // Iterate down to the Packages the same thing.
        // continue down the tree.
        // Make sure to call docker stack deploy first then go down.
        let name = inputs.name || 'default';
        let environ = inputs.env  || 'local';
        let apath = path.resolve('.');
        await uninstallPackage({name: name, env: environ});
        return `Uninstall Application`;
    }
};

async function uninstallPackage(opts) {
    let stackName = opts.name + '-' + opts.env;
    console.log("Removing Stack Name:", stackName);
    await axios.get('http://localhost/_admin/shutdown');
    let proc = exec('docker', ['stack', 'rm', stackName], {stdio: 'inherit'});
    return;
}
