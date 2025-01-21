const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
module.exports = {
    friendlyName: 'scenario',
    description: 'Generate plantuml diagram for the scenario',
    static: true,
    inputs: {
        usecase: {
            type: 'json',
            description: 'Usecase name of the scenario',
            required: true
        },
        scenario: {
            type: 'json',
            description: 'Scenario name',
            required: true
        },
        pkgs: {
            type: 'json',
            description: 'List of packages used in the scenario separated',
            required: true
        },
        pkg: {
            type: 'json',
            description: 'Owning Package name',
        },
        diagram: {
            type: 'string',
            description: 'Diagram type',
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
        let scenario = inputs.scenario;
        if(!scenario) return "Scenario not found";
        let diagram = inputs.diagram;
        let pkgs = inputs.pkgs;
        let pkg = inputs.pkg;
        let usecase = inputs.usecase;
        
        diagram = diagram || "Scenario";
        let diagramFile = `../../../templates/Scenario/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {
            usecase: usecase,
            scenario : scenario,
            pkgs : pkgs,
            package : pkg,
            shortname : scenario.name.replace(/ /g, ''),
            actors : scenario.actors,
        });
        let svg = await PGenerator.getSVG({puml:results});
        return svg;
    }
};