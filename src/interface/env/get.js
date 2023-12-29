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
                let stack = pkg.deploy.envs[envname];
                stacks[pkg.deploy.name] =  {
                    name: stack.tag,
                    id: `${envname}.${pkg.deploy.name}`,
                    services: {},
                    data: stack.design.data,
                    networks: stack.design.networks,
                    interface: stack.design.interface
                };
                for(let sname in stack.design.services) {
                    let service = stack.design.services[sname];
                    let id = `${envname}.${pkg.deploy.name}.${sname}`;
                    stacks[pkg.deploy.name].services[id] = service;
                }
                
            }
        }
        env.res.json({name: envname, id: envname, stacks: stacks, services: services});
    }
};
