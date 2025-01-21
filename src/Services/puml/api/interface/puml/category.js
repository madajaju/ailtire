const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
module.exports = {
    friendlyName: 'category',
    description: 'Generate plantuml diagram for the category',
    static: true,
    inputs: {
        category: {
            type: 'string',
            description: 'Category object',
            required: true
        },
        heritage: {
            type: 'string',
            description: 'Heritage of the category, parent and grandparent',
            required: false,
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
        let category = inputs.category;
        if(!category) return "Category not found";
        let diagram = inputs.diagram;
        diagram = diagram || "category";
        let heritage = inputs.heritage;
        
        let diagramFile = `../../../templates/Category/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        if(!category.name) { category.name = category.prefix.split('/').pop(); }
        let config = {category: category, categoryName: category.name.replace(/\s/g,''), parent: heritage.parent, grandparent: heritage.grandparent};
        let results = ejs.render(tempString, config);
        let svg = await PGenerator.getSVG({puml:results});
        return svg;
    }
};