const path = require('path');
const fs = require('fs');

module.exports = {
    friendlyName: 'load',
    description: 'Load a deployment',
    static: true,
    inputs: {
        name: {
            type: 'string',
            required: true,
            description: 'Stack name'
        },
        prefix: {
            type: 'string',
            required: true,
            description: "Prefix of the deployment"
        },
        dir: {
            type: 'string',
            required: true,
            description: "Directory of the deployment"
        }
    },
    outputs: {
        type: 'ADeployment',
        description: 'Loaded ADeployment instance'
    },
    exits: {},
    fn: function (inputs, env) {
        let name = inputs.name;
        let dir = path.resolve(inputs.dir, 'deploy');
        let prefix = inputs.prefix;

        let retval = new ADeployment({
            name: name,
            dir: dir,
            prefix: prefix,
            envs: {},
            build: {}
        });

        const buildPath = path.resolve(dir, 'build.js');

        if (!global.ailtire) {
            global.ailtire = {};
        }
        if (!global.ailtire.implementation) {
            global.ailtire.implementation = {};
        }
        if (!global.ailtire.implementation.images) {
            global.ailtire.implementation.images = {};
        }

        if (fs.existsSync(buildPath)) {
            const build = require(buildPath);
            const normalizedBuild = {};
            for (let iname in build) {
                let image = build[iname];
                if (!image.hasOwnProperty('contexts')) {
                    normalizedBuild[iname] = {
                        contexts: {
                            default: image
                        }
                    };
                } else {
                    normalizedBuild[iname] = image;
                }
                global.ailtire.implementation.images[image.tag] = {
                    image: image,
                    context: iname,
                    package: name,
                    basedir: dir,
                    name: image.tag
                };
            }
            retval.build = normalizedBuild;
        }

        const deployPath = path.resolve(dir, 'deploy.js');
        if (fs.existsSync(deployPath)) {
            const deploy = require(deployPath);
            retval.name = deploy.name || name;
            const contexts = deploy.contexts || deploy;

            for (let env in contexts) {
                try {
                    const context = contexts[env];
                    let design = {};
                    if (context.hasOwnProperty('file')) {
                        const stackFile = path.resolve(dir, context.file);
                        if (!fs.existsSync(stackFile)) {
                            throw new Error(`Could not find the stack file: ${stackFile}`);
                        }
                        const ext = path.extname(stackFile).toLowerCase();
                        if (ext === '.yaml' || ext === '.yml') {
                            design = YAML.load(stackFile);
                        } else if (ext === '.js') {
                            design = require(stackFile);
                        } else {
                            throw new Error(`Unsupported stack file type: ${stackFile}`);
                        }
                    } else if (context.design) {
                        const designPath = path.resolve(dir, context.design);
                        if (!fs.existsSync(designPath)) {
                            throw new Error(`Could not find the stack design: ${designPath}`);
                        }
                        const ext = path.extname(designPath).toLowerCase();
                        if (ext === '.yaml' || ext === '.yml') {
                            design = YAML.load(designPath);
                        } else if (ext === '.js') {
                            design = require(designPath);
                        } else {
                            throw new Error(`Unsupported stack design type: ${designPath}`);
                        }
                    }

                    const stack = AStack.load({
                        name: retval.name,
                        environment: env,
                        design: design
                    }, {});
                    stack.composeFile = context.file;
                    let environ = new AEnvironment({
                        name: env,
                        tag: `${retval.name}:${env}`,
                        definition: design,
                        file: context.file,
                        stack: stack,
                        package: name.replace(/\s/g, ''),
                    });
                    retval.addToEnvs(environ);
                    if (!global.hasOwnProperty('deploy')) {
                        global.deploy = {envs: {}};
                    }
                    if (!global.deploy.envs.hasOwnProperty(env)) {
                        global.deploy.envs[env] = {};
                    }
                    global.deploy.envs[env][retval.name] = environ;
                } catch (e) {
                    console.error(e.message);
                }
            }
        }

        return retval;
    }
};

