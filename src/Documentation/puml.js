const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const proc = require('child_process').exec;
// const glob = require('glob');
// const plantuml = require('node-plantuml');
// plantuml.useNailgun();

module.exports = {
    renderSVG: (basedir) => {
        try {
            proc('bash -c "java -jar plantuml.jar -tsvg \"**\/*.puml\""', {cwd: basedir}, (err, stdout, stderr) => {
                console.log("Conversion is complete:");
                console.error(err);
                console.log(stdout);
                console.error(stderr);
            });
        }
        catch(e) {
            console.log("PUML generation:", e);
        }

 /*       glob( `${basedir}/!**!/!*.puml`, function( err, files ) {
            for(let i in files) {
                let file = files[i];
                let svgFile = file + '.png';
                console.log("PUML Generate:", file);
                try {

                    let gen = plantuml.generate(file, {format: 'svg'});
                    gen.out.pipe(fs.createWriteStream(svgFile));
                }
                catch(e) {
                    console.error("plantuml failed:", file);
                    console.error(e);
                }
            }
        });*/
    },
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

