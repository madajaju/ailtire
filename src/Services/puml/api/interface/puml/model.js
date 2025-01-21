const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const Action = require('ailtire/src/Server/Action');

module.exports = {
    friendlyName: 'model',
    description: 'Generate plantuml diagram for the model',
    static: true,
    inputs: {
        model: {
            type: 'string',
            required: true
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
        let model = inputs.model;
        if(!model) return "Model not found";
        let diagram = inputs.diagram;
        diagram = diagram || "Logical";
        let diagramFile = `../../../templates/Model/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {model: model});
        let svg = await PGenerator.getSVG({puml: results});
        return svg;
    }
};