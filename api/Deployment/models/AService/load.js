const fs = require('fs');
const path = require('path');

module.exports = {
    friendlyName: 'load',
    description: 'Load an AService deployment design',
    static: true,
    inputs: {
        name: {
            type: 'string',
            required: true,
            description: 'Service name'
        },
        design: {
            type: 'json',
            required: true,
            description: 'Deployment design for the service'
        }
    },
    outputs: {
        type: 'AService',
        description: 'Loaded AService instance'
    },
    exits: {},
    fn: function (inputs, env) {

        let item = {};
        item.name = inputs.name;
        item.type = inputs.design.type;
        item.image = inputs.design.image;
        item.volumes = inputs.design.volumes;
        item.interface = inputs.design.interface || {};
        item.policies = inputs.design.policies || {};
        item.environment = inputs.design.environment;
        item.baseDir = inputs.design.baseDir;
        item.deployments = inputs.design.deployments || {};
        item.state = 'Created';

        if (!global.ailtire.services) {
            global.ailtire.services = {};
        }
        if (!global._instances) {
            global._instances = {};
        }
        if (!global._instances.AService) {
            global._instances.AService = {};
        }
        let obj = new AService(item);

        global._instances.AService[item.name] = obj;
        if (!global._servicePaths) {
            global._servicePaths = {};
        }
        for (let iname in obj.interface) {
            if (global._servicePaths.hasOwnProperty(iname)) {
                if (global._servicePaths[iname] !== obj.name) {
                    console.error("Service Interface Error:", iname, "already exists!");
                    console.error(`Conflict with ${obj.name} and ${global._servicePaths[iname].name}`);
                }
            } else {
                global._servicePaths[iname] = obj;
            }
        }
        return obj;
    }
};