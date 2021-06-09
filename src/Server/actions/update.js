const path = require('path');
const AEvent = require('../AEvent');
const AClass = require('../AClass');

module.exports = {
    friendlyName: 'new',
    description: 'New called for web interface',
    static: true, // True is for Class methods. False is for object based.
    inputs: {},

    exits: {},

    fn: function (inputs, env) {
        // inputs contains the obj for the this method.
        let modelName = env.req.url.split(/\//)[1];
        for(let i in env.req.body) {
            inputs[i] = env.req.body[i];
        }
        // Remove the cls  from the inputs so they are not passed down to the constructor
        let obj = null;
        let cls = AClass.getClass(modelName);
        if(inputs.hasOwnProperty('id')) {
            obj = cls.find(inputs.id);
        }
        else if(inputs.hasOwnProperty('name')) {
            obj = cls.find(inputs.name);
        }
        // Create a new object if it cannot be found
        if(!obj) {
            obj = new cls(env.req.body);
        }
        for(let i in inputs) {
            if(i !== 'mode') {
                obj[i] = inputs[i];
            }
        }
        AEvent.emit(modelName + '.updated', {obj: obj.toJSON});
        if(inputs.mode === 'json') {
            env.res.json({results: "Updated Object"});
            return obj;
        }
        if(env.res) {
            env.res.redirect(`/${modelName}?id=${obj.id}`)
        }
    }
};
