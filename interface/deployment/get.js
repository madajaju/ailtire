// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'get',
    description: 'get a Deployment',
    inputs: {},

    fn: function (inputs, env) {
        let [envname, sname] = inputs.id.split(/\./);
        let environ = global.deploy.envs[envname];
        if(!environ) {
            console.error("Could not find the environment!", envname);
            res.json("Could not find the environment");
        }
        let service = environ[sname];
        if(!service) {
            console.error("Could not find the service:", sname);
            return;
        }
        let retval = normalize_old(inputs.id, sname, service.definition);
        if(service.design) {
            retval = normalize(inputs.id, sname, service.design);
        }
        env.res.json(retval);
        return retval;
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
    let [env,lname] = id.split(/\./);
    for(let sname in design.services) {
        retval.services[sname] = design.services[sname];
        retval.services[sname].id = `${env}.${sname}`;
    }
    retval.networks = design.networks;
    retval.volumes = design.volumes;
    return retval;
}

function normalize_old(id, name, definition) {
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
        let intrface = {};
        if(service.deploy) {
            for (let i in service.deploy.labels) {

            }
        }
        services[sname] = {
            name: sname,
            id: id + sname,
            networks: networks,
            volumes: volumes,
            interface: intrface,
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
