const path = require('path');
const fs = require('fs');
const renderer = require('../../Documentation/Renderer.js');

module.exports = {
    friendlyName: 'new',
    description: 'New called for web interface',
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
        if(global._instances) {
            if (global._instances.hasOwnProperty(modelName)) {
                objs = global._instances[modelName];
            }
        }

        let sendString = renderer.renderString('default', str, {
            className: modelName,
            objs: objs,
            definition: global.classes[modelName].definition,
            app: {name: 'edgemere'}
        });
        env.res.end(sendString);
    }
};
