// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Deployment',
    inputs: {
    },

    fn: function (inputs, env) {
        let environments = processDeployment(global.packages);
        env.res.json(environments);
    }
};
function processDeployment(packages) {
    retval = {environments:{}, images:{}};

    for(let pname in packages) {
        let pkg = packages[pname];
        for(let ename in pkg.deploy.envs) {
            let env = pkg.deploy.envs[ename];
            if(!retval.environments.hasOwnProperty(ename)) {
                retval.environments[ename] = { stacks: {}};
            }
            retval.environments[ename].stacks[env.tag] = processStack(`${pname}.${ename}`, env.definition);
        }
        for(let bname in pkg.deploy.build) {
            let bld = pkg.deploy.build[bname];
            retval.images[bld.tag] = bld;
        }
    }
    return retval;
}

function processStack(id, stack) {
   return {id: id, services: stack.services, networks: stack.networks};
}
