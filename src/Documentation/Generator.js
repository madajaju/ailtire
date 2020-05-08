const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const CWD = process.cwd();

module.exports = {
    process: (files, baseDir) => {
        let targets = {};
        for (let name in files.targets) {
            let nname = name;
            let target = '';
            for (let action in files.targets[name]) {
                if(action === 'folder') {
                    target = {name: name, action: action};
                }
                else {
                    target = {name: files.targets[name][action], action:action};
                }
            }
            for (let fname in files.context) {
                nname = nname.replace(':' + fname + ':', files.context[fname]);
                target.name = target.name.replace(':' + fname + ':', files.context[fname]);
            }
            targets[nname] = target;
        }
        for (let file in targets) {
            let bfile = baseDir + '/' + file;
            processItem(targets[file], bfile, files.context);
        }
    }
};

const processItem = (item, target, objects) => {

    if(item.action === 'template') {
        let relfile = __dirname + '/' + item.name;
        let apath = path.resolve(relfile);
        objects.partial = partialProcess;
        ejs.renderFile(apath, objects, {}, (err, str) => {
            if (err) {
                console.error("Error processing model:", objects, "with", item, "targeted to",target);
                console.error(err);
                console.error('=====');
                console.error(str);
            }
            // Create the directory and then store the file.
            let apath = path.resolve(target);
            let dirname = path.dirname(apath);
            fs.mkdirSync(dirname, {recursive: true});
            fs.writeFileSync(apath, str);
        });
    }
    else if (item.action === 'folder') {
        let dirname = path.resolve(target);
        fs.mkdirSync(dirname, {recursive: true});
    }
    else if(item.action === 'copy') {
        let relfile = __dirname + '/' + item.name;
        let apath = path.resolve(relfile);
        let str = fs.readFileSync(apath);
        let dest = path.resolve(target);
        let dirname = path.dirname(dest);
        fs.mkdirSync(dirname, {recursive: true});
        fs.writeFileSync(dest, str);
    }
};
const partialProcess = (file, objects) => {
    let apath = path.resolve(file);
    if(!fs.existsSync(apath)) {
       apath = path.resolve(__dirname + '/' + file);
       if(!fs.existsSync(apath)) {
           // console.error("Could not find", file);
          return "";
       }
    }
    try {
        let str = fs.readFileSync(apath, 'utf8');
        let retval = ejs.render(str, objects);
        return retval;
    } catch (e) {
        console.error("Partial Parsing Error:", e);
        console.error("Partial Parsing:", file, "with", objects);
    }
};
