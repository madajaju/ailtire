let ejs = require('ejs');
let path = require('path');

module.exports = {
    model: (model, output) => {
        let apath = path.resolve('./src/Documentation/templates/model.puml');
        ejs.renderFile(apath, {model: model.definition}, {}, (err,str) => {
            if(err) {
                console.error("Error processing model:", model.name, "with model.rst");
                console.error(err);
            }
            console.log(str);
        });
    }
};
