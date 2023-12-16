// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'list',
    description: 'List the Deployment',
    inputs: {
    },

    fn: function (inputs, env) {
        let environments = processDeployment(global.deploy.envs);
        env.res.json(environments);
    }
};
function processDeployment(envs) {
    retval = {environments:{}};

    for(let ename in envs) {
        if(!retval.environments.hasOwnProperty(ename)) {
            retval.environments[ename] = { stacks: {}};
        }
        for(let sname in envs[ename]) {
            let service = envs[ename][sname];
            retval.environments[ename].stacks[service.tag] = processStack(`${ename}.${sname}`, service.definition);
        }
    }
    return retval;
}

function processStack(id, stack) {
   return {id: id, services: stack.services, networks: stack.networks};
}
