const fs = require('fs');
const path = require('path');
const AClass = require("ailtire/src/Server/AClass");

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    load: (obj) => _load(obj),
    loadClass: (cls) => _loadClass(cls),
    loadAll: () =>  _loadAll(),
    save: (obj) => _save(obj),
    find: (cls,args) => _find(cls, args)
}

function _find(cls, args) {
    // TBD - Search the filsystem for a match
    return null;
}

function _loadAll() {
    const basedir = path.resolve(global.ailtire.config.persist.basedir || '.database');

    // Iterate over the top level directories in the database. Only load the root classes.
    // Only partially load them. Do not load associations they have yet.
    let clsDirs = fs.readdirSync(basedir);
    for(let i in clsDirs) {
        const classPath = path.join(basedir, clsDirs[i]);
        if(isDirectory(classPath)) {
            _loadObjects(clsDirs[i], clsDirs[i]);
        }
    }
}

function _loadObjects(clsName, dir) {
    let basedir = global.ailtire.config.persist.basedir || '.database'
    let objDirs = fs.readdirSync(path.join(basedir, dir));

    for(let i in objDirs) {
        if(isDirectory(path.join(basedir, dir, objDirs[i]))) {
            let objDir = path.join(dir, objDirs[i])
            _loadObject(clsName, path.join(objDir, "index.json"));
        }
    }
}

function _loadObject(clsName, file) {
    let basedir = global.ailtire.config.persist.basedir || '.database'
    if(!file) {
        console.error("No file specified for object!");
        return null;
    }
    let txt = fs.readFileSync(path.resolve(basedir,file),'utf-8');
    let tempObj = JSON.parse(txt);
    let cls = AClass.getClass(tempObj._clsName);
    let obj = new cls({id: tempObj.id, _loading: true});

    try {
        for (let name in tempObj) {
            if (name[0] !== '_') {
                if (name === 'id') {
                    obj.id = tempObj[name];
                } else if (obj.definition.attributes.hasOwnProperty(name)) {
                    obj[name] = tempObj[name];
                } else if (obj.definition.associations.hasOwnProperty(name)) {
                    if (obj.definition.associations[name].cardinality === 1) {
                        obj._associations[name] = tempObj[name];
                    } else {
                        if (obj.definition.associations[name].unique) {
                            obj._associations[name] = {};
                            for (let j in tempObj[name]) {
                                tempObj[name][j]._notLoaded = true;
                                obj._associations[name][j] = {_persist: tempObj[name][j]};
                            }
                        } else {
                            obj._associations[name] = [];
                            for (let j in tempObj[name]) {
                                tempObj[name][j]._notLoaded = true;
                                obj._associations[name].push({_persist: tempObj[name][j]});
                            }
                        }
                    }
                }
            }
        }
        obj._state = tempObj._state;
        return obj;
    }
    catch(e) {
        console.error(`Error in loading object from ${file}:`, e);
        return null;
    }
}

function _load(obj) {
    obj._persist._notLoaded = false;
    return _loadObject(obj._persist._clsName, obj._persist._file);
}

function _loadClass(cls) {
    if(typeof cls === 'string') {
        cls = AClass.getClass(cls);
    }
    let clsName = cls.definition.name;
    let dname = path.resolve(global.ailtire.config.persist.basedir, clsName);
    if(fs.existsSync(dname)) {
        let files = fs.readdirSync(dname);
        for (let i in files) {
            try {
                let file = files[i];
                let fileName = path.resolve(dname, file, "index.json");
                let obj = new cls({_loading: true, _file: {_file: fileName, _clsName: clsName}});
                _load(obj);
            } catch(e) {
                console.error("Error Loading:", e);
            }
        }
    }
}

//////////////////////////////////
// When saving an object save the object in the directory based on the basedir and then the name of the class.
// Unless the object is a composition. If it is then the object's attributes are stored as JSON in the composition object.
// Also if the object is owned by another object then the directory of the parent is used as the base directory of the
// storage of the object.
// If a assocaition is composed and it has associations that are composed or owned the same rules  are folloowed.
// This can cause very deep nesting. But should not cause problems since the dirty flag is set.
// When an association is not owned or in a composition the filename is used as the reference. This ahould allow
// for lazy loading of the association as needed.
function _save(obj) {
    let basedir = global.ailtire.config.persist.basedir || '.database'

    if(obj._persist.composition) {
        obj._persist.dirty = false;
        let tempObj = _toJSONShallow(obj);
        obj._clsName = obj.className;
        return tempObj;
    } else if (obj._persist.owner) {
        if(!obj._persist.dirty) {
            return {_clsName: obj.className, _file: obj._persist.file};
        }
        obj._persist.dirty = false;
        let clsName = obj.className;
        // If the parent has not been saved yet. Then force it to so the directory is created.
        if(!obj._persist.owner._persist.directory) {
            _save(obj._persist.owner);
        }
        let dname = `${obj._persist.owner._persist.directory}/${clsName}/${obj.id}`;
        let tempObj = _toJSONShallow(obj);
        let retString = JSON.stringify(tempObj);
        let fname = `${dname}/index.json`;
        obj._persist.directory = dname;
        obj._persist.file = fname;
        let fullFileName = path.resolve(basedir, fname);
        let fullDirectoryName = path.resolve(basedir, dname).replace(/\\/g, '/');
        fs.mkdirSync(fullDirectoryName, { recursive: true });
        fs.writeFileSync(fullFileName, retString);
        return {_clsName: obj.className, _file: obj._persist.file};
    } else {
        if(!obj._persist.dirty) {
            return {_clsName: obj.className, _file: obj._persist.file};
        }
        obj._persist.dirty = false;
        let dname = `${obj.className}/${obj.id}`;
        let tempObj = _toJSONShallow(obj);
        let retString = JSON.stringify(tempObj);
        let fname = `${dname}/index.json`;
        obj._persist.directory = dname;
        obj._persist.file = fname;
        let fullFileName = path.resolve(basedir, fname);
        let fullDirectoryName = path.resolve(basedir, dname).replace(/\\/g, '/');
        fs.mkdirSync(fullDirectoryName, { recursive: true });
        fs.writeFileSync(fullFileName, retString);
        return {_clsName: obj.className, _file: obj._persist.file};
    }
}

function _toJSONShallow(obj) {
    let tempObj = { _clsName: obj.definition.name, id: obj.id, _state: obj._state };

    for(let aname in obj._attributes) {
        if(aname[0] !== '_') {
            tempObj[aname] = obj._attributes[aname];
        }
    }
    if(obj._associations) {
        for(let aname in obj._associations)  {
            // If composition is used then store the Object in the directory of the parent/owner of the object.
            if(aname[0] !== '_') {
                try {
                    if(obj.definition.associations.hasOwnProperty(aname)) {
                        if (obj.definition.associations[aname].cardinality === 1) {
                            tempObj[aname] = obj._associations[aname].save();
                        } else {
                            if (obj.definition.associations[aname].unique) {
                                tempObj[aname] = {};
                                for (let j in obj._associations[aname]) {
                                    let aobj = obj._associations[aname][j];
                                    tempObj[aname][j] = aobj.save();
                                }
                            } else {
                                tempObj[aname] = []
                                for (let j in obj._associations[aname]) {
                                    let aobj = obj._associations[aname][j];
                                    tempObj[aname].push(aobj.save());
                                }
                            }
                        }
                    }
                }
                catch(e) {
                    console.error("Error in saving:", aname, e);
                }
            }
        }
    }

    return tempObj;
}