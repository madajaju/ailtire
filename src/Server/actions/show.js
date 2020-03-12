const path = require('path');
const fs = require('fs');
const renderer = require('../../Documentation/Renderer.js');

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
        let modelName = env.req.baseUrl.split(/\//)[1];
        // Remove the cls  from the inputs so they are not passed down to the constructor
        let apath = path.resolve(__dirname + '/../../views/model/show.ejs');
        let str = fs.readFileSync(apath, 'utf8');
        let obj = global.classes[modelName].find(env.req.query.id);
        obj.package = obj.definition.package.name.replace(/ /g, '');
        let sendString = renderer.renderString('default', str, {className: modelName, obj: obj, definition: global.classes[modelName].definition, app: {name:'edgemere'}} );
        env.res.end(sendString);
    }
};
