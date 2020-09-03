let ejs = require('ejs');
let path = require('path');

module.exports = {
    model: (model, output) => {
        let apath = path.resolve('./src/Documentation/templates/Model/Logical.puml');
        ejs.renderFile(apath, {model: model.definition}, {}, (err,str) => {
            if(err) {
                console.error("Error processing model:", model.name, "with model.rst");
                console.error(err);
            }
            console.log(str);
        });
        apath = path.resolve('./src/Documentation/templates/Model/StateNet.puml');
        ejs.renderFile(apath, {model: model.definition}, {}, (err,str) => {
            if(err) {
                console.error("Error processing model:", model.name, "with model.rst");
                console.error(err);
            }
            console.log(str);
        });
    }
};
