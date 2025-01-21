const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
module.exports = {
    friendlyName: 'workflow',
    description: 'Generate plantuml diagram for the workflow',
    static: true,
    inputs: {
        workflow: {
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
        let workflow = inputs.workflow;
        if(!workflow) return "Workflow not found";
        let diagram = inputs.diagram;
        diagram = diagram || "workflow";
        let diagramFile = `../../../templates/Workflow/${diagram}.puml`;
        let apath = path.resolve(__dirname, diagramFile);
        let tempString = fs.readFileSync(apath, 'utf-8');
        let heritage = _getWorkflowHeritage(workflow);
        let config= {workflow: workflow, workFlowName: workflow.name.replace(/\s/g,'')};
        config.parent = heritage.parent;
        config.grandparent = heritage.grandparent;
        let results = ejs.render(tempString, config);
        let svg = await PGenerator.getSVG({puml:results});
        return svg;
    }
};

function _getWorkflowHeritage(workflow) {
    let parent = "Workflows";
    let grandparent = null;
    let heritage = workflow.category.split('/');
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
}