const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'get',
    description: 'get a Deployment',
    inputs: {},

    fn: function (inputs, env) {
        let [pname, ename] = inputs.id.split(/\./);
        let pkg = global.packages[pname];
        if (!pkg) {
            console.error("Cound not find the package:", pname);
            return;
        }
        if (!pkg.deploy.envs[ename]) {
            console.error("Could not find the enviornment:", ename);
            return;
        }
        let definition = pkg.deploy.envs[ename].definition;
        let retval = normalize(inputs.id, pkg.deploy.name, definition);

        env.res.json(retval);
        return retval;
    }
};

function normalize(id, name, definition) {
    let retval = {id: id, name: name};

    let services = {};
    for (let sname in definition.services) {
        let networks = {};
        let service = definition.services[sname];
        for (let i in service.networks) {
            let network = service.networks[i];
            if (typeof network === 'string') {
                networks[network] = {aliases: [network]};
            } else {
                networks[i] = network;
            }
        }
        let volumes = {};
        for (let i in service.volumes) {
            let volume = service.volumes[i];
            if (typeof volume === 'string') {
                let [source, target] = volume.split(':');
                volumes[source] = {source: source, target: target, type: 'bind'};
            } else {
                volumes[i] = volume;
            }
        }
        // Interface is defined by the labels in the deploy. Specifically the traefik
        let interface = {};
        if(service.deploy) {
            for (let i in service.deploy.labels) {
                 
            }
        }
        services[sname] = {
            name: sname,
            id: id + sname,
            networks: networks,
            volumes: volumes,
            interface: interface;
            environments: definition.services[sname].environment,
            ports: definition.services[sname].ports,
            image: definition.services[sname].image,
            deploy: definition.services[sname].deploy,
        };
    }
    retval.services = services;
    retval.networks = definition.networks;
    retval.volumes = definition.volumes;
    retval.configs = definition.configs;
    retval.secrets = definition.secrets;
    return retval;
}
