const AClass = require('../../Server/AClass');

module.exports = {
    friendlyName: 'show',
    description: 'Show called for web interface',
    static: true, // True is for Class methods. False is for object based.
    inputs: {},

    exits: {},

    fn: function (inputs, env) {
        // inputs contains the obj for the this method.
        let modelName = env.req.url.split(/[\/\?]/)[1];
        let cls = AClass.getClass(modelName);
        /*
        let hostURL = global.ailtire.config.host;
        if (global.ailtire.config.listenPort) {
            hostURL += ':' + global.ailtire.config.listenPort;
        }
         */
        let cols = {};
        for (let aname in cls.definition.attributes) {
            let attr = cls.definition.attributes[aname];
            cols[aname] = {name: aname, description: attr.description, type: attr.type};
        }
        for (let aname in cls.definition.associations) {
            let assoc = cls.definition.associations[aname];
            let acls = AClass.getClass(assoc.type);
            cols[aname] = {
                name: aname,
                description: assoc.description,
                type: assoc.type,
                cardinality: assoc.cardinality,
                package: acls.definition.package.shortname,
                owner: assoc.owner,
                composite: assoc.composite
            };
        }
        let obj = cls.find(env.req.query.id);
        if (obj) {
            let item = {
                _id: obj.id,
                _name: obj.name || obj.id,
                _package: cls.definition.package.shortname,
                _type: cls.definition.name,
                _state: obj._state
            };
            for (let aname in cls.definition.attributes) {
                item[aname] = {name: obj[aname]};
            }
            for (let aname in cls.definition.associations) {
                let assoc = cls.definition.associations[aname];
                if (assoc.cardinality === 1) {
                    if (obj[aname]) {
                        // item[aname] = obj[aname].name;
                        item[aname] = {
                            _id: obj[aname].id,
                            _name: obj[aname].name || obj[aname].id,
                            _type: obj[aname].definition.name,
                            _link: `${assoc.type}?id=${obj[aname].id}`,
                            _state: obj[aname]._state,
                        };
                        for (let aaname in obj[aname].definition.attributes) {
                            item[aname][aaname] = obj[aname][aaname];
                        }
                    }
                } else {
                    let aitems = [];
                    for (let i in obj[aname]) {
                        let mitem = {
                            _id: obj[aname][i].id,
                            _name: obj[aname][i].name || obj[aname][i].id,
                            _type: obj[aname][i].definition.name,
                            _link: `${assoc.type}?id=${obj[aname][i].id}`,
                            _state: obj[aname][i]._state,
                        };
                        for (let aaname in obj[aname][i].definition.attributes) {
                            mitem[aaname] = obj[aname][i][aaname];
                        }
                        for (let aaname in obj[aname][i].definition.associations) {
                            let aassoc = obj[aname][i].definition.associations[aaname];
                            if (aassoc.cardinality === 1) {
                                if (obj[aname][i][aaname]) {
                                    mitem[aaname] = obj[aname][i][aaname].name;
                                }
                            }
                        }
                        aitems.push(mitem);
                    }
                    item[aname] = {count: aitems.length, values: aitems};
                }
            }
            env.res.json({status: 'success', total: 1, record: item, columns: cols});
        } else {
            env.res.json({status: 'success', total: 0, record: [], columns: cols});
        }
    }
};
