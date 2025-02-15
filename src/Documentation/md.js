const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const Generator = require('./Generator.js');
const AClass = require('../Server/AClass');
const APackage = require('../Server/APackage');
const Action = require('../Server/Action');
const {execSync} = require("child_process");

const isDirectory = source => fs.existsSync(source) && fs.lstatSync(source).isDirectory();
const isFile = source => fs.existsSync(source) && !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    index: (name, output) => {
        indexGenerator(name, output);
    },
    model: (model, output) => {
        modelGenerator(model, output, '');
    },
    images: (images, output) => {
        for(let iname in images) {
            imageGenerator(images[iname], output, '');
        }
    },
    environments: (environments, output) => {
        for(let ename in environments) {
            environmentGenerator({name: ename, stacks:environments[ename]}, output, '');
        }
    },
    package: (package, output) => {
        packageGenerator(package, output, '');
    },
    environment: (environ, output) => {
        environGenerator(environ, output, '');
    },
    actors: (actors, output) => {
        actorsGenerator(actors, output + '/actors');
        for (let i in actors) {
            actorGenerator(actors[i], output + '/actors')
        }
    },
    workflows: (workflows, output) => {
        for(let i in workflows) {
            workflowGenerator(workflows[i], output + '/workflows')
        }
    },
    categories: (categories, output) => {
        for(let i in categories) {
            categoryGenerator(categories[i], output + '/categories')
        }
    },
    notes: (output) => {
        let mdir = path.resolve('./.notes'); 
        fs.mkdirSync(mdir, {recursive:true});
        let notesFiles = fs.readdirSync(mdir);
        
        for (let i in notesFiles) {
            let fileName = `${mdir}/${notesFiles[i]}`;
            let json = fs.readFileSync(path.resolve(fileName), 'utf-8');
            let note = JSON.parse(json);
            notesGenerator(note, output + '/notes');
        }
    },
    app: (app, output) => {
        appGenerator(app, output);
    },
    singleDoc: (app, output) => {
        singleGenerator(app, output);
    }
};
const appGenerator = (app, output) => {
    let files = {
        context: {
            name: app,
            nameNoSpace: app.replace(/ /g, ''),
            path: output,
            shortname: app.replace(/ /g, ''),
            Action: Action
        },
        targets: {
            'index.js': {template: '/templates/App/index.js'},
            'package.json': {template: '/templates/App/package.json'},
            'api/index.js': {template: '/templates/App/apiIndex.js'},
            'api/interface': {folder: true},
            'api/handlers': {folder: true},
            'test': {folder: true},
            'views': {folder: true},
            'actors': {folder: true},
            'bin': {folder: true},
            'views/layouts/default.ejs': {copy: '/templates/App/default.ejs'},
            'bin/:nameNoSpace:': {copy: '/templates/App/bin'},
            'plantuml.jar': {copy: '/templates/App/plantuml.jar'},
            'bin/lib/subcommander.js': {copy: '/templates/App/subcommander.js'},
            'deploy/docker-compose.yml': {template: '/templates/App/deploy/docker-compose.yml'},
            'deploy/build.js': {template: '/templates/App/deploy/build.js'},
            'deploy/web/Dockerfile': {template: '/templates/App/deploy/Dockerfile_web'},
            'deploy/doc/Dockerfile': {template: '/templates/App/deploy/Dockerfile_doc'},
            '/deploy/web/server.js': {template: '/templates/App/deploy/server.js'},
            '/deploy/doc/doc.js': {template: '/templates/App/deploy/doc.js'},
            'docs/plantuml.jar': {copy: '/templates/App/plantuml.jar'}
        }
    };
    addDocs(app, files, output, "./");
    Generator.process(files, output);

    for(let iname in global.ailtire.implementation.images) {
        imageGenerator(global.ailtire.implementation.images[iname], parent);
    }
};
const singleGenerator = (name, output) => {
    let services = {};
    for(let ename in global.deploy.envs) {
        let environ = global.deploy.envs[ename];
        for(let sname in environ) {
            let service = environ[sname];
            if(!services.hasOwnProperty(sname)) {
                services[sname] = {};
            }
            services[sname][ename] = service;
        }
    }
    let pakageconfig = fs.readFileSync(path.resolve('./package.json'), 'utf-8');
    let pkgconfig = JSON.parse(pakageconfig);
    let sbom = _getSBOM();
    
    let files = {
        context: {
            sbom: sbom,
            author: pkgconfig.author,
            basedir: output,
            packages: global.packages,
            actors: global.actors,
            appName: name,
            package: global.topPackage,
            topPackage: global.topPackage,
            packageName: global.topPackage.name,
            shortname: '',
            environments: global.deploy.envs,
            services: services,
            version: global.ailtire.config.version,
            workflows: global.workflows,
            category: global.categories,
            fs: fs,
            _stripHeader: _stripHeader,
            _getAllEnvironments: _getAllEnvironments
        },
        targets: {
            './singleDoc.md': {template: '/templates/App/singleDoc.emd'},
        },
    };
    addDocs(global.topPackage, files, output, '');
    Generator.process(files, output);
};
const indexGenerator = (name, output) => {
    let services = {};
    for(let ename in global.deploy.envs) {
        let environ = global.deploy.envs[ename];
        for(let sname in environ) {
            let service = environ[sname];
            if(!services.hasOwnProperty(sname)) {
                services[sname] = {};
            }
            services[sname][ename] = service;
        }
    }
    let files = {
        context: {
            basedir: output,
            packages: global.topPackage.subpackages,
            actors: global.actors,
            appName: name,
            package: global.topPackage,
            topPackage: global.topPackage,
            packageName: global.topPackage.name,
            shortname: '',
            environments: global.deploy.envs,
            services: services,
            version: global.ailtire.config.version,
            workflows: global.workflows,
            category: global.categories
        },
        targets: {
            './index.md': {template: '/templates/App/index.emd'},
            './toc.md': {template: '/templates/App/toc.emd'},
            './plantuml.jar': {copy: '/templates/App/plantuml.jar'},
            './usecases.puml': {template: '/templates/Package/UseCases.puml'},
            './subpackage.puml': {template: '/templates/Package/SubPackage.puml'},
            './usecases.md': {template: '/templates/UseCase/all.emd'},
            './classes.md': {template: '/templates/Model/all.emd'},
            './images.md': {template: '/templates/Image/all.emd'},
            './environments.md': {template: '/templates/Environment/all.emd'},
            './workflows.md': {template: '/templates/Category/all.emd'},
            // './services.md': {template: '/templates/Service/all.emd'},
            './_config.yml': {template: '/templates/App/_config.yml'},
            './_config-local.yml': {template: '/templates/App/_config-local.yml'},
        },
    };
    addDocs(global.topPackage, files, output, '');
    Generator.process(files, output);
};

