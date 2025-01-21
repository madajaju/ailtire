const AService = require("./AService");
const {spawnSync: spawn} = require("child_process");
const Generator = require("ailtire/src/Documentation/Generator");

class AStack {
    constructor(opts) {
        this.name = opts.name;
        this.environment = opts.environment;
        this.composeFile = null;
        this.dockerFile = null;
        this.services = {};
        this.networks = {};
        this.policies = {};
        this.data = {};
        this.interface = {};
    }

    static load(name, environment, design) {
        if (!design.networks.hasOwnProperty('parent')) {
            design.networks.parent = {external: true, name: "Parent"};
        }
        if (!design.networks.hasOwnProperty('children')) {
            design.networks.children = {driver: "overlay", attachable: true, name: "Children"};
        }
        if (!design.networks.hasOwnProperty('siblings')) {
            design.networks.siblings = {driver: "overlay", name: "Siblings"};
        }
        let stack = new AStack({name: name, environment: environment});
        stack.networks = design.networks;
        stack.policies = design.policies;
        stack.data = design.data;
        stack.interface = design.interface;


        // Go through the services and make sure networks are set coorectly.
        for (let sname in design.services) {
            let service = design.services[sname];
            // If the service is a stack of services.
            if (service.type === 'stack') {
                if (service.networks) {
                    if (service.networks.hasOwnProperty('children')) {
                        service.networks.children = {};
                    }
                } else {
                    service.networks = {children: {}};
                }
            }
            if (service.networks) {
                if (service.networks.hasOwnProperty('siblings')) {
                    service.networks.siblings = {};
                }
            } else {
                service.networks = {siblings: {}};
            }
            let serviceObj = AService.load(sname, service);
            stack.addService(serviceObj);
        }
        return stack;
    }
    addService(service) {
        this.services[service.name] = service;
    }

    launch(opts, env) {

    }

    build(opts) {
        this.#buildServiceFiles(opts);
        // Create the Dockerfile from the template with contexts set from the deploy
        let proc = spawn('docker', ['build', '-t', this.tag, '-f', this.dockerFile, '.'], {
            cwd: this.baseDir,
            stdio: [process.stdin, process.stdout, process.stderr],
            env: process.env
        });
        if (proc.status != 0) {
            console.error("Error Building Service Container", pkg.deploy.name);
            console.error(proc.stdout.toString('utf-8'));
            console.error(proc.stderr.toString('utf-8'));
        }

    }

    #buildServiceFiles(opts) {
        let repo = '';
        if (opts.repo) {
            repo = opts.repo + '/';
        }
        let files = {
            context: {
                stack: this,
                repo: repo
            },
            targets: {
                './.tmp-dockerfile': {template: '/templates/Package/deploy/Dockerfile-Service'},
                './.tmp-stack-compose.yml': {template: '/templates/Package/deploy/stack-compose.yml'},
                './.router.js': {template: '/templates/Package/deploy/router.ejs'},
            }
        };
        Generator.process(files, pkg.deploy.dir);
        if (!this.composefile) {
            composeFile = './.tmp-stack-compose.yml';
        }
        this.dockerFile = './.tmp-dockerfile';
        return;
    }
}

module.exports = AStack;