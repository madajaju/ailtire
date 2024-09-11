import path from 'path';
import fs from 'fs';


const isDirectory = source => fs.existsSync(source) && fs.lstatSync(source).isDirectory();
const isFile = source => fs.existsSync(source) && !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

export default class ADocumentation {

    constructor(params) {
        return this;
    }
    static load(item, dir) {
        if (fs.existsSync(dir)) {
            let files = getFiles(dir);
            let nfiles = [];
            let ndir = dir;
            ndir = ndir.replace(/[\/\\]/g, '/');
            for (let i in files) {
                let file = files[i];
                let nfile = file.replace(/[\/\\]/g, '/');
                nfiles.push(nfile.replace(ndir, ''));
            }
            item.doc = {basedir: dir, files: nfiles};
        } else {
            fs.mkdirSync(dir);
            item.doc = {basedir: dir, files: []};
        }
    }
}
