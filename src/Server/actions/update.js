const path = require('path');
const AEvent = require('../AEvent');
const AClass = require('../AClass');

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
        let newObj = new AClass.getClass(modelName)(inputs);
        AEvent.emit(modelName + '.updated', { obj: newObj.toJSON });
        env.res.redirect(`/${modelName}?id=${newObj.id}`)
    }
};
