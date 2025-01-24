const axios = require('axios');
const path = require('path');
const Action = require('./Action.js');
const {execSync} = require('child_process');


class AService {
    constructor(opts) {
        this.name = opts.name;
        this.type = opts.type;
        this.image = opts.image;
        this.volumes = opts.volumes;
        this.interface = opts.interface;
        this.policies = opts.policies;
        this.environment = opts.environment;
        this.baseDir = opts.baseDir;
        this.deployments = opts.deployments;
        this.state = 'Created';
        if (!global.ailtire.services) {
            global.ailtire.services = {};
        }
        if (!global._instances) {
            global._instances = {};
        }
        if (!global._instances.AService) {
            global._instances.AService = {};
        }
        global._instances.AService[this.name] = this;
        if (!global._servicePaths) {
            global._servicePaths = {};
        }
        for (let iname in this.interface) {
            if (global._servicePaths.hasOwnProperty(iname)) {
                 if(global._servicePaths[iname] !== this.name) {
                    console.error("Service Interface Error:", iname, "already exists!");
                    console.error(`Conflict with ${this.name} and ${global._servicePaths[iname].name}`);
                }
            } else {
                global._servicePaths[iname] = this;
            }
        }
        return this;
    }

    static load(name, design) {
        design.name = name;
        let service = new AService(design);
        return service;
    }

    static async call(actionName, opts, env) {
        const Action = require('./Action.js');
        let action = _findAction(actionName);
        // If the action is being called internally we need to fake the url in the req.
        if (!env) {
            env = {req: {url: `/${actionName}`}};
        }
        if (!env.req) {
            env.req = `/${actionName}`;
        }
        if (action && action.fn) {
            let args = _processArguments(action, opts);
            try {
                return await Action.execute(action, args, env);
            } catch (e) {
                console.error(actionName);
                console.error("Action Execute Error:", e);
                throw e;
            }
        } else {
            // Look for the Service
            let service = AService.findByPath(actionName);
            console.log("Could not find local Service:", actionName);
            console.log("Running via REST service!");
            return await service.call(actionName, opts);
        }
    }

    static findByPath(path) {
        let paths = path.split('/');
        while (paths.length > 0) {
            let pathCheck = `/${paths.join('/')}`;
            if (global._servicePaths.hasOwnProperty(pathCheck)) {
                return global._servicePaths[pathCheck];
            } else {
                paths.pop();
            }
        }
        return null;
    }

    launch(opts, env) {
    }

    launchContainer(opts, env) {
        let image = this.deployments.container.image;
        let cmd = this.deployments.container.cmd || '';
        let ports = this.getPorts();
        let portString = ports.map((port) => `-p ${port}:${port}`).join(' ');
        let launchCmd = `docker run -d --rm --name ${this.name} ${portString} ${image} ${cmd}`
        try {
            console.log("Launching Container:", launchCmd);
            execSync(launchCmd, {stdio: [process.stdin, process.stdout, process.stderr]});
            return;
        } catch (e) {
            console.error("Error launching container:", e);
        }
    }
    getPorts() {
        return Object.values(this.interface).filter((item) => item.port !== undefined)
            .map((item) => item.port);
    }

    async call(actionName, postData) {
        const inter = this.#findInterfaceByPath(actionName);
        const host = inter.host || 'localhost';
        const port = inter.port || 3000;
        const protocol = inter.protocol || 'http';

        actionName = `/${actionName}`.replace(/^\/+/, '/');
        const normalizedName = (inter.name && inter.path && inter.name !== inter.path) ? actionName.replace(inter.name, inter.path).replace(/^\/+/, '/') : actionName.replace(/^\/+/, '/');

        const url = `${protocol}://${host}:${port}${normalizedName}`;
        const retry = Math.max(1, this.policies.retry?.maxRetries || 5);
        let attempts = 0;

        // Validate and transform opts (POST data)
        while (attempts < retry) {
            attempts++;
            try {
                // Perform the POST request
                let response =  await axios.post(url, postData);
                return response.data;
            } catch (e) {
                console.error(`Attempt ${attempts}/${retry} failed for POST ${url}:`, e.message);
                this.launchContainer();
                await new Promise(res => setTimeout(res, 1000)); // Delay 1 second
            }
        }
        throw new Error(`Failed to POST ${url} after ${retry} attempts.`);
    }

    #findInterfaceByPath(path) {
        console.log("Looking for Service:", path);
        let paths = path.split('/');
        while (paths.length > 0) {
            let pathCheck = `/${paths.join('/')}`;
            if (this.interface.hasOwnProperty(pathCheck)) {
                this.interface[pathCheck].name = pathCheck;
                return this.interface[pathCheck];
            } else {
                paths.pop();
            }
        }
        return null;
    }
};
module.exports = AService;


const _findAction = (actions) => {
    const Action = require('./Action');
    return Action.find(actions);
}
const _processArguments = (action, opts) => {
    let retval = {};
    for (let name in opts) {
        if (action.inputs.hasOwnProperty(name)) {
            if (action.inputs[name].type === 'file') {
                // get the file and store it in the data variable
                try {
                    let apath = path.resolve(process.cwd() + '/' + opts[name]);
                    let contents = fs.readFileSync(apath, 'utf-8');
                    retval[name] = {data: contents};
                } catch (e) {
                    console.error("File error:", e);
                    throw new Error(e);
                }
            } else {
                retval[name] = opts[name];
            }
        } else {
            retval[name] = opts[name];
        }
    }
    return retval;
}
