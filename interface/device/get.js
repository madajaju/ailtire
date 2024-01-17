// const renderer = require('../../src/Documentation/Renderer.js');

module.exports = {
    friendlyName: 'get',
    description: 'get a Device',
    inputs: {},

    fn: function (inputs, env) {
        let [envname, stname, sname] = inputs.id.split(/\./);
        let environ = global.deploy.envs[envname];
        if(!environ) {
            console.error("Could not find the environment!", envname);
            res.json("Could not find the environment");
        }
        let stack = environ[stname];
        if(!stack) {
            console.error("Could not find the stack:", stname);
            return;
        }
        if(sname === undefined) {
            let retval = normalize_old(inputs.id, stname, stack.definition);
            if (stack.design) {
                retval = normalize(inputs.id, stname, stack.design);
            }
            env.res.json(retval);
            return retval;
        } else {
            // find the service in the definition or in the design
            let retval = undefined;
            if(stack.definition && stack.definition.services && stack.definition.services.hasOwnProperty(sname)) {
               retval = stack.definition.services[sname];
            } else if(stack.design && stack.design.services && stack.design.services.hasOwnProperty(sname)) {
                retval = stack.design.services[sname];
                retval.name = inputs.id;
            }
            env.res.json(retval);
            return retval;
        }

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
    for(let sname in design.services) {
        retval.services[sname] = design.services[sname];
        retval.services[sname].id = `${id}.${sname}`;
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
