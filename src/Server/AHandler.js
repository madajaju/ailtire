const path = require("path");
const fs = require("fs");
const AClass = require("./AClass.js");

module.exports = {
    save: (action, dir) => {
        _save(action, dir);
    },
    checker: (pkg, handler) => {
        _checker(pkg, handler);
    },
    load: (file) => {
        _load(file);
    }
}

function _load(file) {

    let tempItem = require(file);
    let ename = tempItem.name;
    if (!global.handlers.hasOwnProperty(ename)) {
        global.handlers[ename] = {name: ename, handlers: []};
    }
    for (let j in tempItem.handlers) {
        let handler = tempItem.handlers[j];
        global.handlers[aname].handlers.push(handler);
    }
    return tempItem;
}

function _itemToString(item) {

    let retval = '{';
    for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'function') {
            retval += `"${key}": ${value.toString()},\n`;
        } else if (typeof value === 'object') {
            retval += `'${key}': ${_itemToString(value)},\n`;
        } else {
            retval += `"${key}": "${value}",\n`;
        }
    }
    retval += '}';
    return retval;
}

function _save(handler, package) {
    let cfile = path.resolve(`${package.definition.dir}/handlers/${handler.name}.js`);
    let dir = path.dirname(cfile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
    let output = `module.exports = ${_itemToString(handler)};`;
    fs.writeFileSync(cfile, output);
    package.definition.handlers[handler.name] = handler;
    _checker(package, handler);
    console.log("Saving Handler to file ", cfile);
    return true;
}

function _checker(pkg, handler) {
    
    let ename = handler.name;
    if (!global.events.hasOwnProperty(ename)) {
        global.events[ename] = {
            handlers: {},
        }
    }
    // Find the emitter.
    // Event syntax is ClassName.event
    const AClass = require("./AClass");
    let cls = AClass.getClass(ename.split(/\./)[0]);
    if (cls) {
        handler.emitter = cls;
        global.events[ename].emitter = cls;
        if (!cls.definition.hasOwnProperty('messages')) {
            cls.definition.messages = {};
        }
        cls.definition.messages[ename] = global.events[ename];
        if (!cls.definition.package.definition) {
            if (!global.ailtire.hasOwnProperty('error')) {
                global.ailtire.error = [];
            }
            global.ailtire.error.push({
                type: 'model.definition',
                object: {type: 'Model', id: cls.id, name: cls.name},
                message: "Class parent package definitition has a problem",
                data: cls.definition.package,
                lookup: 'package/list',
            });
            console.error("Class Definition package problem");
            console.error(cls.definition.package);
        }
        if (!cls.definition.package.definition.hasOwnProperty('messages')) {
            cls.definition.package.definition.messages = {};
        }
        cls.definition.package.definition.messages[ename] = global.events[ename];
    }
    global.events[ename].handlers[pkg.prefix] = handler;
}


