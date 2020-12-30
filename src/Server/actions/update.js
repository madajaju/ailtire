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
        if(inputs.hasOwnProperty('id')) {
            let cls = AClass.getClass(modelName);
            obj = cls.find(inputs.id);
        }
        else if(inputs.hasOwnProperty('name')) {
            let cls = AClass.getClass(modelName);
            obj = cls.find(inputs.name);
        }
        else {
            env.res.json({error:"Could not find the item"});
            return;
        }
        for(let i in inputs) {
            if(i !== 'mode') {
                obj[i] = inputs[i];
            }
        }
        AEvent.emit(modelName + '.updated', {obj: obj.toJSON});
        if(inputs.mode === 'json') {
            env.res.json({obj:obj});
            return;
        }
        env.res.redirect(`/${modelName}?id=${obj.id}`)
    }
};
