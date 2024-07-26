const path = require('path');
const fs = require("fs");
const ACategory = require("../../src/Server/ACategory");
module.exports = {
    friendlyName: 'get',
    description: 'Get a Category',
    static: true,
    inputs: {
        id: {
            description: 'The id of the category',
            type: 'string',
            required: true
        },
    },

    exits: {
    },

    fn: function (inputs, env) {
        // Find the scenario from the usecase.

       // api.scenario(inputs.package, inputs.usecase, inputs.name, '.');
        let category = ACategory.get(inputs.id);
        if(category) {
            // If the workflow does not have inputs then grab the inputs from the Init Activity
            tempObj = {};
            for(let key in category) {
                tempObj[key] = category[key];
            }
            if(inputs.doc) {
                let dfile = category.baseDir + '/doc/doc.emd';
                if (fs.existsSync(dfile)) {
                    tempObj.document = fs.readFileSync(dfile, 'utf8');
                } else {
                    tempObj.document = "Enter documentation here.";
                }
            }
            env.res.json(tempObj);
            return;
        }
        return env.res.json({status:'error', data: 'Category not found!'});
    }
};

