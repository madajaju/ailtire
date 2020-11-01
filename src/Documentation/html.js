let ejs = require('ejs');
let path = require('path');
let Generator = require('./Generator.js');
const AClass = require('../Server/AClass');
const Action = require('../Server/Action');

module.exports = {
    index: (name, output) => {
        indexGenerator(name, output);
    },
    model: (model, output) => {
        modelGenerator(model, output, '');
    },
    package: (package, output) => {
        packageGenerator(package, output, '');
    },
    environment: (environ, output) => {
        environmentGenerator(environ, output, '');
    },
    actors: (actors, output) => {
        actorsGenerator(actors, output + '/actors');
        for(let i in actors) {
            actorGenerator(actors[i], output + '/actors')
        }
    },
    app: (app, output) => {
        appGenerator(app, output);
    }
};
const appGenerator = (app, output) => {
    let files = {
        context: {
            name: app,
            nameNoSpace: app.replace(/ /g, ''),
            path: output,
            shortname: app.replace(/ /g,'')
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
            'bin/init': {copy: '/templates/App/init'},
            '../assets/js/d3.js': {copy: '/templates/App/js/d3.js'},
            '../assets/js/three.js': {copy: '/templates/App/js/three.js'},
            '../assets/js/Graph.js': {copy: '/templates/App/js/Graph.js'},
            '../assets/js/Graph2D.js': {copy: '/templates/App/js/Graph2D.js'},
            '../assets/js/Graph3D.js': {copy: '/templates/App/js/Graph3D.js'},
            '../assets/js/3d-force-graph.js': {copy: '/templates/App/js/3d-force-graph.js'},
            '../assets/js/d3-force-d3.js': {copy: '/templates/App/js/d3-force-3d.js'},
            '../assets/js/less.js': {copy: '/templates/App/js/less.js'},
            '../assets/js/socket.io.js': {copy: '/templates/App/js/socket.io.js'},
            '../assets/styles/color.less': {copy: '/templates/App/styles/color.less'},
            '../assets/styles/graph.less': {copy: '/templates/App/styles/graph.less'},
            '../assets/styles/importer.less': {copy: '/templates/App/styles/importer.less'},
            '../assets/styles/top.less': {copy: '/templates/App/styles/top.less'},
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
    addDocs(app, files, output,"./");
    Generator.process(files, output);
};
const indexGenerator = (name, output) => {

    let files = {
        context: {
            basedir: output,
            packages: global.topPackage.subpackages,
            actors: global.actors,
            appName: name,
        },
        targets: {
            './index.html': {template: '/templates/App/index.ejs'},
            '../assets/js/d3.js': {copy: '/templates/App/js/d3.js'},
            '../assets/js/three.js': {copy: '/templates/App/js/three.js'},
            '../assets/js/aframe.js': {copy: '/templates/App/js/aframe.js'},
            '../assets/js/Graph.js': {copy: '/templates/App/js/Graph.js'},
            '../assets/js/Graph2D.js': {copy: '/templates/App/js/Graph2D.js'},
            '../assets/js/Graph3D.js': {copy: '/templates/App/js/Graph3D.js'},
            '../assets/js/3d-force-graph.js': {copy: '/templates/App/js/3d-force-graph.js'},
            '../assets/js/d3-force-3d.js': {copy: '/templates/App/js/d3-force-3d.js'},
            '../assets/js/Graph3DLogical.js': {copy: '/templates/App/js/Graph3DLogical.js'},
            '../assets/js/d3-octree.js': {copy: '/templates/App/js/d3-octree.js'},
            '../assets/js/forceInACube.js': {copy: '/templates/App/js/forceInACube.js'},
            '../assets/js/less.js': {copy: '/templates/App/js/less.js'},
            '../assets/js/socket.io.js': {copy: '/templates/App/js/socket.io.js'},
            '../assets/styles/color.less': {copy: '/templates/App/styles/color.less'},
            '../assets/styles/graph.less': {copy: '/templates/App/styles/graph.less'},
            '../assets/styles/importer.less': {copy: '/templates/App/styles/importer.less'},
            '../assets/styles/top.less': {copy: '/templates/App/styles/top.less'},
            './app.html': {template: '/templates/App/app.ejs'},
            './plantuml.jar': {copy: '/templates/App/plantuml.jar'},
            '../assets/js/less.js': {copy: '/templates/App/js/less.js'},
            '../assets/styles/importer.less': {copy: '/templates/App/styles/docimporter.less'},
            '../assets/styles/doc.less': {copy: '/templates/App/styles/doc.less'},
        }
    };
    Generator.process(files, output);
};
const modelGenerator = (model, output, urlPath) => {
    let files = {
        context: {
            model: model,
            shortname: model.name.replace(/ /g, ''),
            modelname: model.name,
            modelnamenospace: model.name.replace(/ /g, '').toLowerCase(),
            pageDir: '.' + urlPath + '/' + model.name.replace(/ /g,'').toLowerCase()
        },
        targets: {
            './:modelnamenospace:/index.html': {template: '/templates/Model/index.ejs'},
            './:modelnamenospace:/Logical.puml': {template: '/templates/Model/Logical.puml'},
            './:modelnamenospace:/StateNet.puml': {template: '/templates/Model/StateNet.puml'},
        }
    };
    addDocs(model, files, output + urlPath, urlPath);
    Generator.process(files, output + urlPath);
};
const packageGenerator = (package, output, urlPath) => {
    let actors = {};
    for(let ucname in package.usecases) {
        let usecase = package.usecases[ucname];
        let ucnameNoSpace = ucname.replace(/ /g, '');
        for(let aname in usecase.actors) {
            aname = aname.replace(/\s/g, '');
            if(!actors.hasOwnProperty(aname)) {
                actors[aname] = { usecases: {}, name:aname, shortname: global.actors[aname].shortname };
            }
            actors[aname].usecases[ucnameNoSpace] = usecase;
        }
    }
    let files = {
        context: {
            basedir: output + urlPath + '/' + package.shortname,
            package: package,
            actors: actors,
            packageName: package.name,
            shortname: package.shortname.replace(/ /g, '').toLowerCase(),
            packageNameNoSpace: package.name.replace(/ /g, ''),
            pageDir: '.' + urlPath + '/' + package.shortname.replace(/ /g, '').toLowerCase()
        },
        targets: {
            ':shortname:/index.html': {template: '/templates/Package/index.ejs'},
            ':shortname:/Logical.puml': {template: '/templates/Package/Logical.puml'},
            ':shortname:/UseCases.puml': {template: '/templates/Package/UseCases.puml'},
            ':shortname:/UserInteraction.puml': {template: '/templates/Package/UserInteraction.puml'},
            ':shortname:/Logical.puml': {template: '/templates/Package/Logical.puml'},
            ':shortname:/SubPackage.puml': {template: '/templates/Package/SubPackage.puml'},
            ':shortname:/Process.puml': {template: '/templates/Package/Process.puml'},
            ':shortname:/ScenarioMapping.puml': {template: '/templates/Package/ScenarioMapping.puml'}
        }
    };
    // Get the doc from the package and add them to the targets list
    addDocs(package, files,output + urlPath, urlPath);

    // Deployment must happen before the package is generated. 
    // The Package has a dependency on the deployments. with the partial call.
    for(let ename in package.deploy.envs) {
        package.deploy.envs[ename].name = ename;
        environGenerator(package, package.deploy.envs[ename], output, urlPath + '/' + files.context.shortname + '/envs');
    }
    
    Generator.process(files, output + urlPath);
    for (let cname in package.classes) {
        modelGenerator(package.classes[cname].definition, output, urlPath + '/' + files.context.shortname + '/models/');
    }
    for (let spname in package.subpackages) {
        packageGenerator(package.subpackages[spname], output, urlPath + '/' + files.context.shortname);
    }
    for (let ucname in package.usecases) {
        useCaseGenerator(package.usecases[ucname], output, urlPath + '/' + files.context.shortname + '/usecases');
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
            pageDir: '.' + urlPath + '/' + usecase.name.replace(/ /g,'').toLowerCase()
        },
        targets: {
            ':usecaseNameNoSpace:/index.html': {template: '/templates/UseCase/index.ejs'},
            ':usecaseNameNoSpace:/Activities.puml': {template: '/templates/UseCase/Activities.puml'},
        }
    };
    // Get the doc from the package and add them to the targets list
    addDocs(usecase, files, output + urlPath,urlPath);
    Generator.process(files, output + urlPath);
    for (let i in usecase.scenarios) {
        scenarioGenerator(usecase, usecase.scenarios[i], output + urlPath, '/' + usecase.name.replace(/\s/g,''));
    }
};
const scenarioGenerator = (usecase, scenario, output, urlPath) => {
    let pkg = global.packages[usecase.package.replace(/\s/g,'')];
    for(let i in scenario.steps) {
        let step = scenario.steps[i];
        let act = Action.find(`/${step.action.toLowerCase()}`);
        step.act = act;
    }

    let files = {
        context: {
            usecase: usecase,
            scenario: scenario,
            package: pkg,
            shortname: scenario.name.replace(/ /g, ''),
            actors: scenario.actors
        },
        targets: {
            ':shortname:.puml': {template: '/templates/Scenario/Scenario.puml'},
        }
    };
    // Get the doc from the package and add them to the targets list
    let outputURL = output + urlPath;
    outputURL = outputURL.toLowerCase();
    Generator.process(files, outputURL);
};
const actorsGenerator = (actors, output) => {
    let apackages = {};
    for(let h in actors) {
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
            pageDir: output
        },
        targets: {
            '/index.html': {template: '/templates/Actor/all.ejs'},
            '/Actors.puml': {template: '/templates/Actor/All.puml'},
        }
    };
    Generator.process(files, output);
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
    const colors = [ "#black", "#blue", "#red", "#orange", "#darkgreen", "#darkgray" ];
    let i = 0;
    for(let nname in env.definition.networks) {
        let network = env.definition.networks[nname];
        network.color = colors[i++];
        network.name = nname;
        network.type = 'internal';
        network.id = nname.replace(/\s/g,'') + 'net';
        deploy.networks[nname] = network;
        if(network.hasOwnProperty("attachable") && network.attachable) {
            network.externalName = network.name.replace(/\$\{.*\}/, '');
            network.type = 'ingress';
            deploy.ingress[network.name] = network;
        }
        else if(network.hasOwnProperty("external") && network.external) {
            network.externalName = network.name.replace(/\$\{.*\}/, '');
            network.type = 'egress';
            deploy.egress[network.name] = network;
        }
    }
    deploy.services = env.definition.services;
    for(let sname in env.definition.services) {
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
            id: service.image.replace(/\:/,'') + 'image'
        }
        service.id = service.name.replace('/\s/g', '') + 'Service';
        if(service.image.includes('traefik')) {
            deploy.frontend.service = service;
            deploy.frontend.image = service.image;
            deploy.frontend.id = 'frontendService';
            deploy.frontend.maps = [];
        }
        // Now get the right network from the network list.
        let networks = {};
        for(let i in service.networks) {
            let network = "";
            let net = service.networks[i];
            if(typeof net === 'string') {
                if(deploy.networks.hasOwnProperty(net)) {
                    network = deploy.networks[net];
                    networks[net] = network;
                }
            }
            else {
                if(deploy.networks.hasOwnProperty(i)) {
                    network = deploy.networks[i];
                    networks[i] = network;
                }
            }
        }
        service.networks = networks;
        let label ="";
        let network="";
        let port="";
        let route = "";
        if(service.deploy) {
            for (let j in service.deploy.labels) {
                label = service.deploy.labels[j];
                if (label.includes('rule=')) {
                    route = label.replace(/^.*\(\`/, '').replace(/\`.*$/, '');
                } else if (label.includes('network=')) {
                    let networkname = label.replace(/^.*=/, '').replace(/\$\{.*\}/, '');
                    if (deploy.egress.hasOwnProperty(networkname)) {
                        network = deploy.egress[netowrkname];
                    } else if (deploy.ingress.hasOwnProperty(networkname)) {
                        network = deploy.egress[netowrkname];
                    } else if (deploy.networks.hasOwnProperty(networkname)) {
                        network = deploy.networks[networkname];
                    }
                    else {
                       for(let nname in deploy.egress) {
                           if(deploy.egress[nname].externalName === networkname) {
                               network = deploy.egress[nname];
                           }
                       }
                       for(let nname in deploy.ingress) {
                           if(deploy.ingress[nname].externalName === networkname) {
                               network = deploy.ingress[nname];
                           }
                       }
                    }
                } else if (label.includes('port=')) {
                    port = label.replace(/^.*=/, '');
                }
            }
            if(!network) {
                network = {
                    name:'Default',
                    color:'#blue'
                }
            }
            if(!deploy.frontend.hasOwnProperty('maps')) {
                deploy.frontend.maps = [];
            }
            service.path = route;
            if(!service.hasOwnProperty('ports')) {
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
    for(let iname in deploy.images) {
        let image = deploy.images[iname];
        let [name, version] = image.name.split(':');
        let stack = getStack(name);
        let newStack = null;
        if(stack) {
            let newStack = {
                deploy: stack.deploy,
                name: name,
                networks: {},
                id: name.replace(/ /g, '') + 'Stack',
                image: iname
            }
            deploy.stacks[name] = newStack;
            image.stack = newStack;
            if (stack.deploy) {
                for (let nname in deploy.networks) {
                    let network = deploy.networks[nname];
                    if (network.external) {
                        newStack.networks[nname] = {
                            externalName: network.name,
                            name: nname,
                            id: stack.id + nname
                        }
                        // network.name is the name of the network from the stack.
                        // Find the network to attach to in the top stack.
                        for (let snname in deploy.networks) {
                            let snetwork = deploy.networks[snname];
                            if (snetwork.externalName === network.name) {
                                newStack.networks[nname].externalNetwork = snetwork;
                            }
                        }
                    }
                }
            }
        }
    }
    // Remove the frontend service from the service list. It preventss it from being used twice
    if(deploy.frontend.id) {
        delete deploy.services[deploy.frontend.service.name];
    }

    let files = {
        context: {
            envName: env.name,
            environ: env,
            deploy: deploy,
            pkg: pkg,
            package: pkg,
            pageDir: urlPath
        },
        targets: {
            ':envName:/_index.ejs': {template: '/templates/Environment/_index.ejs'},
            ':envName:/deployment.puml': {template: '/templates/Environment/Deployment.puml'},
            ':envName:/physical.puml': {template: '/templates/Environment/Physical.puml'},
        }
    };
    // Get the doc from the package and add them to the targets list
    Generator.process(files, output + urlPath);
};
const actorGenerator = (actor, output) => {
    let apackages = {};

    for(let i in actor.usecases) {
        let usecase = actor.usecases[i];
        let uname = usecase.name.replace(/\s/g, '');
        let packageName = usecase.package.replace(/\s/g, '');
        if(!apackages.hasOwnProperty(packageName)) {
            apackages[packageName] =  {
                color: global.packages[packageName].color,
                shortname: global.packages[packageName].shortname,
                usecases: {},
                name: usecase.package
            };
        }
        apackages[packageName].usecases[uname]= usecase;
    }
    let files = {
        context: {
            actor: actor,
            basedir: output,
            actorNameNoSpace: actor.shortname,
            actorPackages: apackages,
            pageDir: './actors/' + actor.shortname
        },
        targets: {
            ':actorNameNoSpace:/index.html': {template: '/templates/Actor/index.ejs'},
            ':actorNameNoSpace:/UseCase.puml': {template: '/templates/Actor/UseCase.puml'},
        }
    };
    // Get the doc from the package and add them to the targets list
    if(actor.hasOwnProperty('doc')) {
        for (let i in actor.doc.files) {
            let file = actor.doc.files[i];
            let sourcefile = path.resolve(actor.doc.basedir + file);
            if(file.includes('.ejs')) {
                files.targets[`:actorNameNoSpace:/${file}`] = {template:`${sourcefile}`};
            }
            else {
                files.targets[`:actorNameNoSpace:/${file}`] = {copy:`${sourcefile}`};
            }
        }
    }
    Generator.process(files, output);
};

const addDocs = (obj, files, output, urlPath) => {
    let newFiles = {
        targets: {},
        context: {}
    }
    for(let name in files.context) {
        newFiles.context[name] = files.context[name];
    }
    newFiles.context.pageDir = '.' + urlPath + '/' + files.context.shortname;

    if(obj.hasOwnProperty('doc')) {
        for (let i in obj.doc.files) {
            let file = obj.doc.files[i];
            let sourcefile = path.resolve(obj.doc.basedir + file);
            if(file.includes('.ejs')) {
                newFiles.targets[`:shortname:/${file}`] = {template:`${sourcefile}`};
            }
            else {
                newFiles.targets[`:shortname:/${file}`] = {copy:`${sourcefile}`};
            }
        }
    }
   Generator.process(newFiles, output);
}

const getStack = (name) => {
    for(let pname in global.packages)  {
        let pkg = global.packages[pname];
        if(pkg.deploy.name === name) {
            return pkg;
        }
    }
    return null;
}
