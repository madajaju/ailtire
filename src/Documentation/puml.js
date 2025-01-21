const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const AService = require('../Server/AService.js');
const APackage = require("ailtire/src/Server/APackage");

module.exports = {
    model: async (model, diagram) => {
         const modelJSON = model.toJSON();
        let results = await AService.call('puml/model', {model: modelJSON, diagram: diagram});
        return results;
    },
    package: async (package, diagram) => {
        let packageJSON = package.toJSON();
        let results = await AService.call('puml/package', {package: packageJSON, diagram: diagram});
        return results;
    },
    actor: async (actor, diagram) => {
        let apackages = {};

        for (let i in actor.usecases) {
            let usecase = actor.usecases[i];
            let uname = usecase.name.replace(/\s/g, '');
            let package = APackage.getPackage(usecase.package);
            let packageName = usecase.package;
            if (!apackages.hasOwnProperty(packageName)) {
                apackages[packageName] = {
                    color: package.color,
                    shortname: package.shortname,
                    usecases: {},
                    workflows: {},
                    name: package.name
                };
            }
            apackages[packageName].usecases[uname] = usecase;
        }
        for(let i in actor.workflows) {
            let workflow = actor.workflows[i];
            let wname = workflow.name.replace(/\s/g,'');
            let package = APackage.getPackage(workflow.pkg);
            let packageName = package.name.replace(/\s/g, '');
            if (!apackages.hasOwnProperty(packageName)) {
                apackages[packageName] = {
                    color: package.color,
                    shortname: package.shortname,
                    usecases: {},
                    workflows: {},
                    name: package.name
                };
            }
            apackages[packageName].workflows[wname] = workflow;
        }
        let results = await AService.call('puml/actor', {actor: actor, actorPackages: apackages, diagram: diagram});
        return results;
    },
    usecase: async (usecase, diagram) => {
        let results = await AService.call('puml/usecase', {usecase: usecase, diagram: diagram});
        return results;
    },
    scenario: async (usecase, scenario, diagram) => {
        const Action = require('../Server/Action');
        let pkg = global.packages[usecase.package.replace(/\s/g, '')];
        let pkgs = {};
        for (let i in scenario.steps) {
            let step = scenario.steps[i];
            step.action = step.action.replace(/\s/g, '/');
            let act = Action.find(`/${step.action.toLowerCase()}`);
            if (act) {
                step.act = act;
                let pkgName = act.pkg;
                if(typeof pkgName !== 'string') {
                    pkgName = act.pkg.shortname;
                }
                let pkg = APackage.getPackage(pkgName);
                if (!pkgs.hasOwnProperty(pkgName)) {
                    let pkgJSON = {
                        name: pkg.name,
                        color: pkg.color,
                        shortname: pkg.shortname,
                        description: pkg.description,
                    };
                    pkgs[pkgName] = {
                        pkg: pkgJSON,
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
        let pkgJSON = pkg.toJSON();
        let results = await AService.call('puml/scenario', {usecase:usecase, scenario: scenario, pkg:pkgJSON, pkgs:pkgs, diagram: diagram});
        return results;
    },
    workflow: async (workflow, diagram) => {
        let results = await AService.call('puml/workflow', {workflow: workflow, diagram: diagram});
        return results;
    },
    category: async (category, diagram) => {
        if(!category.name) { category.name = category.prefix.split('/').pop(); }
        let heritage = _getCategoryHeritage(category);
        
        let results = await AService.call('puml/category', {category: category, heritage: heritage, diagram: diagram});
        return results;
    }
};

function _getCategoryHeritage(category) {
    let parent = "Workflows";
    let grandparent = null;
    let heritage = category.prefix.split('/');
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
};