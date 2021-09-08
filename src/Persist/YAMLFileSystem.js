const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const AClass = require('../Server/AClass');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);
let currentSave;
let rootDir;

module.exports = {
    load: () => {
        rootDir = path.resolve(global.ailtire.config.persist.basedir);
        return _load(".");
    },
    save: (objs) => {
        rootDir = path.resolve(global.ailtire.config.persist.basedir);
        currentSave = Date.now();
        fs.mkdirSync(rootDir, {recursive: true});
        return _persist(objs, '.', false);
    }
}

function _load(dir) {
    let dirname = path.resolve(rootDir + '/' + dir);
    let dirs = getDirectories(dirname);
    for(let i in dirs) {
        let myDir = dirs[i];
        let files = getFiles(myDir);
        let objType = path.basename(myDir);
        for(let j in files) {
            let myFile = files[j];
            let obj = _loadObject(myDir, objType ,myFile);
        }
    }
}

function _loadObject(dir, objectType, file) {
    let myFile = fs.readFileSync(file, {encoding: 'utf-8'});
    // Only loads
    let tobj = YAML.parse(myFile);
    let myClass = AClass.getClass(objectType);
    let mobj = new myClass(tobj);
    _loadObjectDirectory(mobj, dir);
    return mobj;
}

function _loadObjectDirectory(obj, dirname) {
    let myDir = dirname + '/' + obj.id;
    try {
        if (isDirectory(myDir)) {
            // These are the associations
            let dirs = getDirectories(myDir);
            for (let i in dirs) {
                let dir = dirs[i];
                let aname = path.basename(dir);
                if (obj.definition.associations.hasOwnProperty(aname)) {
                    let assoc = obj.definition.associations[aname];
                    let atype = assoc.type;
                    let files = getFiles(dir);
                    for (let j in files) {
                        let file = files[j];
                        let aobj = _loadObject(dir, atype, file);
                        obj.add(aname, aobj);
                    }
                }
            }
        }
    }
    catch(e) {
        console.error(myDir, " Not Found");
    }
}

function _persist(objs, basedir, testTop) {
    let retval = [];

    for (let i in objs) {
        let obj = objs[i];
        let objdir = basedir;
        // If the _persist is being called from a non-owning associations check if it not a top class.
        if (obj.definition.owners.length === 0) {
            objdir = './' + obj.definition.name;
        }
        if (obj.definition.owners.length > 0 && testTop) {
        } else {
            let sobj = _saveObj(obj, objdir, testTop);
            _writeToFile(sobj, obj, objdir);
            retval.push(sobj);
        }
    }
    return retval;
}

function _saveObj(obj, basedir, testTop) {
    let sobj = {};
    // Prevent death spiral on saving objects over and over.
    if (obj._attributes._persist && obj._attributes._persist.lastSaved === currentSave) {
        return sobj;
    }
    let objdir = `${basedir}/${obj.id}`;
    // Stored the _presist information.
    obj._attributes._persist = { lastSaved: currentSave, directory: `${rootDir}/${objdir}` };
    if (obj._attributes) {
        for (let aname in obj._attributes) {
            sobj[aname] = obj._attributes[aname];
        }
    }
    if (obj._associations) {
        for (let aname in obj._associations) {
            // Composition means it is in the Yaml File itself. So you need to create heirarchy.
            if (obj.definition.associations[aname].composition) {
                if (obj.definition.associations[aname].cardinality === 1) {
                    sobj[aname] = _saveObj(obj._associations[aname], objdir, false);
                } else {
                    sobj[aname] = [];
                    for (let j in obj._associations[aname]) {
                        let aobj = obj._associations[aname][j];
                        sobj[aname].push(_saveObj(aobj, objdir, false));
                    }
                    // Unique values only
                    sobj[aname] = [...new Set(sobj[aname])]
                }
            } else if (obj.definition.associations[aname].owner) {
                // Put the file with the name in the directory of owner?
                // This will be a new driectory in the parent directory and then save called on each on.
                if (obj.definition.associations[aname].cardinality === 1) {
                    // sobj[aname] = obj._associations[aname].id;
                    _persist([obj._associations[aname]], objdir + '/' + aname, false);
                } else {
                    _persist(obj._associations[aname], objdir + '/' + aname, false);
                }
            } else {
                // Just put the ID of the association in the aname
                // This will be saved another way.
                if (obj._associations.hasOwnProperty(aname)) {
                    if (obj.definition.associations[aname].cardinality === 1) {
                        sobj[aname] = obj._associations[aname].id;
                        _persist([obj._associations[aname]], '.', true);
                    } else {
                        sobj[aname] = [];
                        for (let j in obj._associations[aname]) {
                            let aobj = obj._associations[aname][j];
                            sobj[aname].push(aobj.id);
                        }
                        // Unique values only
                        sobj[aname] = [...new Set(sobj[aname])]
                        _persist(obj._associations[aname], '.', true);
                    }
                }
            }
        }
    }
    return sobj;
}

function _writeToFile(sobj, obj, basedir) {
    if (sobj.id) {
        let clsdir = path.resolve(`${rootDir}/${basedir}`);
        if (obj.definition.owners.length === 0) {
            clsdir = path.resolve(`${rootDir}/${obj.definition.name}`);
        }

        fs.mkdirSync(clsdir, {recursive: true});

        try {
            const data = YAML.stringify(sobj);
            const filename = path.resolve(clsdir + `/${sobj.id}.yaml`);
            fs.writeFileSync(filename, data);
        } catch (e) {
            console.error(e);
        }
    } else {
    }
}

