let ejs = require('ejs');
let path = require('path');
let Generator = require('./Generator.js');
const AClass = require('../Server/AClass');

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
    addDocs(app, files, output);
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
            '../assets/js/less.js': {copy: '/templates/App/js/less.js'},
            '../assets/styles/importer.less': {copy: '/templates/App/styles/docimporter.less'},
            '../assets/styles/doc.less': {copy: '/templates/App/styles/doc.less'},
        }
    };
    Generator.process(files, output);
};
const modelGenerator = (model, output, urlpath) => {
    let files = {
        context: {
            model: model,
            shortname: model.name.replace(/ /g, ''),
            modelname: model.name,
            modelnamenospace: model.name.replace(/ /g, '').toLowerCase(),
            pageDir: '.' + urlpath + '/' + model.name.replace(/ /g,'').toLowerCase()
        },
        targets: {
            './:modelnamenospace:/index.html': {template: '/templates/Model/index.ejs'},
            './:modelnamenospace:/Logical.puml': {template: '/templates/Model/Logical.puml'},
            './:modelnamenospace:/StateNet.puml': {template: '/templates/Model/StateNet.puml'},
        }
    };
    Generator.process(files, output + urlPath);
    addDocs(model, files, output + urlPath);
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
            ':shortname:/Deployment.puml': {template: '/templates/Package/Deployment.puml'},
            ':shortname:/Physical.puml': {template: '/templates/Package/Physical.puml'},
            ':shortname:/ScenarioMapping.puml': {template: '/templates/Package/ScenarioMapping.puml'}
        }
    };
    // Get the doc from the package and add them to the targets list
    Generator.process(files, output + urlPath);
    addDocs(package, files,output + urlPath);
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
            usecase: usecase,
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
    Generator.process(files, output + urlPath);
    for (let i in usecase.scenarios) {
        scenarioGenerator(usecase, usecase.scenarios[i], output, '/' + usecase.name.replace(/\s/g,''));
    }
    addDocs(usecase, files, output + urlPath);
};
const scenarioGenerator = (usecase, scenario, output, urlPath) => {
    let pkg = global.packages[usecase.package.replace(/\s/g,'')];
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
    Generator.process(files, output + urlPath);
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

const addDocs = (obj, files, output) => {
    files.targets = {};

    if(obj.hasOwnProperty('doc')) {
        for (let i in obj.doc.files) {
            let file = obj.doc.files[i];
            let sourcefile = path.resolve(obj.doc.basedir + file);
            if(file.includes('.ejs')) {
                files.targets[`:shortname:/${file}`] = {template:`${sourcefile}`};
            }
            else {
                files.targets[`:shortname:/${file}`] = {copy:`${sourcefile}`};
            }
        }
    }
   Generator.process(files, output);
}
