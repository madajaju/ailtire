const path = require('path');
const AEvent = require('../AEvent');

module.exports = {
    friendlyName: 'new',
    description: 'New called for web interface',
    static: true, // True is for Class methods. False is for object based.
    inputs: {
        cls: {
            description: 'Class to use for the object new',
            type: 'string', // string|boolean|number|json
            required: true
        },
    },

    exits: {
    },

    fn: function (inputs, env) {
        // inputs contains the obj for the this method.
        let modelName = env.req.originalUrl.split(/\//)[1];
        // Remove the cls  from the inputs so they are not passed down to the constructor
        delete inputs.cls;
        AEvent.emit(modelName + '.destroy', { obj: newObj.toJSON });
        console.log("Made it here delete:", inputs.cls);
        env.res.redirect(`/${modelName}/list`);
    }
};
