const fs = require('fs');
const path = require('path');

const isDirectory = source => fs.lstatSync(source).isDirectory();
const isFile = source => !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    load: (objs) => {
        return _load(objs);
    },
    save: (objs) => {
        let savedObjs = {};
        let basedir = path.resolve(global.ailtire.config.persist.basedir);
        try {
            if(isDirectory(basedir)) {
                console.log("Storing in ", basedir);
            }
        }
        catch(e) {
            fs.mkdirSync(basedir, {recursive: true});
        }
        return _save(objs, savedObjs, basedir);
    }
}

function _load(objs) {

}

function _save(objs, savedObjs,basedir) {
    let retval = [];
    for(let i in objs) {
        let obj = objs[i];
        let sobj = _saveObj(obj,savedObjs,basedir);
        _saveToFile(sobj, obj, basedir);
        retval.push(sobj);
    }
    return retval;
}
function _saveObj(obj, savedObjs,basedir) {
    let sobj = {};
    if(!savedObjs.hasOwnProperty(obj.id)) {
        savedObjs[obj.id] = obj;

        if(obj._attributes) {
            for(let aname in obj._attributes) {
                sobj[aname] = obj._attributes[aname];
            }
        }
        if(obj._associations) {
            for(let aname in obj._associations)  {
                if(obj.definition.associations[aname].composition) {
                    if(obj.definition.associations[aname].cardinality === 1) {
                        sobj[aname] = _saveObj(obj._associations[aname], savedObjs, basedir);
                    } else {
                        sobj[aname] = [];
                        for(let j in obj._associations[aname]) {
                            let aobj = obj._associations[aname][j];
                            sobj[aname].push( _saveObj(aobj, savedObjs, basedir));
                        }
                    }
                } else if(obj.definition.associations[aname].owner) {
                    // Put the file with the name in the directory of owner?
                    if(obj.definition.associations[aname].cardinality === 1) {
                        sobj[aname] = obj._associations[aname].id;
                        _saveObj(obj._associations[aname], savedObjs, basedir);
                    } else {
                        sobj[aname] = [];
                        for(let j in obj._associations[aname]) {
                            let aobj = obj._associations[aname][j];
                            sobj[aname].push(aobj.id);
                            _saveObj(aobj, savedObjs);
                        }
                    }
                } else {
                    if(obj.definition.associations[aname].cardinality === 1) {
                        sobj[aname] = obj._associations[aname].id;
                        _saveObj(obj._associations[aname], savedObjs, basedir);
                    } else {
                        sobj[aname] = [];
                        for(let j in obj._associations[aname]) {
                            let aobj = obj._associations[aname][j];
                            sobj[aname].push(aobj.id);
                            _saveObj(aobj, savedObjs, basedir);
                        }
                    }
                }
            }
        }
    }
    return sobj;
}

function _saveToFile(sobj, obj, basedir) {
    let clsdir = path.resolve(basedir + '/' + obj.definition.name);
    try {
        if(isDirectory(clsdir)) {
        }
    }
    catch(e) {
        fs.mkdirSync(clsdir, {recursive:true});
    }
    try {
        const data = JSON.stringify(sobj);
        const filename = path.resolve(clsdir + `/${sobj.id}.json`);
        fs.writeFileSync(filename, data);
    }
    catch(e) {
        console.error(e);
    }
}

