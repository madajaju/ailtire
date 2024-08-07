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
                if (action === 'folder') {
                    target = {name: name, action: action};
                } else {
                    target = {name: files.targets[name][action], action: action};
                }
            }
            for (let fname in files.context) {
                if (nname.includes(`:${fname}:`)) {
                    nname = nname.replace(':' + fname + ':', files.context[fname]);
                }
                if (target.name.includes(`:${fname}:`)) {
                    target.name = target.name.replace(':' + fname + ':', files.context[fname]);
                }
            }
            targets[nname] = target;
        }
        for (let file in targets) {
            let bfile = baseDir + '/' + file;
            // Cannot make everything lowercase it does not look good.
            // bfile = bfile.toLowerCase();
            _processItem(targets[file], bfile, files.context);
        }
    },
    processAsync: async (files, baseDir) => {
        let targets = {};
        for (let name in files.targets) {
            let nname = name;
            let target = '';
            for (let action in files.targets[name]) {
                if (action === 'folder') {
                    target = {name: name, action: action};
                } else {
                    target = {name: files.targets[name][action], action: action};
                }
            }
            for (let fname in files.context) {
                if (nname.includes(`:${fname}:`)) {
                    nname = nname.replace(':' + fname + ':', files.context[fname]);
                }
                if (target.name.includes(`:${fname}:`)) {
                    target.name = target.name.replace(':' + fname + ':', files.context[fname]);
                }
            }
            targets[nname] = target;
        }
        for (let file in targets) {
            let bfile = baseDir + '/' + file;
            // Cannot make everything lowercase it does not look good.
            // bfile = bfile.toLowerCase();
            await _processItemAsync(targets[file], bfile, files.context);
        }
    }
};

const _processItem = (item, target, objects) => {
    let relfile = __dirname + '/' + item.name;
    let apath = path.resolve(relfile);
    if (!fs.existsSync(apath)) {
        // Try the absolute Path
        relfile = item.name;
        apath = path.resolve(relfile);
    }
    if (item.action === 'template') {
        objects.partial = partialProcess;
        try {
            ejs.renderFile(apath, objects, {}, (err, str) => {
                if (err) {
                    console.error("Error processing model:", objects, "with", item, "targeted to", target);
                    console.error(err);
                    console.error('=====');
                    console.error(str);
                }
                // Create the directory and then store the file.
                let apath = path.resolve(target);
                let dirname = path.dirname(apath);
                fs.mkdirSync(dirname, {recursive: true});
                if (str) {
                    fs.writeFileSync(apath, str);
                }
            });
        } catch (e) {
            console.error("RenderFile:", e);
        }
    } else if (item.action === 'copyFolder') {
        let dirname = path.resolve(target);
        fs.mkdirSync(dirname, {recursive: true});
        _copyDirectory(dirname, apath);
    } else if (item.action === 'folder') {
        let dirname = path.resolve(target);
        fs.mkdirSync(dirname, {recursive: true});
    } else if (item.action === 'copy') {
        let str = fs.readFileSync(apath);
        let dest = path.resolve(target);
        let dirname = path.dirname(dest);
        fs.mkdirSync(dirname, {recursive: true});
        fs.writeFileSync(dest, str);
    }
};

const _copyDirectory = (dest, src) => {
    fs.mkdirSync(dest, { recursive: true });

    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            _copyDirectory(destPath, srcPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const _processItemAsync = async (item, target, objects) => {
    let relfile = __dirname + '/' + item.name;
    let apath = path.resolve(relfile);
    if (!fs.existsSync(apath)) {
        // Try the absolute Path
        relfile = item.name;
        apath = path.resolve(relfile);
    }
    if (item.action === 'template') {
        objects.partial = partialProcess;
        try {
            let str = await ejs.renderFile(apath, objects, {async: true});
            // Create the directory and then store the file.
            let a2path = path.resolve(target);
            let dirname = path.dirname(a2path);
            fs.mkdirSync(dirname, {recursive: true});
            if (str) {
                fs.writeFileSync(a2path, str);
            }
        } catch (e) {
            console.error("RenderFile:", e);
        }
    } else if (item.action === 'folder') {
        let dirname = path.resolve(target);
        fs.mkdirSync(dirname, {recursive: true});
    } else if (item.action === 'copy') {
        let str = fs.readFileSync(apath);
        let dest = path.resolve(target);
        let dirname = path.dirname(dest);
        fs.mkdirSync(dirname, {recursive: true});
        fs.writeFileSync(dest, str);
    }
};
const partialProcess = (file, objects) => {
    let baseDirs = [
        __dirname + '/' + file,
        __dirname + '/docs/' + file,
        process.cwd() + '/' + file,
        process.cwd() + '/docs/' + file
    ]
    let apath = path.resolve(file);
    let i = 0;
    while (!fs.existsSync(apath) && i < baseDirs.length) {
        apath = path.resolve(baseDirs[i++]);
    }
    if (!fs.existsSync(apath)) {
        console.error("Could not find", file);
        return "";
    }
    objects.partial = partialProcess;
    try {
        let str = fs.readFileSync(apath, 'utf8');
        let retval = ejs.render(str, objects);
        return retval;
    } catch (e) {
        console.error("Partial Parsing Error:", e);
        console.error("Partial Parsing:", file, "with", objects);
    }
};
