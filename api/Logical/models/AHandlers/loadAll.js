const path = require('path');
const fs = require("fs");

const isDirectory = source => fs.existsSync(source) && fs.lstatSync(source).isDirectory();
const isFile = source => fs.existsSync(source) && !fs.lstatSync(source).isDirectory();
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);
const getFiles = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isFile);

module.exports = {
    friendlyName: 'loadAll',
    description: 'Load All of the classes from the directory',
    static: true,
    inputs: {
        package: {
            description: 'Package of the interfaces',
            type: 'string',
            required: true
        },
    },

    exits: {
    },

    fn: function (inputs, env) {
        const package = inputs.package;
        const dir = path.resolve(package.dir, "handlers");
        if(fs.existsSync(dir)) {
            let handlers = getFiles(dir);
            for (let i in handlers) {
                let file = handlers[i];
                AHandlers.load({package: inputs.package, file: file});
            }
        }
    }
};

