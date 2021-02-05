const renderer = require('../../src/Documentation/Renderer.js');

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
                let env = pkg.deploy.envs[envname];
                stacks[pkg.deploy.name] = pkg.deploy.envs[envname];
                stacks[pkg.deploy.name].id = pkg.deploy.name;

            }
        }
        env.res.json({stacks: stacks, services: services});
        return ;
    }
};

function normalize(id, name, design) {

    let retval = {
        id: id,
        name: name,
        interface: {},
        volumes: {},
        networks: {}
    };

    for(let i in design.services) {
        let service = design.services[i];
        for(let sname in service.interface) {
            let inter = service.interface[sname];
            retval.interface[sname] = {path: inter.path, service:service, port: inter.port};
        }
    }
    retval.services = design.services;
    retval.networks = design.networks;
    retval.volumes = design.volumes;
    return retval;
};

