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
        // inputs contains the obj for the this method.
        let modelName = env.req.originalUrl.split(/\//)[1];
        // Remove the cls  from the inputs so they are not passed down to the constructor
        delete inputs.cls;
        let apath = path.resolve(__dirname + '/../../views/model/list.ejs');
        let str = fs.readFileSync(apath, 'utf8');
        let objs = [];
        let cls = AClass.getClass(modelName);
        if (global._instances) {
            objs = getInstances(AClass.getClass(modelName));
        }

        let sendString = renderer.renderString('default', str, {
            className: modelName,
            objs: objs,
            definition: AClass.getClass(modelName).definition,
            app: {name: 'edgemere'}
        });
        env.res.end(sendString);
    }
};

function getInstances(cls) {
    let retval = [];
    if (global._instances.hasOwnProperty(cls.definition.name)) {
        retval = global._instances[cls.definition.name];
    }
    for (let i in cls.definition.subClasses) {
        let instances = getInstances(AClass.getClass(cls.definition.subClasses[i]))
        for (let j in instances) {
            retval[instances[j].id] = instances[j];
        }
    }
    return retval;
}
