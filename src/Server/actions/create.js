const path = require('path');

module.exports = {
    friendlyName: 'create',
    description: 'Create object of the class type',
    static: true, // True is for Class methods. False is for object based.
    inputs: {
        name: {
            description: 'Name of the object',
            type: 'string',
            required: false
        },
        file: {
            description: 'file with the definition',
            type: 'YAML', // string|boolean|number|json
            required: false
        },
    },

    exits: {
    },

    fn: function (inputs, env) {
        // inputs contains the obj for the this method.
        let modelName = env.req.originalUrl.split(/\//)[1];
        if(inputs.mode === 'json') {
            let newObj = new global.classes[modelName](env.req.body);
            let jobj = newObj.toJSON;
            global.io.emit(modelName + '.create', { obj: jobj });
            env.res.json({results: "Created Object"});
        }
        else {
            // Remove the cls  from the inputs so they are not passed down to the constructor
            let newObj = new global.classes[modelName](inputs);
            global.io.emit(modelName + '.create', { obj: newObj.toJSON });
            env.res.redirect(`/${modelName}?id=${newObj.id}`)
        }
    }
};
