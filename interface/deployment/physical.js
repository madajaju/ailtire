// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Physical Deployments',
    inputs: {
    },

    fn: function (inputs, env) {
        let environments = { environments:{}};
        _processPhysical(environments, global.packages);
        env.res.json(environments);
    }
};

function _processPhysical(environments, packages) {
    if(!environments.deviceTypes) {
        environments.deviceTypes = {};
    }
    for(let pname in packages) {
        let pkg = packages[pname];
        for(let ename in pkg.physical?.environments) {
            let env = pkg.physical.environments[ename];
            if(!environments.environments.hasOwnProperty(ename)) {
                environments.environments[ename] = { name: ename, physical: {}};
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
