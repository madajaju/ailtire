const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const APackage = require('ailtire/src/Server/APackage');

module.exports = {
    friendlyName: 'model',
    description: 'Generate plantuml diagram for the model',
    static: true,
    inputs: {
        actor: {
            type: 'string',
            required: true
        },
        actorPackages: {
            type: 'string',
            required: false
        },
        diagram: {
            type: 'string',
            required: true
        }
    },

    exits: {
        json: (obj) => {
            return obj;
        },
        success: (obj) => {
            return obj;
        },
        notFound: (obj) => {
            console.error("Object not Found:", obj);
            return null;
        },
    },


    fn: async function (inputs, env) {
        let actor = inputs.actor;
        if(!actor) return "Actor not found";
        let diagram = inputs.diagram;
        let apackages = inputs.actorPackages || {};
        diagram = diagram || "UseCase";
        let diagramFile = `../../../templates/Actor/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');


        let results = ejs.render(tempString, {
            actor: actor,
            actorNameNoSpace: actor.shortname,
            actorPackages: apackages,
        });
        let svg = await PGenerator.getSVG({puml: results});
        return svg;
    }
};