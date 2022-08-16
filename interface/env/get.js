// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'get',
    description: 'get an Environment',
    inputs: {},

    fn: function (inputs, env) {
        let envname = inputs.id;
        let pkgs = global.packages;
        let stacks = {};
        let services = {};
        // Go through all of the stack deployments and get the definitions by environment.
        for(let pname in pkgs) {
            let pkg = pkgs[pname];
            if(pkg.deploy.envs.hasOwnProperty(envname)) {
                stacks[pkg.deploy.name] = pkg.deploy.envs[envname];
                stacks[pkg.deploy.name].id = `${envname}.${pkg.shortname}.${pkg.deploy.name}`;

            }
        }
        env.res.json({name: envname, id: envname, stacks: stacks, services: services});
    }
};
