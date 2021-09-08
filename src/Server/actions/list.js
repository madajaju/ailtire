const path = require('path');
const fs = require('fs');
const renderer = require('../../Documentation/Renderer.js');
const AClass = require('../../Server/AClass');

module.exports = {
    friendlyName: 'list',
    description: 'List of model objects',
    static: true, // True is for Class methods. False is for object based.
    inputs: {},

    exits: {},

    fn: function (inputs, env) {

        let modelName = env.req.url.split(/\//)[1];
        // Remove the cls  from the inputs so they are not passed down to the constructor
        delete inputs.cls;
        let apath = path.resolve(__dirname + '/../../views/model/list.ejs');
        let str = fs.readFileSync(apath, 'utf8');
        let objs = [];
        let cls = AClass.getClass(modelName);
        if (global._instances) {
            objs = AClass.getInstances(modelName);
        }
        let hostURL = global.ailtire.config.host;
        if(global.ailtire.config.listenPort) {
            hostURL += ':' + global.ailtire.config.listenPort;
        }
        // hostURL += global.ailtire.config.urlPrefix;
        let cols = {};
        for(let aname in cls.definition.attributes) {
            let attr = cls.definition.attributes[aname];
            cols[aname] = { name: aname.charAt(0).toUpperCase() + aname.slice(1), description: attr.description, type:attr.type, multiline: attr.multiline };
        }
        for(let aname in cls.definition.associations) {
            let assoc = cls.definition.associations[aname];
            let acls = AClass.getClass(assoc.type);
            cols[aname] = {name:aname.charAt(0).toUpperCase() + aname.slice(1), description: assoc.description, type:assoc.type, cardinality:assoc.cardinality, package: acls.definition.package.shortname, owner: assoc.owner, composition: assoc.composition };
        }
        let items = {};
        for(let id in objs) {
            let obj = objs[id];
            let item = { id: obj.id, package: cls.definition.package.shortname, type: cls.definition.name, state: obj._state};
            for(let aname in cls.definition.attributes) {
                item[aname] = {name: obj[aname]};
            }
            for(let aname in cls.definition.associations) {
                let assoc = cls.definition.associations[aname];
                if(assoc.cardinality === 1) {
                    if(obj[aname]) {
                        // item[aname] = obj[aname].name;
                        item[aname] = {
                            id: obj[aname].id,
                            name: obj[aname].name,
                            type: obj[aname].definition.name,
                            link: `${assoc.type}?id=${obj[aname].id}`
                        };
                        for(let aaname in obj[aname].definition.attributes) {
                            item[aname][aaname] = obj[aname][aaname];
                        }
                    }
                }
                else {
                    let aitems = [];
                    for(let i in obj[aname]) {
                        aitems.push({
                            id: obj[aname][i].id,
                            name: obj[aname][i].name,
                            type: obj[aname][i].definition.name,
                            link: `${assoc.type}?id=${obj[aname][i].id}`});
                    }
                    item[aname] = {count: aitems.length, values: aitems};
                }
            }
            items[obj.id] = item;
        }
        let methods = {};
        let appName = global.ailtire.config.prefix;

        let allMethods = global.services[appName][cls.definition.name.toLowerCase()];
        // for(let fname in cls.definition.methods) {
        for(let fname in allMethods) {
            let linkName =`/${appName}/${cls.definition.name.toLowerCase()}/${fname}`;
            method = global.actions[linkName];
            methods[fname] = {
                name: method.friendlyName,
                description: method.description,
                link: linkName,
                inputs: method.inputs,
            }
        }
        let ritems = [];
        for(let i in items) {
            ritems.push(items[i]);
        }
        env.res.json({status:'success', name: cls.definition.name ,total:objs.length, records:ritems, columns:cols, methods:methods});
    }
};

