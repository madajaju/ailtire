const path = require('path');
const fs = require('fs');
const renderer = require('../../Documentation/Renderer.js');
const AClass = require('../../Server/AClass');

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
        let modelName = env.req.url.split(/[\/\?]/)[1];
        // Remove the cls  from the inputs so they are not passed down to the constructor
        // look in the views path of the project for an override view first.
        let apath = path.resolve(`./views/${modelName}/show.ejs`)
        if(!fs.existsSync(apath)) {
            // If it is not found then go to the default.
            apath = path.resolve(__dirname + '/../../views/model/show.ejs');
        }
        if(!global.classes.hasOwnProperty(modelName)) {
           env.res.end("Class Not Found! " + modelName) ;
           return;
        }
        let str = fs.readFileSync(apath, 'utf8');
        let obj = AClass.getClass(modelName).find(env.req.query.id);
        obj.package = obj.definition.package.name.replace(/ /g, '');
        let sendString = renderer.renderString('default', str, {className: modelName, obj: obj, definition: AClass.getClass(modelName).definition, app: {name:'edgemere'}} );
        env.res.end(sendString);
    }
};
