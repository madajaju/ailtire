let ejs = require('ejs');
let path = require('path');
let Generator = require('./Generator.js');

module.exports = {
    index: (name, output) => {
        indexGenerator(name, output);
    },
    model: (model, output) => {
        modelGenerator(model, output);
    },
    package: (package, output) => {
        packageGenerator(package, output);
    },
    actors: (actors, output) => {
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
            path: output
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
            'assets/js/d3.js': {copy: '/templates/App/js/d3.js'},
            'assets/js/Graph.js': {copy: '/templates/App/js/Graph.js'},
            'assets/js/less.js': {copy: '/templates/App/js/less.js'},
            'assets/js/socket.io.js': {copy: '/templates/App/js/socket.io.js'},
            'assets/styles/color.less': {copy: '/templates/App/styles/color.less'},
            'assets/styles/graph.less': {copy: '/templates/App/styles/graph.less'},
            'assets/styles/importer.less': {copy: '/templates/App/styles/importer.less'},
            'assets/styles/top.less': {copy: '/templates/App/styles/top.less'},
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
            './app.html': {template: '/templates/App/app.ejs'},
            'assets/js/less.js': {copy: '/templates/App/js/less.js'},
            'assets/styles/importer.less': {copy: '/templates/App/styles/docimporter.less'},
            'assets/styles/doc.less': {copy: '/templates/App/styles/doc.less'},
        }
    };
    Generator.process(files, output);
};
const modelGenerator = (model, output) => {
    let files = {
        context: {
            model: model,
            modelname: model.name,
            modelnamenospace: model.name.replace(/ /g, ''),
        },
        targets: {
            './:modelnamenospace:/index.html': {template: '/templates/Model/index.ejs'},
            './:modelnamenospace:/Logical.puml': {template: '/templates/Model/Logical.puml'},
            './:modelnamenospace:/StateNet.puml': {template: '/templates/Model/StateNet.puml'},
        }
    };
    Generator.process(files, output);
};
const packageGenerator = (package, output) => {
    let actors = {};
    for(let ucname in package.usecases) {
        let usecase = package.usecases[ucname];
        let ucnameNoSpace = ucname.replace(/ /g, '');
        for(let aname in usecase.actors) {
            /* if(!global.actors.hasOwnProperty(anameNoSpace)) {
                global.actors[anameNoSpace] = { usecases: {}, name:aname};
            }
            */
            if(!actors.hasOwnProperty(aname)) {
                actors[aname] = { usecases: {}, name:aname, shortname: global.actors[aname].shortname };
            }
            actors[aname].usecases[ucnameNoSpace] = usecase;
        }
    }
    let deploy = {
        ports: {},
        networks: {},
        services: {},
        images: {},
        ingress: {},
        egress: {}
    };
    for(let ename in package.deploy.envs) {
        let env = package.deploy.envs[ename];
        deploy.networks = env.definition.networks;
        deploy.services = env.definition.services;
        for(let sname in env.definition.services) {
           let service = env.definition.services[sname];
           for(let i in service.ports) {
                let maps = service.ports[i].replace(/"/g,'').split(':');
                deploy.ports[maps[0]] = {
                    port: maps[1],
                    service: sname,
                }
           }
           deploy.images[service.image] = service.image;
        }
        for(let nname in deploy.networks) {
            let network = deploy.networks[nname];
            if(network.hasOwnProperty("attachable")) {
                network.name = network.name.replace(/\$\{.*\}/, '');
                deploy.ingress[network.name] = {name: nname};
            }
            if(network.hasOwnProperty("external")) {
                network.name = network.name.replace(/\$\{.*\}/, '');
                deploy.egress[network.name] = {name: nname};
            }
        }
    }
    let files = {
        context: {
            deploy: deploy,
            basedir: output + '/' + package.shortname,
            package: package,
            actors: actors,
            packageName: package.name,
            shortname: package.shortname,
            packageNameNoSpace: package.name.replace(/ /g, ''),
        },
        targets: {
            ':shortname:/index.html': {template: '/templates/Package/index.ejs'},
            ':shortname:/Logical.puml': {template: '/templates/Package/Logical.puml'},
            ':shortname:/UseCases.puml': {template: '/templates/Package/UseCases.puml'},
            ':shortname:/UserInteraction.puml': {template: '/templates/Package/UserInteraction.puml'},
            ':shortname:/Logical.puml': {template: '/templates/Package/Logical.puml'},
            ':shortname:/Deployment.puml': {template: '/templates/Package/Deployment.puml'},
            ':shortname:/Physical.puml': {template: '/templates/Package/Physical.puml'},
            ':shortname:/Process.puml': {template: '/templates/Package/Process.puml'}
        }
    };
    // Get the doc from the package and add them to the targets list
    if(package.hasOwnProperty('doc')) {
        for (let i in package.doc.files) {
            let file = package.doc.files[i];
            let sourcefile = path.resolve(package.doc.basedir + file);
            if(file.includes('.ejs')) {
                files.targets[`:shortname:/${file}`] = {template:`${sourcefile}`};
            }
            else {
                files.targets[`:shortname:/${file}`] = {copy:`${sourcefile}`};
            }
        }
    }
    Generator.process(files, output);
    for (let cname in package.classes) {
        modelGenerator(package.classes[cname].definition, output + '/' + files.context.shortname + '/models/');
    }
    for (let spname in package.subpackages) {
        packageGenerator(package.subpackages[spname], output + '/' + files.context.shortname);
    }
    for (let ucname in package.usecases) {
        useCaseGenerator(package.usecases[ucname], output + '/' + files.context.shortname + '/usecases');
    }
};
const useCaseGenerator = (usecase, output) => {
    let files = {
        context: {
            usecase: usecase,
            usecaseName: usecase.name,
            usecaseNameNoSpace: usecase.name.replace(/ /g, ''),
            actors: global.actors
        },
        targets: {
            ':usecaseNameNoSpace:/index.html': {template: '/templates/UseCase/index.ejs'},
            ':usecaseNameNoSpace:/Activities.puml': {template: '/templates/UseCase/Activities.puml'},
        }
    };
    Generator.process(files, output);
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
            actorNameNoSpace: actor.shortname,
            actorPackages: apackages
        },
        targets: {
            ':actorNameNoSpace:/index.html': {template: '/templates/Actor/index.ejs'},
            ':actorNameNoSpace:/UseCase.puml': {template: '/templates/Actor/UseCase.puml'},
        }
    };
    Generator.process(files, output);
};