const notesGenerator = (note, output) => {
    if(!note.name) { note.name = note.createdDate; }
    
    let files = {
        context: {
            note: note,
            noteName: note.name.replace(/\s/g,''),
            noteID: note.id
        },
        targets: {
            './Note:noteID:.md': {template: '/templates/Note/index.emd'},
        },
    };
    try {
        Generator.process(files, output);
    }
    catch(e) {
        console.error(e);
    }
};

const categoryGenerator = (category, output) => {
    if(!category.name) { category.name = category.prefix.split('/').pop(); }
    let categoryName = category.name.replace(/\s/g,'');
    let files = {
        context: {
            category: category,
            basedir: category.baseDir, 
            categoryName: categoryName
        },
        targets: {
            './:categoryName:.md': {template: '/templates/Category/index.emd'},
            './:categoryName:.puml': {template: '/templates/Category/category.puml'},
        },
    };
    let heritage = _getWorkflowHeritage(category);
    files.context.parent = heritage.parent;
    files.context.grandparent = heritage.grandparent; 
    Generator.process(files, output);
};
const workflowGenerator = (workflow, output) => {
    let files = {
        context: {
            workflow: workflow,
            workFlowName: workflow.name.replace(/\s/g,'')
        },
        targets: {
            './:workFlowName:.md': {template: '/templates/Workflow/index.emd'},
            './:workFlowName:.puml': {template: '/templates/Workflow/workflow.puml'},
            './:workFlowName:Data.puml': {template: '/templates/Workflow/dataflow.puml'},
        },
    };
    let heritage = _getWorkflowHeritage(workflow);
    files.context.parent = heritage.parent; 
    files.context.grandparent = heritage.grandparent;
    Generator.process(files, output);
};
const modelGenerator = (model, output, urlPath) => {
    let files = {
        context: {
            model: model,
            shortname: model.name.replace(/ /g, ''),
            modelname: model.name,
            modelnamenospace: model.name.replace(/ /g, '').toLowerCase(),
            pageDir: '.' + urlPath + '/' + model.name.replace(/ /g, '').toLowerCase(),
            Action: Action
        },
        targets: {
            './:modelnamenospace:/index.md': {template: '/templates/Model/index.emd'},
            './:modelnamenospace:/logical.puml': {template: '/templates/Model/Logical.puml'},
            './:modelnamenospace:/statenet.puml': {template: '/templates/Model/StateNet.puml'},
        }
    };
    addDocs(model, files, output + urlPath, urlPath);
    Generator.process(files, output + urlPath);
};
const imageGenerator = (image, output, urlPath) => {
    let package = global.topPackage;
    try {
        package = APackage.getPackage(image.pkg);
    }
    catch(e) {

    }

    let files = {
        context: {
            image: image,
            package: package,
            imagenospace: image.name.replace(/:/g, '--').toLowerCase(),
        },
        targets: {
            './images/:imagenospace:/index.md': {template: '/templates/Image/index.emd'},
        }
    };
    Generator.process(files, output + urlPath);
};
const packageGenerator = (package, output, urlPath, parent, grand_parent) => {
    let actors = {};
    for (let ucname in package.usecases) {
        let usecase = package.usecases[ucname];
        let ucnameNoSpace = ucname.replace(/ /g, '');
        for (let aname in usecase.actors) {
            aname = aname.replace(/\s/g, '');
            if (!actors.hasOwnProperty(aname)) {
                if(global.actors[aname]) {
                    actors[aname] = {usecases: {}, name: aname, shortname: global.actors[aname].shortname};
                } else {
                    console.error("Actor: ", aname, " not found! in use case: ", ucname);
                }
            }
            actors[aname].usecases[ucnameNoSpace] = usecase;
        }
    }
    let depkgs = {};
    let depends = [];
    for(let i in package.depends) {
        let dpkg = package.depends[i];
        depkgs[dpkg.prefix] = dpkg;
        depends.push({from: package.prefix, to:dpkg.prefix});
    }
    for(let sname in package.subpackages) {
        let spkg = package.subpackages[sname];
        for(let i in spkg.depends) {
            let dpkg = spkg.depends[i];
            depkgs[dpkg.prefix] = dpkg;
            depends.push({from: spkg.prefix, to:dpkg.prefix});
        }
    }
    let dpkgs = {subpackages:{}};
    dpkgs.subpackages[global.topPackage.shortname] = {subpackages:{}};
    for(let prefix in depkgs) {
        let path = prefix.split('/');
        let depkg = depkgs[prefix];
        let map = dpkgs;
        for(let i in path) {
            let value = path[i];
            if(value) {
                if (!map.subpackages.hasOwnProperty(value)) {
                    map.subpackages[value] = {subpackages: {}, shortname: value, color: depkg.color};
                }
                map = map.subpackages[value];
            }
        }
        map.name = depkgs[prefix].name;
    }
    dpkgs = dpkgs.subpackages[global.topPackage.shortname];
    let files = {
        context: {
            parent: parent,
            grand_parent: grand_parent,
            basedir: output + urlPath + '/' + package.shortname,
            package: package,
            actors: actors,
            packageName: package.name,
            shortname: package.shortname.replace(/ /g, '').toLowerCase(),
            packageNameNoSpace: package.name.replace(/ /g, ''),
            pageDir: '.' + urlPath + '/' + package.shortname.replace(/ /g, '').toLowerCase(),
            Action: Action,
            APackage: APackage,
            depends: depends,
            packages: dpkgs,
        },
        targets: {
            ':shortname:/index.md': {template: '/templates/Package/index.emd'},
            ':shortname:/logical.puml': {template: '/templates/Package/Logical.puml'},
            ':shortname:/usecases.puml': {template: '/templates/Package/UseCases.puml'},
            ':shortname:/userinteraction.puml': {template: '/templates/Package/UserInteraction.puml'},
            ':shortname:/logical.puml': {template: '/templates/Package/Logical.puml'},
            ':shortname:/subpackage.puml': {template: '/templates/Package/SubPackage.puml'},
            ':shortname:/process.puml': {template: '/templates/Package/Process.puml'},
            ':shortname:/scenariomapping.puml': {template: '/templates/Package/ScenarioMapping.puml'}
        },
    };
    // Get the doc from the package and add them to the targets list
    addDocs(package, files, output + urlPath, urlPath);

    // Deployment must happen before the package is generated.
    // The Package has a dependency on the deployments. with the partial call.
    for (let ename in package.deploy.envs) {
        package.deploy.envs[ename].name = ename;
        environGenerator(package, package.deploy.envs[ename], output, urlPath + '/' + files.context.shortname + '/envs');
    }
    Generator.process(files, output + urlPath);
    for (let cname in package.classes) {
        modelGenerator(package.classes[cname].definition, output, urlPath + '/' + files.context.shortname + '/models/');
    }
    for (let ucname in package.usecases) {
        useCaseGenerator(package.usecases[ucname], output, urlPath + '/' + files.context.shortname + '/usecases');
    }

    for (let spname in package.subpackages) {
        packageGenerator(package.subpackages[spname], output, urlPath + '/' + files.context.shortname, package, parent);
    }
};
const useCaseGenerator = (usecase, output, urlPath) => {
    let files = {
        context: {
            config: global.ailtire.config,
            usecase: usecase,
            useCaseDirectory: usecase,
            shortname: usecase.name.replace(/ /g, ''),
            usecaseName: usecase.name,
            usecaseNameNoSpace: usecase.name.replace(/ /g, '').toLowerCase(),
            actors: global.actors,
            pageDir: '.' + urlPath + '/' + usecase.name.replace(/ /g, '').toLowerCase()
        },
        targets: {
            ':usecaseNameNoSpace:/index.md': {template: '/templates/UseCase/index.emd'},
            ':usecaseNameNoSpace:/activities.puml': {template: '/templates/UseCase/Activities.puml'},
        },
    };
    // Get the doc from the package and add them to the targets list
    try {
        addDocs(usecase, files, output + urlPath, urlPath);
        Generator.process(files, output + urlPath);
        for (let i in usecase.scenarios) {
            scenarioGenerator(usecase, usecase.scenarios[i], output + urlPath, '/' + usecase.name.replace(/\s/g, ''));
        }
    } catch (e) {
        console.error("Error for UseCase Generator:", e);
    }
};
const scenarioGenerator = (usecase, scenario, output, urlPath) => {
    let pkg = global.packages[usecase.package.replace(/\s/g, '')];
    let pkgs = {};
    for (let i in scenario.steps) {
        let step = scenario.steps[i];
        step.action = step.action.replace(/\s/g, '/');
        let act = Action.find(`/${step.action.toLowerCase()}`);
        if (act) {
            step.act = act;
            if (!pkgs.hasOwnProperty(act.pkg.shortname)) {
                pkgs[act.pkg.shortname] = {
                    pkg: act.pkg,
                    models: {}
                }
            }
            if (act.cls) {
                let name = act.cls.toLowerCase();
                pkgs[act.pkg.shortname].models[name] = name;
            }
        }
        else {
            console.error("Could not find the action:", step.action.toLowerCase());
        }
    }

    let files = {
        context: {
            usecase: usecase,
            scenario: scenario,
            pkgs: pkgs,
            package: pkg,
            shortname: scenario.name.replace(/ /g, ''),
            actors: scenario.actors,
            Action: Action
        },
        targets: {
            ':shortname:.puml': {template: '/templates/Scenario/Scenario.puml'},
        },
    };
    // Get the doc from the package and add them to the targets list
    let outputURL = output + urlPath;
    outputURL = outputURL.toLowerCase();
    Generator.process(files, outputURL);
};
const actorsGenerator = (actors, output) => {
    let apackages = {};
    for (let h in actors) {
        let actor = actors[h];
        for (let i in actor.usecases) {
            let usecase = actor.usecases[i];
            let uname = usecase.name.replace(/\s/g, '');
            let packageName = usecase.package.replace(/\s/g, '');
            if (!apackages.hasOwnProperty(packageName)) {
                apackages[packageName] = {
                    color: global.packages[packageName].color,
                    shortname: global.packages[packageName].shortname,
                    usecases: {},
                    name: usecase.package
                };
            }
            apackages[packageName].usecases[uname] = usecase;
        }
    }
    let files = {
        context: {
            actors: actors,
            actorPackages: apackages,
            pageDir: output,
            basedir: output,
            shortname: ''
        },
        targets: {
            '/index.md': {template: '/templates/Actor/all.emd'},
            '/actors.puml': {template: '/templates/Actor/All.puml'},
        },
    };
    let inputdir = global.ailtire.config.baseDir + '/actors';
    addDocsByDir(actors, files, inputdir, output, "./actors");
    Generator.process(files, output);
};
const environmentGenerator = (env, output, urlPath) => {

    let files = {
        context: {
            environ: env,
            envName: env.name,
            pageDir: urlPath
        },
        targets: {
            'environments/:envName:/index.md': {template: '/templates/Environment/index.emd'},
        },
    };
    // Get the doc from the package and add them to the targets list
    Generator.process(files, output + urlPath);
};
const environGenerator = (pkg, env, output, urlPath) => {

    let deploy = {
        ports: {},
        networks: {},
        services: {},
        images: {},
        ingress: {},
        egress: {},
        frontend: {},
        stacks: {}
    };
    const colors = ["#black", "#blue", "#red", "#orange", "#darkgreen", "#darkgray"];
    let i = 0;
    if (Object.keys(env.definition).length === 0) {
        env.definition = env.design;
    }
    for (let nname in env.definition.networks) {
        let network = env.definition.networks[nname];
        network.color = colors[i++];
        network.type = 'internal';
        network.id = nname.replace(/\s/g, '') + 'net';
        deploy.networks[nname] = network;
        if (network.hasOwnProperty("attachable") && network.attachable) {
            network.externalName = network.name.replace(/[\$\{\}]/g, '').toLowerCase();
            network.type = 'egress';
            deploy.egress[network.name.replace(/[\$\{\}]/g, '').toLowerCase()] = network;
        } else if (network.hasOwnProperty("external") && network.external) {
            network.externalName = network.name.replace(/[\$\{\}]/g, '').toLowerCase();
            network.type = 'ingress';
            deploy.ingress[network.name.replace(/[\$\{\}]/g, '').toLowerCase()] = network;
        }
        // This needs to happen after we have captured the external name.
        network.name = nname.replace(/[\$\{\}]/g, '').toLowerCase();
    }


    deploy.services = env.definition.services;
    let environment = undefined;
    if(!pkg.physical) {
        pkg.physical = global.topPackage.physical;
    }
    if(pkg.physical) {
        if(pkg.physical.environments.hasOwnProperty(env.name)) {
                    environment = pkg.physical.environments[env.name];
                }
            }
            for (let sname in env.definition.services) {
                let service = env.definition.services[sname];
                service.name = sname;
                // Grab any ports that will be external
                for (let i in service.ports) {
                    let maps = service.ports[i].replace(/"/g, '').split(':');
                    deploy.ports[maps[0]] = {
                        port: maps[1],
                        service: sname,
                    }
                }
                deploy.images[service.image] = {
                    name: service.image,
                    id: service.image.replace(/\:/, '') + 'image'
                }
                service.id = service.name.replace('/\s/g', '') + 'Service';
                if (service.image.includes('traefik')) {
                    deploy.frontend.service = service;
                    deploy.frontend.image = service.image;
                    deploy.frontend.id = 'frontendService';
                    deploy.frontend.maps = [];
                }
                // Now get the right network from the network list.
                let networks = {};
                for (let i in service.networks) {
                    let network = "";
                    let net = service.networks[i];
                    if (typeof net === 'string') {
                        if (deploy.networks.hasOwnProperty(net)) {
                            network = deploy.networks[net];
                            networks[net] = network;
                        }
                    } else {
                        if (deploy.networks.hasOwnProperty(i)) {
                            network = deploy.networks[i];
                            networks[i] = network;
                        }
                    }
                }
                service.networks = networks;
                let label = "";
                let network = "";
                let port = "";
                let route = "";
                if (service.deploy) {
                    for (let j in service.deploy.labels) {
                        label = service.deploy.labels[j];
                        if (label.includes('rule=')) {
                            route = label.replace(/^.*\(\`/, '').replace(/\`.*$/, '');
                        } else if (label.includes('network=')) {
                            let networkname = label.replace(/^.*=/, '').replace(/[\$\{\}]/g, '').toLowerCase();
                            if (deploy.egress.hasOwnProperty(networkname)) {
                                network = deploy.egress[networkname];
                            } else if (deploy.ingress.hasOwnProperty(networkname)) {
                                network = deploy.egress[networkname];
                            } else if (deploy.networks.hasOwnProperty(networkname)) {
                            network = deploy.networks[nnetworkname];
                        } else {
                            for (let nname in deploy.egress) {
                                if (deploy.egress[nname].externalName === networkname) {
                                    network = deploy.egress[nname];
                                }
                            }
                            for (let nname in deploy.ingress) {
                                if (deploy.ingress[nname].externalName === networkname) {
                                    network = deploy.ingress[nname];
                                }
                            }
                        }
                    } else if (label.includes('port=')) {
                        port = label.replace(/^.*=/, '');
                    }
                }
                if (!network) {
                    network = {
                        name: 'Default',
                        color: '#blue'
                    }
                }
            if (!deploy.frontend.hasOwnProperty('maps')) {
                deploy.frontend.maps = [];
            }
            service.path = route;
            if (!service.hasOwnProperty('ports')) {
                service.ports = [];
            }
            service.ports.push(port);
            deploy.frontend.maps.push({
                service: service,
                port: port,
                network: network,
                path: route,
                id: route.replace(/\//g, '') + 'map'
            });
        }
    }
    // Iterate through the images and find out which ones are stacks and which ones are images.
    for (let iname in deploy.images) {
        let image = deploy.images[iname];
        let [name, version] = image.name.split(':');
        let stack = getStack(name);
        let newStack = null;
        if (stack) {
            let newStack = {
                deploy: stack.deploy,
                name: name,
                networks: {},
                id: name.replace(/ /g, '') + 'Stack',
                color: stack.color,
                image: iname
            }
            deploy.stacks[name] = newStack;
            image.stack = newStack;
            // Now connect the substack in newstack to the current stack.
            // Look at the stack.deploy and find the external network that has the same name as one
            // in the parent stack's external name.
            // Look in the same environment as the current stack.
            if (stack.deploy && stack.deploy.envs[env.name]) {
                let ssdeploy = stack.deploy.envs[env.name].definition;
                // Iterate over the external networks and find the external Network in the deploy.networks that match
                for (let ssnname in ssdeploy.networks) {
                    let ssnet = ssdeploy.networks[ssnname];
                    if (ssnet.external) {
                        let ssename = ssnet.name.replace(/[\$\{\}]/g, '').toLowerCase();
                        for (let nname in deploy.networks) {
                            let net = deploy.networks[nname];
                            if (net.externalName === ssename) {
                                stack.deploy.externalNetwork = net;
                            }
                        }
                    }
                }
            }
        }
    }
    // Remove the frontend service from the service list. It preventss it from being used twice
    if (deploy.frontend.id) {
        delete deploy.services[deploy.frontend.service.name];
    }

    if(!environment) {
        console.error("Environment not definedd: not phsyuical:", pkg.name);
        return;
    }
    let files = {
        context: {
            envName: env.name,
            environ: env,
            deploy: deploy,
            colors: colors,
            pkg: pkg,
            environment: environment,
            package: pkg,
            pageDir: urlPath
        },
        targets: {
            ':envName:/index.md': {template: '/templates/Environment/_index.emd'},
            ':envName:/deployment.puml': {template: '/templates/Environment/Deployment.puml'},
        },
    };
    if(pkg.physical && environment) {
        console.log("Physical Stuff:", output + urlPath);
        files.targets[':envName:/physical-network.puml']= {template: '/templates/Environment/physical-network.puml'};
        files.targets[':envName:/physical-deployment.puml']= {template: '/templates/Environment/physical-deployment.puml'};
    }

    // Get the doc from the package and add them to the targets list
    Generator.process(files, output + urlPath);
};
const actorGenerator = (actor, output) => {
    let apackages = {};

    for (let i in actor.usecases) {
        let usecase = actor.usecases[i];
        let uname = usecase.name.replace(/\s/g, '');
        let packageName = usecase.package.replace(/\s/g, '');
        if (!apackages.hasOwnProperty(packageName)) {
            apackages[packageName] = {
                color: global.packages[packageName].color,
                shortname: global.packages[packageName].shortname,
                usecases: {},
                name: usecase.package
            };
        }
        apackages[packageName].usecases[uname] = usecase;
    }
    let files = {
        context: {
            actor: actor,
            basedir: output + '/' + actor.shortname,
            actorNameNoSpace: actor.shortname,
            actorPackages: apackages,
            pageDir: './actors/' + actor.shortname
        },
        targets: {
            ':actorNameNoSpace:/index.md': {template: '/templates/Actor/index.emd'},
            ':actorNameNoSpace:/usecase.puml': {template: '/templates/Actor/UseCase.puml'},
        },
    };
    // Get the doc from the package and add them to the targets list
    if (actor.hasOwnProperty('doc')) {
        for (let i in actor.doc.files) {
            let file = actor.doc.files[i];
            let sourcefile = path.resolve(actor.doc.basedir + file);
            if (file.includes('.ejs')) {
                files.targets[`:actorNameNoSpace:/${file}`] = {template: `${sourcefile}`};
            } else {
                files.targets[`:actorNameNoSpace:/${file}`] = {copy: `${sourcefile}`};
            }
        }
    }
    Generator.process(files, output);
};

const addDocsByDir = (obj, files, input, output, urlPath) => {
    let newFiles = {
        targets: {},
        context: {}
    }
    for (let name in files.context) {
        newFiles.context[name] = files.context[name];
    }
    newFiles.context.pageDir = '.' + urlPath + '/' + files.context.shortname;
    let ipath = path.resolve(input + '/doc');
    if (isDirectory(ipath)) {
        let files = getFiles(ipath);
        for (let i in files) {
            let file = files[i];
            let sourcefile = path.resolve(file);
            file = path.basename(file);
            if (file.includes('.emd')) {
                newFiles.targets[`:shortname:/${file}`] = {template: `${sourcefile}`};
            } else {
                newFiles.targets[`:shortname:/${file}`] = {copy: `${sourcefile}`};
            }
        }
    }
    Generator.process(newFiles, output);
}

const addDocs = (obj, files, output, urlPath) => {
    let newFiles = {
        targets: {},
        context: {}
    }
    for (let name in files.context) {
        newFiles.context[name] = files.context[name];
    }
    newFiles.context.pageDir = '.' + urlPath + '/' + files.context.shortname;

    if (obj.hasOwnProperty('doc') && obj.doc) {
        for (let i in obj.doc.files) {
            let file = obj.doc.files[i];
            let sourcefile = path.resolve(obj.doc.basedir + file);
            if (file.includes('.emd')) {
                newFiles.targets[`:shortname:/${file}`] = {template: `${sourcefile}`};
            } else {
                newFiles.targets[`:shortname:/${file}`] = {copy: `${sourcefile}`};
            }
        }
    }
    Generator.process(newFiles, output);
}

const getStack = (name) => {
    for (let pname in global.packages) {
        let pkg = global.packages[pname];
        if (pkg.deploy.name === name) {
            return pkg;
        }
    }
    return null;
}
function _getWorkflowHeritage(workflow) {
    let parent = "Workflows";
    let grandparent = null;
    if(!workflow.prefix) { workflow.prefix = workflow.name.replace(/\s/,''); }
    let heritage = workflow.prefix.split('/');
    if(heritage.length > 0) {
        parent = `cagtegory-${heritage.join('-')}`
        heritage.pop();
        greandparent = "Workflows"
        if (heritage.length > 0) {
            grandparent = `category-${heritage.join('-')}`
        } else {
            grandparent = null;
        }
    }
    return {grandparent: grandparent, parent: parent};
}

function _getSBOM() {
    if(!global.ailtire.implementation) {
        global.ailtire.implementation = {}
    }
    if(!global.ailtire.implementation.libraries) {
        let results = execSync("npm list --all --json").toString();
        let retval = JSON.parse(results);
        global.ailtire.implementation.libraries = retval;
        global.ailtire.implementation.components = { };
        global.ailtire.implementation.components[retval.name] = retval;
        _iterateLibraries(retval.dependencies);
    }
    return global.ailtire.implementation;
}

function _iterateLibraries(items) {
    let total = 0;
    for(let name in items) {
        total++;
        global.ailtire.implementation.components[name] = items[name];
        global.ailtire.implementation.components[name].name = name;
        if(items[name].dependencies) {
            let depth = _iterateLibraries(items[name].dependencies);
            global.ailtire.implementation.components[name].depth = depth;
            total += depth;
        }
    }
    return total;
}

function _stripHeader(hlevel, basedir, text) {
    const cwd = path.join(process.cwd(),  "docs");
    basedir = basedir.startsWith(cwd) ? basedir.substring(cwd.length +1 ) : basedir;
    basedir = basedir.replace(/\\/g, '/')
    text = text.replace(/\r\n/g, '\n');
    let yamlHeader = text.match(/---[\s\S]*?---\n/);
    let retval = "";
    let permalink = "";
    if(yamlHeader) {
        permalink = yamlHeader[0].match(/permalink:\s*["']?(.*?)['"]?\s*\n/);
    } 
    
    let textLines = text.replace(/---[\s\S]*?---\n/,'').split('\n');
    // Now check for hyperlinkes and change them if they do not have a :// token
    let foundTitle = false;
    for(let i in textLines) {
        let line = textLines[i];
        let header = line.match(/^#/);
        if(header) {
            let firstHeader = header[1];
            if(!foundTitle && permalink) {
                line = hlevel + line + ` {#${permalink[1]}}\n`
                foundTitle = true;
            } else {
                line = hlevel + line;
            }
        }
        
        let test = line.match(/\[.*\]\(.*\)/);
        if(test) {
            // This is a image
            if(line.match(/^!\[/)) {
                line = line.replace(/\]\(\.\//g, `](./${basedir}/`);
            } else if(!line.includes('http')) {
                if(!line.includes('](#')) {
                    line = line.replace(/\]\(/g, '](#');
                }
            } 
        }
        retval += line + '\n';
    }
    
    return retval;
}
function _getAllEnvironments(hlevel, basedir, environment) {
    const dirs = fs.readdirSync(basedir);
    let retval = "";
    for(let i in dirs) {
        const entryPath = path.join(basedir, dirs[i]);
        if(fs.statSync(entryPath).isDirectory()) {
            const envDir = path.join(basedir, "envs", environment);
            if(fs.existsSync(envDir) && fs.statSync(envDir).isDirectory()) {
                const indexPath = path.join(envDir, 'index.md'); 
                if(fs.existsSync(indexPath)) {
                   retval += _stripHeader(hlevel, envDir, fs.readFileSync(indexPath,'utf-8'));
                }
            }
            retval += _getAllEnvironments(hlevel, entryPath, environment);
        }
    }
    return retval;
}