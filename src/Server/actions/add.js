const AClass = require('../AClass');

module.exports = {
    friendlyName: 'add',
    description: 'Add items to the object',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
        name: {
            description: 'Name of the object',
            type: 'string',
            required: false
        },
        items: {
            description: "Name of the items to add",
            type: 'string',
            required: false
        },
        file: {
            description: 'file with the definition of the items',
            type: 'YAML', // string|boolean|number|json
            required: false
        },
    },

    exits: {},

    fn: function (inputs, env) {
        // inputs contains the obj for the this method.
        let modelName = env.req.url.split(/\//)[1];
        if (inputs.mode === 'json') {
            // Items
            let name = env.req.body.name; // name of the object to add items.
            let obj = AClass.getClass(modelName).find(name);
            if (!obj) {
                env.res.json({results: `Could not find ${modelName} named ${name}`});
                return;
            }
            if (env.req.body.hasOwnProperty('items')) {
                let items = env.req.body.items.split(',');
                let assoc = obj.definition.associations[this.assocName];
                let assocClass = assoc.type;
                for (let i in items) {
                    let item = AClass.getClass(assocClass).find(items[i]);
                    if (item) {
                        obj.add(this.assocName, item);
                        if (assoc.via) {
                            item[assoc.via] = obj;
                        }
                    } else {
                        console.error("Item not found:", items[i]);
                    }
                }
            } else if (env.req.body.hasOwnProperty('file')) {
                // Call the create with the file passed in
                let assoc = obj.definition.associations[this.assocName];
                let assocClass = assoc.type;
                let item = new AClass.getClass(assocClass)({file: env.req.body.file});
                if (item) {
                    obj.add(this.assocName, item);
                    if (assoc.via) {
                        item[assoc.via] = obj;
                    }
                } else {
                    console.error("Could not create item:");
                }
            }
            // let newObj = new AClass.getClass(modelName)(env.req.body);
            let jobj = obj.toJSON;
            global.io.emit(modelName + '.update', {obj: jobj});
            env.res.json({results: "Add items to: " + obj.name});
        } else {
            // TODO: Add the ability to add objects via the website.
            // Remove the cls  from the inputs so they are not passed down to the constructor
            let newObj = new AClass.getClass(modelName)(inputs);
            global.io.emit(modelName + '.create', {obj: newObj.toJSON});
            env.res.redirect(`/${modelName}?id=${newObj.id}`)
        }
    }
};
