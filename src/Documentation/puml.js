const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const proc = require('child_process').exec;
const plantuml = require('ailtire/src/node-plantuml');
const {PassThrough} = require('stream');
const streamBuffers = require('stream-buffers');
const Action = require("ailtire/src/Server/Action");
const APackage = require("ailtire/src/Server/APackage");

// const glob = require('glob');
// const plantuml = require('node-plantuml');
// plantuml.useNailgun();

module.exports = {
    model: async (model, diagram) => {
        const Action = require('../Server/Action');
        diagram = diagram || "Logical";
        let diagramFile = `./templates/Model/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {model: model.definition, Action: Action});
        let svg = await _getSVG(results);
        return svg;
    },
    package: async (package, diagram) => {
        diagram = diagram || "Logical";
        let diagramFile = `./templates/Package/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {package: package.definition});
        let svg = await _getSVG(results);
        return svg;
    },
    actor: async (actor, diagram) => {
        const APackage = require('../Server/APackage');
        diagram = diagram || "UseCase";
        let diagramFile = `./templates/Actor/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');

        let apackages = {};

        for (let i in actor.usecases) {
            let usecase = actor.usecases[i];
            let uname = usecase.name.replace(/\s/g, '');
            let package = APackage.getPackage(usecase.package);
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
        let results = ejs.render(tempString, {
            actor: actor,
            actorNameNoSpace: actor.shortname,
            actorPackages: apackages,
            pageDir: './actors/' + actor.shortname
        });
        let svg = await _getSVG(results);
        return svg;
    },
    usecase: async (usecase, diagram) => {
        diagram = diagram || "Activities";
        let diagramFile = `./templates/UseCase/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {usecase: usecase});
        let svg = await _getSVG(results);
        return svg;
    },
    scenario: async (usecase, scenario, diagram) => {
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

        diagram = diagram || "Scenario";
        let diagramFile = `./templates/Scenario/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {
            usecase: usecase,
                scenario : scenario,
                pkgs : pkgs,
                package : pkg,
                shortname : scenario.name.replace(/ /g, ''),
                actors : scenario.actors,
                Action : Action
        });
        let svg = await _getSVG(results);
        return svg;
    },
    workflow: async (workflow, diagram) => {
        diagram = diagram || "workflow";
        let diagramFile = `./templates/Workflow/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {workflow: workflow, workFlowName: workflow.name.replace(/\s/g,'')});
        let svg = await _getSVG(results);
        return svg;   
    }
};

async function _getSVG(puml) {
    return new Promise((resolve) => {
        let buffer = new streamBuffers.WritableStreamBuffer();

        let gen = plantuml.generate({format: 'svg'});
        gen.out.pipe(buffer);
        gen.in.end(puml);

        gen.out.on('end', () => {
            let svgString = buffer.getContentsAsString('utf8');
            resolve(svgString);
        });
    });
}
