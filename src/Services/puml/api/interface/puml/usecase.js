const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
module.exports = {
    friendlyName: 'usecase',
    description: 'Generate plantuml diagram for the usecase',
    static: true,
    inputs: {
        usecase: {
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
        let usecase = inputs.usecase;
        if(!usecase) return "Usecase not found";
        let diagram = inputs.diagram;
        diagram = diagram || "Activities";
        let diagramFile = `../../../templates/UseCase/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {usecase: usecase});
        let svg = await PGenerator.getSVG({puml:results});
        return svg;
    }
};