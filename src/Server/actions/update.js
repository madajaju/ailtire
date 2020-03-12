const path = require('path');

module.exports = {
    friendlyName: 'new',
    description: 'New called for web interface',
    static: true, // True is for Class methods. False is for object based.
    inputs: {
    },

    exits: {
    },

    fn: function (inputs, env) {
        // inputs contains the obj for the this method.
        let modelName = env.req.originalUrl.split(/\//)[1];
        // Remove the cls  from the inputs so they are not passed down to the constructor
        delete inputs.cls;
        let newObj = new global.classes[modelName](inputs);
        console.log("Made it here create:", newObj);
        env.res.redirect(`/${modelName}?id=${newObj.id}`)
    }
};
