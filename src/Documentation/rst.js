let ejs = require('ejs');
let path = require('path');
let Generator = require('./Generator.js');

module.exports = {
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
    }
};
const modelGenerator = (model, output) => {
    console.log("Model:", model);
    let files = {
        context: {
            model: model,
            modelname: model.name,
            modelnamenospace: model.name.replace(/ /g, ''),
        },
        targets: {
            './Model-:modelnamenospace:.rst': {template: '/templates/Model/index.rst'},
            './Model-:modelnamenospace:.puml': {template: '/templates/Model/Logical.puml'},
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
            let anameNoSpace = aname.replace(/ /g, '');
            if(!global.actors.hasOwnProperty(anameNoSpace)) {
                global.actors[anameNoSpace] = { usecases: {}, name:aname};
            }
            if(!actors.hasOwnProperty(anameNoSpace)) {
                actors[anameNoSpace] = { usecases: {}, name:aname};
            }
            actors[anameNoSpace].usecases[ucnameNoSpace] = usecase;
            global.actors[anameNoSpace].usecases[ucnameNoSpace] = usecase;
        }
    }
    let files = {
        context: {
            package: package,
            actors: actors,
            packageName: package.name,
            shortName: package.shortName,
            packageNameNoSpace: package.name.replace(/ /g, ''),
        },
        targets: {
            ':packageNameNoSpace:/index.rst': {template: '/templates/Package/index.rst'},
            ':packageNameNoSpace:/Logical.puml': {template: '/templates/Package/Logical.puml'},
            ':packageNameNoSpace:/UseCases.puml': {template: '/templates/Package/UseCases.puml'},
            ':packageNameNoSpace:/UserInteraction.puml': {template: '/templates/Package/UserInteraction.puml'},
            ':packageNameNoSpace:/Logical.puml': {template: '/templates/Package/Logical.puml'},
            ':packageNameNoSpace:/Deployment.puml': {template: '/templates/Package/Deployment.puml'},
            ':packageNameNoSpace:/Physical.puml': {template: '/templates/Package/Physical.puml'},
            ':packageNameNoSpace:/Process.puml': {template: '/templates/Package/Process.puml'}
        }
    };
    Generator.process(files, output);
    for (let cname in package.classes) {
        modelGenerator(package.classes[cname].definition, output + '/' + files.context.packageNameNoSpace + '/models/');
    }
    for (let spname in package.subpackages) {
        packageGenerator(package.subpackages[spname], output + '/' + files.context.packageNameNoSpace + '/');
    }
    for (let ucname in package.usecases) {
        useCaseGenerator(package.usecases[ucname], output + '/' + files.context.packageNameNoSpace + '/usecases');
    }
};
const useCaseGenerator = (usecase, output) => {
    let files = {
        context: {
            usecase: usecase,
            usecaseName: usecase.name,
            usecaseNameNoSpace: usecase.name.replace(/ /g, ''),
        },
        targets: {
            ':usecaseNameNoSpace:/index.rst': {template: '/templates/UseCase/index.rst'},
            ':usecaseNameNoSpace:/Activities.puml': {template: '/templates/UseCase/Activities.puml'},
        }
    };
    Generator.process(files, output);
};
const actorGenerator = (actor, output) => {
    let apackages = {};

    for(let i in actor.usecases) {
        let usecase = actor.usecases[i];
        let uname = usecase.name.replace(/ /g, '');
        let packageName = usecase.package.replace(/ /g, '');
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
            actorNameNoSpace: actor.name.replace(/ /g, ''),
            actorPackages: apackages
        },
        targets: {
            ':actorNameNoSpace:/index.rst': {template: '/templates/Actor/index.rst'},
            ':actorNameNoSpace:/UseCase.puml': {template: '/templates/Actor/UseCase.puml'},
        }
    };
    Generator.process(files, output);
};
