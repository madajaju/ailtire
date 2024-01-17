// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Deployment',
    inputs: {
    },

    fn: function (inputs, env) {
        let environments = _processDeployment(global.packages);
        _processPhysical(environments, global.packages);
        env.res.json(environments);
    }
};
function _processDeployment(packages) {
    let retval = {environments:{}, images:{}};

    for(let pname in packages) {
        let pkg = packages[pname];
        for(let ename in pkg.deploy.envs) {
            let env = pkg.deploy.envs[ename];
            if(!retval.environments.hasOwnProperty(ename)) {
                retval.environments[ename] = { name: ename, stacks: {}, physical: {}};
            }
            retval.environments[ename].stacks[env.tag] = _processStack(env.tag, env.definition);
        }
        for(let bname in pkg.deploy.build) {
            let bld = pkg.deploy.build[bname];
            retval.images[bld.tag] = bld;
        }
    }
    return retval;
}

function _processPhysical(environments, packages) {
    if(!environments.deviceTypes) {
        environments.deviceTypes = {};
    }
    for(let pname in packages) {
        let pkg = packages[pname];
        for(let ename in pkg.physical?.environments) {
            let env = pkg.physical.environments[ename];
            if(!environments.environments.hasOwnProperty(ename)) {
                environments.environments[ename] = { name: ename, stacks: {}, physical: {}};
            }
            environments.environments[ename].physical = env;
        }
        for(let bname in pkg.physical?.modules) {
            let bld = pkg.physical.modules[bname];
            environments.deviceTypes[bname] = bld;
        }
    }
    return environments;
}
function _processStack(id, stack) {
    return {id: id, services: stack.services, networks: stack.networks};
}
