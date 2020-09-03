const path = require('path');
const fs = require('fs');
const renderer = require('../../Documentation/Renderer.js');
const AClass = require('../../Server/AClass');

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
        let apath = path.resolve(__dirname + '/../../views/model/new.ejs');
        let str = fs.readFileSync(apath, 'utf8');
        let sendString = renderer.renderString('default', str, {className: modelName, definition: AClass.getClass(modelName).definition, app: {name:'edgemere'}} );
        env.res.end(sendString);
    }
};
