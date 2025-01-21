const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
module.exports = {
    friendlyName: 'package',
    description: 'Generate plantuml diagram for the package',
    static: true,
    inputs: {
        package: {
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
        let package = inputs.package;
        if(!package) return "Package not found";
        let diagram = inputs.diagram;
        diagram = diagram || "Logical";
        let diagramFile = `../../../templates/Package/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let results = ejs.render(tempString, {package: package});
        let svg = await PGenerator.getSVG({puml: results});
        return svg;
    }
};